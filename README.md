# College Space — Yale

A little more space for life at Yale.

College Space — Yale is a student marketplace for two kinds of underused space around campus: temporary storage, and legal off-street parking. Grok SpaceMatch turns an ordinary description into a structured request, then ranks fictional demo listings that actually fit.

This repository is a new implementation for the Yale Grokathon. The product concept comes from earlier College Space work. The concept was not invented during the hackathon, and this app does not reuse that codebase or any previous production deployment.

## Features

- Grok SpaceMatch for storage, including item fit, monthly budget, neighborhood, and access
- Grok SpaceMatch for parking, including dates, vehicle size, overnight rules, and a total for the whole stay
- Marketplace browsing with storage and parking filters
- Listing pages with the limits a renter actually needs
- Host listing assistant that drafts copy without inventing facts
- Simulated booking requests saved in the browser, clearly labeled as demos

Listings, hosts, prices, dates, and photos are fictional. Photos are stock images, not the spaces. Nothing is verified, and Yale University is not involved.

## Built with Grok

Grok was used in Cursor to design and write this application. SpaceMatch and the host assistant call the xAI API server-side with the `grok-4.7` model when `XAI_API_KEY` is set. Structured output is validated with Zod before it can affect results. If the key is missing, or the model response fails validation, the app uses an on-device parser and says so. That fallback is not represented as Grok inference.

### Screenshot

The required screenshot of Grok being used in Cursor has not been added yet. Save it as `docs/images/grok-cursor.png` and it can be embedded as:

`![Grok being used in Cursor](docs/images/grok-cursor.png)`

Do not commit an API key, and do not paste one into chat.

## Architecture

1. A renter describes a stay on `/spacematch`.
2. `POST /api/spacematch` asks Grok for a structured request.
3. Zod validates that JSON. Explicit dates and prices in the message fill any gaps.
4. Deterministic code applies hard rules: category, availability, budget maximums, vehicle size, overnight parking, item restrictions, and rough capacity.
5. Eligible listings are scored from location, price for the full stay, fit, availability, and access.
6. Grok writes a short explanation from those facts only. A listing the model invents is discarded. An explanation that cites an unknown price falls back to a fact-based summary.

Demo inventory lives in `data/listings.ts`. Replacing that module is the path to a real database later. Payments are out of scope.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Environment variables, server-side only:

| Name | Purpose |
| --- | --- |
| `XAI_API_KEY` | xAI API key. Never use a `NEXT_PUBLIC_` prefix. |
| `XAI_MODEL` | Optional. Defaults to `grok-4.7`. |

## Demo

Open SpaceMatch and try a storage request:

> I'm going home for the summer and need to store a mini-fridge, two suitcases, and four boxes near Old Campus from May 15, 2027 to August 15, 2027 for around $100 a month.

Then a parking request. The dates below are an example range, not Yale's official calendar:

> My family is visiting for Yale graduation and needs a driveway spot within walking distance of Old Campus from May 22, 2027 in the morning through May 24, 2027 in the afternoon. We have an SUV and would prefer to spend under $100 total.

Closets that forbid appliances, and driveway spots that cannot keep a car overnight, should stay out of the recommendations.

## Deployment

The app is a Next.js project and should be deployed as a new Vercel project connected to `arohinair1/grok`. Do not attach it to any earlier College Space project.

Set `XAI_API_KEY` in Vercel for Production and Preview, then redeploy. The live URL will be added here once that deployment is confirmed.

## Scripts

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Pitch

Yale students leave campus with more than they can carry, and visitors still need a legal place to put a car. College Space connects those needs with unused closets and private driveways. Grok SpaceMatch reads a sentence, applies the real constraints, and explains the fit. The same idea can travel to other campuses. This demo uses fictional listings only. There are no real users, bookings, or partnerships to claim.
