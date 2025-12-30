import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db";
import { isAdminActor, requireFirebaseActor } from "@/lib/auth/requireFirebaseActor";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const PLATFORM_FEE_PERCENT = 15; // 15% platform fee

/**
 * POST /api/stripe/payment-intent - Create payment intent for work order
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await requireFirebaseActor(req);
    if (!isAdminActor(actor)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const { work_order_id, customer_id } = body;

    if (!work_order_id) {
      return NextResponse.json({ error: "work_order_id is required" }, { status: 400 });
    }

    // Get work order with provider
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: work_order_id },
      include: { provider: true },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    if (!workOrder.provider) {
      return NextResponse.json({ error: "Work order has no assigned provider" }, { status: 400 });
    }

    if (!workOrder.provider.stripeAccountId) {
      return NextResponse.json({ error: "Provider has not completed Stripe onboarding" }, { status: 400 });
    }

    if (!workOrder.provider.chargesEnabled) {
      return NextResponse.json({ error: "Provider's Stripe account is not active" }, { status: 400 });
    }

    // Check if payment intent already exists
    if (workOrder.stripePaymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(workOrder.stripePaymentIntentId);
      if (existingIntent.status !== "canceled") {
        return NextResponse.json({
          client_secret: existingIntent.client_secret,
          payment_intent_id: existingIntent.id,
          status: existingIntent.status,
          message: "Existing payment intent returned",
        });
      }
    }

    // Calculate amounts
    const totalAmount = workOrder.finalCostCents || workOrder.estimatedCents || 0;
    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Work order has no cost set" }, { status: 400 });
    }

    const platformFee = Math.round(totalAmount * (PLATFORM_FEE_PERCENT / 100));
    const providerPayout = totalAmount - platformFee;

    // Create PaymentIntent with split payment
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      payment_method_types: ["card"],
      transfer_data: {
        destination: workOrder.provider.stripeAccountId,
      },
      application_fee_amount: platformFee,
      metadata: {
        work_order_id: workOrder.id,
        work_order_number: workOrder.workOrderNumber,
        provider_id: workOrder.provider.providerId,
        customer_id: customer_id || workOrder.requestorId,
        platform: "proveniq-service",
      },
      statement_descriptor_suffix: "PROVENIQ SVC",
    });

    // Update work order with payment info
    await prisma.workOrder.update({
      where: { id: work_order_id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        platformFeeCents: platformFee,
        providerPayoutCents: providerPayout,
        paymentStatus: "AWAITING_PAYMENT",
      },
    });

    // Log event
    await prisma.workOrderEvent.create({
      data: {
        workOrderId: work_order_id,
        eventType: "PAYMENT_INITIATED",
        description: `Payment intent created for $${(totalAmount / 100).toFixed(2)}`,
        actorType: "system",
        payload: {
          payment_intent_id: paymentIntent.id,
          total_cents: totalAmount,
          platform_fee_cents: platformFee,
          provider_payout_cents: providerPayout,
        },
      },
    });

    console.log(`[Stripe] Created PaymentIntent ${paymentIntent.id} for work order ${workOrder.workOrderNumber}`);

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: totalAmount / 100,
      platform_fee: platformFee / 100,
      provider_payout: providerPayout / 100,
      currency: "USD",
    }, { status: 201 });

  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[Stripe] Create payment intent error:", error);
    return NextResponse.json({ 
      error: "Failed to create payment intent",
      message: error?.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/stripe/payment-intent - Get payment status for work order
 */
export async function GET(req: NextRequest) {
  try {
    const actor = await requireFirebaseActor(req);
    if (!isAdminActor(actor)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const workOrderId = searchParams.get("work_order_id");

    if (!workOrderId) {
      return NextResponse.json({ error: "work_order_id is required" }, { status: 400 });
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: {
        id: true,
        workOrderNumber: true,
        paymentStatus: true,
        stripePaymentIntentId: true,
        platformFeeCents: true,
        providerPayoutCents: true,
        finalCostCents: true,
        paidAt: true,
        payoutAt: true,
      },
    });

    if (!workOrder) {
      return NextResponse.json({ error: "Work order not found" }, { status: 404 });
    }

    let stripeStatus = null;
    if (workOrder.stripePaymentIntentId) {
      try {
        const intent = await stripe.paymentIntents.retrieve(workOrder.stripePaymentIntentId);
        stripeStatus = intent.status;
      } catch (e) {
        console.warn(`[Stripe] Could not retrieve payment intent: ${workOrder.stripePaymentIntentId}`);
      }
    }

    return NextResponse.json({
      work_order_id: workOrder.id,
      work_order_number: workOrder.workOrderNumber,
      payment_status: workOrder.paymentStatus,
      stripe_status: stripeStatus,
      total_cents: workOrder.finalCostCents,
      platform_fee_cents: workOrder.platformFeeCents,
      provider_payout_cents: workOrder.providerPayoutCents,
      paid_at: workOrder.paidAt?.toISOString(),
      payout_at: workOrder.payoutAt?.toISOString(),
    });

  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("[Stripe] Get payment status error:", error);
    return NextResponse.json({ 
      error: "Failed to get payment status",
      message: error?.message 
    }, { status: 500 });
  }
}
