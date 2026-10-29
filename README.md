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

#### Frontend Runtime Configuration

These values are loaded from `/runtime-config.js` when the container starts. Firebase web configuration and the Google Maps key are public browser settings, not secrets. Never put private credentials in `APP_*` frontend variables.

| Variable | Required | Description |
|---|---|---|
| `APP_API_BASE_URL` | ⚪ Optional | API origin; leave empty when the API is routed through the same ALB origin |
| `APP_FIREBASE_API_KEY` | ✅ Required for Firebase Auth | Public Firebase web API key |
| `APP_FIREBASE_AUTH_DOMAIN` | ✅ Required for Firebase Auth | Firebase Auth domain |
| `APP_FIREBASE_PROJECT_ID` | ✅ Required for Firebase Auth | Firebase project ID |
| `APP_FIREBASE_APP_ID` | ⚪ Optional | Firebase app ID |
| `APP_FIREBASE_MESSAGING_SENDER_ID` | ⚪ Optional | Firebase messaging sender ID |
| `APP_FIREBASE_STORAGE_BUCKET` | ⚪ Optional | Firebase storage bucket |
| `APP_FIREBASE_MEASUREMENT_ID` | ⚪ Optional | Firebase Analytics measurement ID |
| `APP_PREDICT_API_URL` | ✅ Required for prediction | Prediction service URL, e.g. `https://predict.example.com/testing/predict` |
| `APP_GOOGLE_MAPS_API_KEY` | ⚪ Optional | Enables Google Maps Weather API; restrict by allowed website referrer |
| `VITE_BASE_PATH` | ⚪ Conditional | Build-time SPA path for GitHub Pages subdirectory deployments |
| `VITE_BYPASS_AUTH` | 🚫 Local dev only | Skips auth guards only in Vite development mode |

#### Backend Variables (never exposed to browser)

| Variable | Sensitivity | Description |
|---|---|---|
| `DATABASE_URL` | 🔒 Secret | PostgreSQL connection string including credentials |
| `DATABASE_SSL` | Required | Set to `true` to enforce TLS on RDS connections |
| `DYNAMODB_PLANNER_LAYOUT_TABLE` | Required | DynamoDB table name for planner layouts |
| `AWS_REGION` | Required | AWS region (e.g. `ap-southeast-2`) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 🔒 Secret | Firebase Admin SDK service account JSON |
| `PLANTNET_API_KEY` | 🔒 Secret | Pl@ntNet API key — server-side only; supply to the API container through Secrets Manager |
| `CORS_ORIGIN` | Required | Allowed browser origins (e.g. `https://rootivio.app`) |

### Running Locally

```bash
# Start the frontend development server (http://localhost:5173)
npm run dev

# In a separate terminal — run the API server locally
npm run dev:api

# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test
```

> **Note:** The Vite dev server serves `/runtime-config.js` from `APP_*` values in `.env.local` and proxies `/api/*` requests to the local API server.

### Run the Frontend Container with Runtime Configuration

Copy the example runtime environment, fill in public Firebase web config and any required endpoint settings, then run the same frontend image with different runtime values as needed:

```bash
cp .env.runtime.example .env.runtime
docker build -t gardenwise-frontend:local .
docker run --rm -p 8080:80 --env-file .env.runtime gardenwise-frontend:local
curl http://localhost:8080/runtime-config.js
```

The runtime config endpoint is served with `Cache-Control: no-store`. Missing required Firebase settings generate a non-secret warning and disable Firebase Authentication without preventing the frontend from starting. To run frontend and API together locally, configure `.env.local` with the `APP_*` browser values and server-only values, then use:

```bash
docker compose --env-file .env.local up --build
```

Open `http://localhost:8080`. The API is also available at `http://localhost:3001/api/health`. Stop the containers with `docker compose down`.

Set `DATABASE_URL` to a reachable PostgreSQL/PostGIS database. For a database running on the host, use `host.docker.internal` as the host name; set `DATABASE_SSL=0` if that database does not support TLS. The API also accepts Firebase Admin, DynamoDB, and PlantNet settings. AWS credentials should be provided through the runtime's normal credential mechanism.

The frontend image contains no environment-specific Firebase configuration; ECS task environment values are serialized safely into the browser-readable runtime config at startup. Firebase web config remains public by design. Never pass private credentials to the frontend task. The weed-scan inference service is published as an HTTP container for ECS.

### ECS Fargate Task Environment Example

The current repository does not contain a `task.yaml`; configure these values on the frontend container definition in the task definition consumed by your Terraform deployment. Keep API and prediction services on their existing ports (3001 and 8080):

```yaml
containerDefinitions:
  - name: gardenwise-frontend
    image: ghcr.io/imhero2k/gardenwise-frontend-v2:sha-<commit>
    portMappings:
      - containerPort: 80
        protocol: tcp
    environment:
      - name: APP_API_BASE_URL
        value: "" # same ALB origin; /api/* is routed to the API on port 3001
      - name: APP_PREDICT_API_URL
        value: "https://predict.example.com/testing/predict" # reachable prediction service on port 8080
      - name: APP_FIREBASE_API_KEY
        value: "<Firebase web API key (public)>"
      - name: APP_FIREBASE_AUTH_DOMAIN
        value: "<project>.firebaseapp.com"
      - name: APP_FIREBASE_PROJECT_ID
        value: "<project-id>"
      - name: APP_FIREBASE_APP_ID
        value: "<Firebase app ID>"
      - name: APP_FIREBASE_MESSAGING_SENDER_ID
        value: "<sender ID>"
      - name: APP_FIREBASE_STORAGE_BUCKET
        value: "<project>.firebasestorage.app"
      - name: APP_FIREBASE_MEASUREMENT_ID
        value: "<measurement ID or empty>"
      - name: APP_GOOGLE_MAPS_API_KEY
        value: "<referrer-restricted public key or empty>"
```

The Pl@ntNet key is private and belongs only in the backend task's `secrets` list, sourced from AWS Secrets Manager as `PLANTNET_API_KEY`. Do not add it to frontend environment values or `runtime-config.js`.

### Publish Container Images

The `Publish container images` workflow publishes images to GitHub Container Registry on pushes to `main`, version tags (`v*`), or a manual run:

- `ghcr.io/imhero2k/gardenwise-frontend-v2`
- `ghcr.io/imhero2k/gardenwise-api-v2`
- `ghcr.io/imhero2k/gardenwise-weedscan-v2` (ECS HTTP service, `linux/amd64`, port `8080`)

The frontend and API images support `linux/amd64` and `linux/arm64`; the weed-scan ECS image targets `linux/amd64`. It accepts `POST /testing/predict` and `POST /predict` with an `image_base64` JSON field, and exposes `GET /health` for container health checks. Set `CORS_ALLOW_ORIGIN` to the frontend origin when deploying it. Each run publishes a commit SHA tag; `main` publishes `latest`, and version tags publish their matching tag. The frontend image is environment-independent; configure Firebase, API, prediction, and optional Google Maps values on the ECS task. The workflow uses `GITHUB_TOKEN` with package-write permission to publish.

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

All endpoints are prefixed with `{APP_API_BASE_URL}`.

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

- **Secrets management:** Store private keys, service account JSON, and database credentials in GitHub Secrets or AWS Secrets Manager, then inject them only into backend runtime containers — never into frontend builds or browser runtime configuration
- **Dependency auditing:** Run `npm audit` before every release; remediate all High and Critical advisories
- **API key restriction:** Restrict `APP_GOOGLE_MAPS_API_KEY` to the `rootivio.app` HTTP referrer in GCP Console
- **Known risk:** Firebase and Google Maps browser configuration is public. Private keys must remain in backend runtime secrets and must never be exposed in `runtime-config.js`.

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
