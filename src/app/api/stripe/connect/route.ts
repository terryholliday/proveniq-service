import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const PLATFORM_FEE_PERCENT = 15; // 15% platform fee

/**
 * POST /api/stripe/connect - Create Stripe Connect Express account for provider
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider_id } = body;

    if (!provider_id) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    // Get provider
    const provider = await prisma.provider.findFirst({
      where: { providerId: provider_id },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Check if already has Stripe account
    if (provider.stripeAccountId) {
      // Return existing account link for re-onboarding if needed
      const accountLink = await stripe.accountLinks.create({
        account: provider.stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/stripe/refresh?provider_id=${provider_id}`,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/stripe/complete?provider_id=${provider_id}`,
        type: "account_onboarding",
      });

      return NextResponse.json({
        account_id: provider.stripeAccountId,
        onboarding_url: accountLink.url,
        message: "Existing account - continue onboarding",
      });
    }

    // Create new Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: provider.contactEmail,
      business_type: provider.businessType === "INDIVIDUAL" ? "individual" : "company",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        provider_id: provider_id,
        provider_internal_id: provider.id,
        platform: "proveniq-service",
      },
    });

    // Update provider with Stripe account ID
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        stripeAccountId: account.id,
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/stripe/refresh?provider_id=${provider_id}`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/provider/stripe/complete?provider_id=${provider_id}`,
      type: "account_onboarding",
    });

    // Log event
    await prisma.auditLog.create({
      data: {
        action: "STRIPE_ACCOUNT_CREATED",
        resourceType: "provider",
        resourceId: provider.id,
        actorId: provider_id,
        details: { stripe_account_id: account.id },
      },
    });

    return NextResponse.json({
      account_id: account.id,
      onboarding_url: accountLink.url,
      message: "Stripe Connect account created. Redirect provider to onboarding URL.",
    }, { status: 201 });

  } catch (error: any) {
    console.error("[Stripe Connect] Create account error:", error);
    return NextResponse.json({ 
      error: "Failed to create Stripe account",
      message: error?.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/stripe/connect - Get provider's Stripe account status
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get("provider_id");

    if (!providerId) {
      return NextResponse.json({ error: "provider_id is required" }, { status: 400 });
    }

    const provider = await prisma.provider.findFirst({
      where: { providerId },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    if (!provider.stripeAccountId) {
      return NextResponse.json({
        has_stripe_account: false,
        onboarded: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    // Get account from Stripe
    const account = await stripe.accounts.retrieve(provider.stripeAccountId);

    // Update local status if changed
    if (
      provider.chargesEnabled !== account.charges_enabled ||
      provider.payoutsEnabled !== account.payouts_enabled
    ) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: {
          chargesEnabled: account.charges_enabled || false,
          payoutsEnabled: account.payouts_enabled || false,
          stripeOnboarded: account.details_submitted || false,
        },
      });
    }

    return NextResponse.json({
      has_stripe_account: true,
      account_id: provider.stripeAccountId,
      onboarded: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      requirements: account.requirements,
    });

  } catch (error: any) {
    console.error("[Stripe Connect] Get status error:", error);
    return NextResponse.json({ 
      error: "Failed to get Stripe account status",
      message: error?.message 
    }, { status: 500 });
  }
}
