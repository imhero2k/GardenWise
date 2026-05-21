# 🌿 RootVio 

> **Grow Smart. Garden Responsibly.**  
> A Victorian-focused ecological gardening web application connecting residents with bioregion-matched native plant recommendations, AI-assisted weed identification, interactive garden planning, and Indigenous nursery discovery.

[![Live App](https://img.shields.io/badge/Live%20App-rootivio.app-2D6A4F?style=for-the-badge&logo=vercel&logoColor=white)](https://rootivio.app/iteration3)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/lambda)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgis.net)

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Database Setup](#-database-setup)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Licence](#-licence)

---

## 🌱 About the Project

RootVio addresses the gap between Victorians wanting to garden sustainably and the knowledge required to do so responsibly. By combining open Victorian Government ecological datasets with modern web technology, RootVio:

- Matches users to **native plants** suited to their specific Victorian bioregion
- Helps identify **environmental weeds** before they spread
- Provides an **interactive garden planner** tailored to wildlife goals
- Connects users to **Victorian Indigenous nurseries**
- Teaches **beginner-friendly ecological gardening** practices

> **Disclaimer:** Plant and weed data is for educational and planning purposes only. It does not constitute statutory weed declarations or replace professional advice. AI-assisted weed identification is assistive — verify with authoritative sources before taking action.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌺 **PlantMe** | Bioregion-matched native plant recommendations with wildlife and form filters |
| 🌿 **Weed Checker** | AI-powered weed identification via ONNX ML model and Pl@ntNet fallback |
| 🗺️ **Garden Planner** | Interactive canvas to design and save garden layouts (cloud-synced) |
| 🛒 **Seed Cart** | Save and print a personalised plant list |
| 📍 **Nursery Map** | Victorian Indigenous nursery locator with Google Maps integration |
| 🌦️ **Frost Notices** | Optional weather and frost alerts for your location |
| 📚 **Learn Hub** | Beginner gardening tutorials and ecological education content |
| 🔐 **Authentication** | Google OAuth and email/password sign-in via Firebase |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           Browser (React 19 SPA)            │
│              Vite · TypeScript              │
└──────────────────┬──────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────┐
│           GitHub Pages (CDN)                │
│            Static Asset Hosting             │
└──────────────────┬──────────────────────────┘
                   │ /api/* REST calls
┌──────────────────▼──────────────────────────┐
│     AWS API Gateway → AWS Lambda            │
│          Node.js / Express                  │
└────────┬─────────────────────┬──────────────┘
         │                     │
┌────────▼────────┐   ┌────────▼────────┐
│  Amazon RDS     │   │ Amazon DynamoDB │
│ PostgreSQL +    │   │ Planner layouts │
│   PostGIS       │   └─────────────────┘
└─────────────────┘
         │
┌────────▼────────────────────────────────────┐
│         Firebase Authentication             │
│    Google OAuth · Email/Password · JWT      │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI component framework |
| TypeScript | 5.x | Static typing |
| Vite | 5.x | Build toolchain and dev server |
| React Router | 6.x | Client-side routing |
| Firebase JS SDK | 10.x | Auth state and ID token management |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18 LTS | Lambda runtime |
| Express | 4.x | HTTP routing and middleware |
| PostgreSQL | 15 | Plant, weed, bioregion, and nursery data |
| PostGIS | 3.x | Spatial bioregion resolution (point-in-polygon) |
| Amazon DynamoDB | — | Garden planner layout persistence |

### Infrastructure
| Service | Provider | Purpose |
|---|---|---|
| GitHub Pages | GitHub | Static SPA hosting |
| AWS API Gateway | AWS | REST API routing and CORS |
| AWS Lambda | AWS | Serverless API and ML inference |
| Amazon RDS | AWS | Managed PostgreSQL database |
| Firebase Authentication | Google | User identity and JWT issuance |
| Google Maps Platform | Google | Nursery map and weather notices |
| Pl@ntNet API | Pl@ntNet | Secondary plant/weed identification |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18 LTS or later — [download](https://nodejs.org)
- **npm** v9 or later (included with Node.js)
- **Python** 3.10+ (for database ETL scripts)
- **PostgreSQL** client 14+ (for running schema scripts locally)
- **AWS CLI** v2 — [install guide](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
- **Firebase CLI** — `npm install -g firebase-tools`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/imhero2k/GardenWise.git
cd GardenWise

# 2. Install frontend dependencies
npm ci

# 3. Install Lambda dependencies
cd lambda && npm ci && cd ..
```

### Environment Variables

Copy `.env.example` to `.env.local` and populate all required values:

```bash
cp .env.example .env.local
```

#### Frontend Variables (`VITE_` prefix — bundled into JavaScript at build time)

> ⚠️ **Security:** `VITE_` variables are visible in the compiled bundle. Never use this prefix for private keys or secrets.

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ Required | Full HTTPS URL of the deployed API Gateway |
| `VITE_FIREBASE_API_KEY` | ✅ Required | Firebase project public API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Required | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Required | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | ✅ Required | Firebase app ID |
| `VITE_PREDICT_API_URL` | ✅ Required | Weed scan Lambda inference endpoint URL |
| `VITE_GOOGLE_MAPS_API_KEY` | ⚪ Optional | Enables nursery map and weather notices |
| `VITE_BASE_PATH` | ⚪ Conditional | SPA base path for sub-directory deployments (e.g. `/iteration3`) |
| `VITE_BYPASS_AUTH` | 🚫 Staging only | Skips auth guards — **never `true` on production** |

#### Backend Variables (Lambda environment — never exposed to browser)

| Variable | Sensitivity | Description |
|---|---|---|
| `DATABASE_URL` | 🔒 Secret | PostgreSQL connection string including credentials |
| `DATABASE_SSL` | Required | Set to `true` to enforce TLS on RDS connections |
| `DYNAMODB_PLANNER_LAYOUT_TABLE` | Required | DynamoDB table name for planner layouts |
| `AWS_REGION` | Required | AWS region (e.g. `ap-southeast-2`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 🔒 Secret | Firebase Admin SDK service account JSON |
| `PLANTNET_API_KEY` | 🔒 Secret | Pl@ntNet API key — server-side only |
| `CORS_ORIGIN` | Required | Allowed browser origins (e.g. `https://rootivio.app`) |

### Running Locally

```bash
# Start the frontend development server (http://localhost:5173)
npm run dev

# In a separate terminal — run the Lambda API server locally
cd lambda
node index.js

# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test
```

> **Note:** The Vite dev server proxies `/api/*` requests to `VITE_API_BASE_URL` automatically, eliminating CORS issues during local development.

---

## 📁 Project Structure

```
GardenWise/
├── src/
│   ├── api/               # Frontend API client functions (fetch wrappers)
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts — Auth, Location, SeedCart
│   ├── pages/             # Route-level page components
│   └── App.tsx            # Router configuration and RequireAuth wrapper
├── lambda/
│   ├── index.js           # Lambda entry point — Express app initialisation
│   ├── routes/            # Route handlers — plants, weeds, planner, health
│   ├── middleware/        # Auth (Firebase token verification), CORS, error handler
│   ├── db/                # PostgreSQL pool and PostGIS query helpers
│   ├── dynamo/            # DynamoDB client wrapper for planner layouts
│   └── plantnet.js        # Pl@ntNet API proxy handler
├── lambda-weed-scan/
│   ├── handler.py/js      # Weed ML inference Lambda — ONNX model runner
│   └── model/             # ONNX model artefact
├── database/
│   ├── create_table.sql   # PostgreSQL schema DDL
│   ├── etl.py             # ETL pipeline — ingests Victorian open datasets
│   ├── dataclean.sql      # Post-ETL cleanup, deduplication, spatial indexing
│   └── README.md          # Dataset sources, ETL instructions, validation queries
├── docs/
│   └── planner-recommendations-api.md  # Planner API request/response schemas
├── .github/
│   └── workflows/         # GitHub Actions CI/CD workflow definitions
├── .env.example           # Template for all required environment variables
├── vite.config.ts         # Vite build config — base path, dev proxy, plugins
└── tsconfig.json          # TypeScript compiler configuration
```

---

## 📡 API Reference

All endpoints are prefixed with `{VITE_API_BASE_URL}`.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | System health — returns `database`, `plannerLayoutStorage`, `firebaseAdmin` booleans |
| `GET` | `/api/recommendations` | None | Bioregion-matched plant list. Params: `lat`, `lng`, `query`, `wildlifeFilter`, `formFilter`, `page` |
| `GET` | `/api/plants/:id` | None | Full plant detail by ID |
| `GET` | `/api/weeds` | None | Full weed listing from regulatory dataset |
| `GET` | `/api/weeds/top` | None | Top-priority / most commonly reported weeds |
| `GET` | `/api/weeds/lookup` | None | Weed lookup by name or ID |
| `GET` | `/api/planner/recommendations` | None | Planner plant suggestions. Params: `goal` (`bird`\|`pollinator`), `lat`, `lng` |
| `GET` | `/api/planner/layout` | 🔐 Firebase Bearer | Retrieve user's saved garden layout from DynamoDB |
| `PUT` | `/api/planner/layout` | 🔐 Firebase Bearer | Save / update user's garden layout to DynamoDB |
| `POST` | `/api/plantnet/identify` | None* | Proxy image to Pl@ntNet for plant/weed identification |

> *`/api/plantnet/identify` has no authentication — rate limiting via API Gateway usage plan is strongly recommended.

**Health check example:**
```bash
curl https://<your-api-gateway-url>/api/health
# Expected: { "database": true, "plannerLayoutStorage": true, "firebaseAdmin": true }
```

For detailed planner request/response schemas, see [`docs/planner-recommendations-api.md`](./docs/planner-recommendations-api.md).

---

## 🗄️ Database Setup

The PostgreSQL database uses PostGIS for spatial bioregion queries. To provision from scratch:

```bash
cd database

# 1. Create schema
psql $DATABASE_URL -f create_table.sql

# 2. Configure ETL — update source data paths in etl.py
# (see database/README.md for dataset download links)

# 3. Run ETL pipeline
python etl.py

# 4. Run post-ETL cleanup and spatial indexing
psql $DATABASE_URL -f dataclean.sql

# 5. Validate (row counts + geometry check)
# Run validation queries from database/README.md
```

> **Note:** The frontend does not load CSV files at runtime. All data updates are backend database operations — no application restart is required.

### Core Tables

| Table | Purpose |
|---|---|
| `plants` | Native plant species registry with trait and stature data |
| `bioregions` | Victorian bioregion polygons (PostGIS geometry) |
| `evc_mappings` | Maps plants to Ecological Vegetation Classes within bioregions |
| `weeds` | Victorian regulatory weed dataset |
| `nurseries` | Victorian Indigenous nursery locations |

---

## 🚢 Deployment

Deployment is fully automated via GitHub Actions on every push to `main`:

```
Push to main
    │
    ├── npm ci
    ├── npm run typecheck   ← blocking gate
    ├── npm run lint        ← blocking gate
    ├── vite build          ← injects VITE_* secrets from GitHub Secrets
    └── Deploy to GitHub Pages
```

### Manual deployment steps (first-time setup)

1. **GitHub Pages** — Enable in repo Settings → Pages → Source: GitHub Actions
2. **AWS Lambda** — Deploy `lambda/` as a Node.js 18.x function; attach to API Gateway
3. **API Gateway** — Create REST API, configure CORS, deploy to `production` stage
4. **Firebase** — Add `rootivio.app` to Authorised Domains in Firebase Console → Authentication
5. **Environment secrets** — Add all `VITE_*` variables to GitHub repository secrets

### Application URLs

| Environment | URL |
|---|---|
| Production | [https://rootivio.app/](https://rootivio.app/) |
| Iteration 3 | [https://rootivio.app/iteration3](https://rootivio.app/iteration3) |
| GitHub Pages fallback | [https://imhero2k.github.io/GardenWise/](https://imhero2k.github.io/GardenWise/) |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Ensure all quality gates pass:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```
5. Commit with a descriptive message: `git commit -m "feat: add nursery search filter"`
6. Push to your branch: `git push origin feature/your-feature-name`
7. Open a Pull Request to the `develop` branch

### Branch naming convention

| Branch | Purpose |
|---|---|
| `main` | Production — protected; merges trigger CI/CD deploy |
| `develop` | Integration branch — feature branches merge here first |
| `feature/...` | New features (e.g. `feature/planner-undo`) |
| `fix/...` | Bug fixes (e.g. `fix/location-prompt-loop`) |

> **Never commit directly to `main`.** All merges require at least one peer review.

---

## 🔒 Security

- **Secrets management:** All private keys, service account JSON, and database credentials are stored in GitHub Secrets (build-time) or Lambda environment variables (runtime) — never in source code
- **Dependency auditing:** Run `npm audit` before every release; remediate all High and Critical advisories
- **API key restriction:** Restrict `VITE_GOOGLE_MAPS_API_KEY` to the `rootivio.app` HTTP referrer in GCP Console
- **Known risk:** `VITE_` variables are embedded in the compiled JS bundle and visible to users — only Firebase public config values are acceptable with this prefix

To report a security vulnerability, please contact the team directly rather than opening a public issue.

---

## 📄 Licence

This project was developed as part of **FIT5120 Industry Experience Studio** at **Monash University, Semester 1 2026**.

Data attributions:
- Victorian bioregion, plant trait, and weed datasets — Victorian Government open data releases (see `/about` page and `database/README.md` for full licence details)
- Pl@ntNet — [Pl@ntNet API Terms of Service](https://my.plantnet.org/account/doc/api-docs)
- Google Maps — [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms)

---

<div align="center">

**Built with 🌿 by the GardenWise Team**  
FIT5120 Industry Experience Studio · Monash University · 2026

[Live App](https://rootivio.app/iteration3) · [Report Bug](https://github.com/imhero2k/GardenWise/issues) · [Request Feature](https://github.com/imhero2k/GardenWise/issues)

</div>
