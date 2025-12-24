import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";

const RegisterProviderSchema = z.object({
  provider_id: z.string().min(8),
  business_name: z.string().min(1),
  business_type: z.enum(["INDIVIDUAL", "COMPANY", "FRANCHISE"]),
  contact_name: z.string().optional(),
  contact_email: z.string().email(),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  service_area: z.any().optional(),
  public_key_pem: z.string().min(50),
  service_domains: z.array(z.string()),
  service_types: z.array(z.string()),
  hourly_rate_cents: z.number().int().optional(),
  minimum_fee_cents: z.number().int().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = RegisterProviderSchema.parse(body);

    // Check if provider already exists
    const existing = await prisma.provider.findUnique({
      where: { providerId: input.provider_id },
    });

    if (existing) {
      return NextResponse.json({ error: "Provider ID already registered" }, { status: 409 });
    }

    const provider = await prisma.provider.create({
      data: {
        providerId: input.provider_id,
        businessName: input.business_name,
        businessType: input.business_type,
        contactName: input.contact_name,
        contactEmail: input.contact_email,
        contactPhone: input.contact_phone,
        address: input.address,
        city: input.city,
        state: input.state,
        zip: input.zip,
        serviceArea: input.service_area,
        publicKeyPem: input.public_key_pem,
        serviceDomains: input.service_domains,
        serviceTypes: input.service_types,
        hourlyRateCents: input.hourly_rate_cents,
        minimumFeeCents: input.minimum_fee_cents,
        status: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PROVIDER_REGISTERED",
        resourceType: "provider",
        resourceId: provider.id,
        details: { provider_id: provider.providerId, business_name: provider.businessName },
      },
    });

    return NextResponse.json({
      id: provider.id,
      provider_id: provider.providerId,
      business_name: provider.businessName,
      status: provider.status,
      created_at: provider.createdAt.toISOString(),
    }, { status: 201 });

  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.issues }, { status: 400 });
    }
    console.error("Provider registration error:", e);
    return NextResponse.json({ error: "Failed to register provider" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const domain = searchParams.get("domain");
    const serviceType = searchParams.get("service_type");
    const city = searchParams.get("city");

    const where: any = {};
    if (status) where.status = status;
    if (domain) where.serviceDomains = { has: domain };
    if (serviceType) where.serviceTypes = { has: serviceType };
    if (city) where.city = city;

    const providers = await prisma.provider.findMany({
      where,
      include: {
        licenses: { where: { verified: true } },
        _count: { select: { reviews: true, workOrders: true } },
      },
      orderBy: { rating: "desc" },
      take: 100,
    });

    return NextResponse.json({
      providers: providers.map((p) => ({
        id: p.id,
        provider_id: p.providerId,
        business_name: p.businessName,
        business_type: p.businessType,
        status: p.status,
        rating: p.rating,
        review_count: p._count.reviews,
        completed_jobs: p._count.workOrders,
        service_domains: p.serviceDomains,
        service_types: p.serviceTypes,
        city: p.city,
        state: p.state,
        hourly_rate_cents: p.hourlyRateCents,
        licenses: p.licenses.map((l) => l.licenseType),
      })),
      total: providers.length,
    });
  } catch (e: any) {
    console.error("List providers error:", e);
    return NextResponse.json({ error: "Failed to list providers" }, { status: 500 });
  }
}
