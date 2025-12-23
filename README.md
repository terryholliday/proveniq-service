# PROVENIQ Service

**The Vendor Network — Licensed Service Marketplace**

Connects asset owners with verified service providers. License validation, work order management, and provenance tracking.

## Architecture

```
Properties/Home/Ops → [Create Work Order] → Service → [Assign Provider] → Complete → Ledger
       ↓                      ↓                 ↓              ↓
  Maintenance Req       License Check      Schedule      Evidence + Cost
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL + Prisma
- **Validation:** Zod
- **Port:** 3008 (frontend), DB: 5437

## Quick Start

```bash
npm install
cp .env.example .env
npm run db:push
npm run dev
```

## API Endpoints

### Providers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/providers` | Register provider |
| `GET` | `/api/providers` | List/search providers |

### Work Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/work-orders` | Create work order |
| `GET` | `/api/work-orders` | List work orders |
| `GET` | `/api/work-orders/[id]` | Get work order details |
| `PATCH` | `/api/work-orders/[id]` | Update/assign/schedule |
| `POST` | `/api/work-orders/[id]/complete` | Submit completion |

## License Matrix

| Domain | Service Type | Required Licenses |
|--------|--------------|-------------------|
| AUTOMOTIVE | MAINTENANCE | ASE_CERTIFIED, ASE_MASTER, OEM_CERTIFIED |
| AUTOMOTIVE | REPAIR | ASE_MASTER, OEM_CERTIFIED |
| RESIDENTIAL | MAINTENANCE | LICENSED_HANDYMAN, PLUMBER, ELECTRICIAN |
| RESIDENTIAL | REPAIR | LICENSED_PLUMBER, ELECTRICIAN, GC_LICENSE |
| MARINE | ALL | MARINE_TECH_CERT |
| AVIATION | ALL | A_AND_P, IA |

## Work Order Flow

1. **CREATED** → Work order submitted
2. **PENDING_ASSIGNMENT** → Finding provider
3. **ASSIGNED** → Provider accepted
4. **SCHEDULED** → Time confirmed
5. **IN_PROGRESS** → Work started
6. **PENDING_APPROVAL** → Work completed, awaiting approval
7. **COMPLETED** → Approved and closed

## Database Models

- **Provider** — Service vendors with licenses, ratings, service areas
- **License** — Verified credentials per provider
- **WorkOrder** — Service requests with full lifecycle
- **WorkOrderEvent** — Audit trail
- **Review** — Provider ratings

## Integrations

| Service | Purpose |
|---------|---------|
| **Ledger (8006)** | Work order events, completion evidence |
| **Properties (8001)** | Maintenance ticket source |
| **Home (9003)** | Landlord fixture service requests |
| **Core (8000)** | Asset registry lookup |

## Environment Variables

```env
DATABASE_URL=postgresql://...
LEDGER_API_URL=http://localhost:8006/api/v1
PROPERTIES_API_URL=http://localhost:8001/api/v1
CORE_API_URL=http://localhost:8000
```

## License

Proprietary — PROVENIQ Inc.
