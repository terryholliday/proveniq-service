import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * POST /api/stripe/webhook - Handle Stripe webhook events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("[Stripe Webhook] Signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received: ${event.type}`);

    switch (event.type) {
      case "account.updated":
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case "account.application.deauthorized":
        await handleAccountDeauthorized(event.data.object as Stripe.Account);
        break;

      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "transfer.created":
        await handleTransferCreated(event.data.object as Stripe.Transfer);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const providerId = account.metadata?.provider_id;
  if (!providerId) {
    console.warn("[Stripe Webhook] account.updated: No provider_id in metadata");
    return;
  }

  const provider = await prisma.provider.findFirst({
    where: { providerId },
  });

  if (!provider) {
    console.warn(`[Stripe Webhook] Provider not found: ${providerId}`);
    return;
  }

  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      stripeOnboarded: account.details_submitted || false,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
    },
  });

  // Log status change
  await prisma.auditLog.create({
    data: {
      action: "STRIPE_ACCOUNT_UPDATED",
      resourceType: "provider",
      resourceId: provider.id,
      details: {
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
      },
    },
  });

  console.log(`[Stripe Webhook] Provider ${providerId} account updated: charges=${account.charges_enabled}, payouts=${account.payouts_enabled}`);
}

async function handleAccountDeauthorized(account: Stripe.Account) {
  const providerId = account.metadata?.provider_id;
  if (!providerId) return;

  const provider = await prisma.provider.findFirst({
    where: { providerId },
  });

  if (provider) {
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        stripeOnboarded: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      },
    });

    console.log(`[Stripe Webhook] Provider ${providerId} deauthorized`);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const workOrderId = paymentIntent.metadata?.work_order_id;
  if (!workOrderId) {
    console.warn("[Stripe Webhook] payment_intent.succeeded: No work_order_id in metadata");
    return;
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { provider: true },
  });

  if (!workOrder) {
    console.warn(`[Stripe Webhook] Work order not found: ${workOrderId}`);
    return;
  }

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
    },
  });

  // Log payment event
  await prisma.workOrderEvent.create({
    data: {
      workOrderId,
      eventType: "PAYMENT_RECEIVED",
      description: `Payment of $${(paymentIntent.amount / 100).toFixed(2)} received`,
      actorType: "system",
      payload: {
        payment_intent_id: paymentIntent.id,
        amount_cents: paymentIntent.amount,
      },
    },
  });

  console.log(`[Stripe Webhook] Payment succeeded for work order ${workOrder.workOrderNumber}`);
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const workOrderId = paymentIntent.metadata?.work_order_id;
  if (!workOrderId) return;

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      paymentStatus: "FAILED",
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId,
      eventType: "PAYMENT_FAILED",
      description: `Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}`,
      actorType: "system",
      payload: {
        payment_intent_id: paymentIntent.id,
        error: paymentIntent.last_payment_error?.message,
      },
    },
  });

  console.log(`[Stripe Webhook] Payment failed for work order ${workOrderId}`);
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  const workOrderId = transfer.metadata?.work_order_id;
  if (!workOrderId) return;

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: {
      paymentStatus: "PAYOUT_COMPLETED",
      payoutAt: new Date(),
    },
  });

  await prisma.workOrderEvent.create({
    data: {
      workOrderId,
      eventType: "PAYOUT_COMPLETED",
      description: `Provider payout of $${(transfer.amount / 100).toFixed(2)} completed`,
      actorType: "system",
      payload: {
        transfer_id: transfer.id,
        amount_cents: transfer.amount,
        destination: transfer.destination,
      },
    },
  });

  console.log(`[Stripe Webhook] Payout completed for work order ${workOrderId}`);
}
