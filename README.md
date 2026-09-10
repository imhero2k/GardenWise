# GardenWise / RootVio — Cloud Platform Engineering Roadmap

A 35-page technical roadmap taking the [GardenWise](https://github.com/imhero2k/GardenWise)
platform from a GitHub Pages frontend and a hand-provisioned AWS estate to a fully
codified platform: Terraform infrastructure-as-code, hardened GitHub Actions delivery,
containerised workloads on Amazon EKS, and observability with Prometheus and Grafana.

**[Read the PDF →](GardenWise-Cloud-Platform-Roadmap.pdf)**

---

## What's here

| Path | Description |
| --- | --- |
| `GardenWise-Cloud-Platform-Roadmap.pdf` | The rendered document — A4, 35 pages |
| `src/cloud-platform-roadmap.html` | Source. Self-contained: no external assets, fonts or scripts |
| `scripts/build-pdf.mjs` | Regenerates the PDF with headless Chrome or Edge |

## Basis

The current-state assessment was verified against the GardenWise repository at commit
`dc4e305` rather than assumed. It records what is present:

- React 19.2 / Vite 8 SPA deployed to GitHub Pages at `rootivio.app`
- A 10-route Express API running both locally and as an AWS Lambda via `serverless-express`
- PostgreSQL/PostGIS on Amazon RDS with a five-table geospatial schema
- DynamoDB for per-user planner layouts, keyed on `userId` / `layoutId`
- Firebase Authentication with Admin SDK token verification
- A Python 3.11 ONNX weed classifier packaged as a container-image Lambda

…and, just as importantly, what is absent:

- No infrastructure as code of any kind — no Terraform, CloudFormation, SAM or CDK
- No backend deployment pipeline; API releases are manual zip uploads
- No automated tests; CI runs `typecheck` and `lint` only
- No metrics, alerting or tracing beyond one `/api/health` endpoint and `console.log`
- Docker and Kubernetes manifests added in `6be8279` and reverted in `dc4e305`

## Structure

Five phases across 22 weeks, each gated on exit criteria that must be demonstrated
rather than asserted.

| Phase | Weeks | Focus |
| --- | --- | --- |
| 0 | 1–2 | Baseline and guardrails — branch protection, secret inventory, GitHub OIDC trust, Terraform state bootstrap |
| 1 | 3–6 | Terraform foundation — import the existing estate to a zero-diff plan, then own it in code |
| 2 | 5–8 | GitHub Actions delivery — the first test suite, plan/apply gating, keyless deploys |
| 3 | 9–14 | Containers and Amazon EKS — images, cluster, add-ons, progressive traffic shift |
| 4 | 13–18 | Observability — Prometheus, Grafana, Loki, Tempo, SLOs with error budgets |
| 5 | 17–22 | Hardening, disaster recovery and FinOps |

Also included: a target architecture diagram, a phase schedule, a monthly cost model,
a ten-item risk register, and eight open decisions each with a stated default.

## A note on scope

The roadmap is deliberate about the fact that Amazon EKS is the largest single cost
and complexity increase in the plan — roughly **$455/month** across two environments
versus about **$185** for an ECS Fargate variant that preserves every other outcome.
It is framed as an explicit decision to be made at week 9, not a foregone conclusion.

## Building the PDF

```bash
node scripts/build-pdf.mjs
```

Requires Node 18+ and a local Chrome or Edge installation. Set `CHROME_PATH` if the
browser is somewhere non-standard. The HTML is self-contained, so it also renders
correctly by opening it in a browser and printing to PDF at A4 with margins set to
none and background graphics enabled.

Page numbers and the table of contents are generated at render time from document
order, so pages can be reordered without renumbering anything by hand.
