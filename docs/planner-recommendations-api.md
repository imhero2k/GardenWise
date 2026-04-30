# Planner Recommendations API

This document explains how the Garden Planner recommendation API works and how to switch its database connection from a local PostgreSQL/PostGIS database to a cloud database such as Amazon RDS.

## Runtime Overview

The frontend never connects to PostgreSQL directly.

```text
React planner page
  -> GET /api/planner/recommendations
  -> Express API server
  -> PostgreSQL/PostGIS via DATABASE_URL
```

The relevant files are:

- `src/pages/GardenPlannerPage.tsx` - renders the Garden Planner UI and recommendation groups.
- `src/lib/plannerRecommendationsApi.ts` - frontend fetch wrapper for the planner API.
- `server/app.mjs` - registers the `/api/planner/recommendations` route.
- `server/plannerRecommendations.mjs` - queries PostgreSQL and builds goal-based recommendation groups.

## API Endpoint

```http
GET /api/planner/recommendations?goal=bird&lat=-37.8136&lng=144.9631
GET /api/planner/recommendations?goal=pollinator&lat=-37.8136&lng=144.9631
```

Query parameters:

- `goal`: must be `bird` or `pollinator`.
- `lat`: latitude in WGS84.
- `lng`: longitude in WGS84.

Example response shape:

```json
{
  "goal": "bird",
  "regionName": "Gippsland Plain",
  "regionMatch": "contained",
  "groups": [
    {
      "id": "canopy",
      "title": "Canopy layer",
      "target": "1 tree species",
      "reason": "Canopy trees provide upper-layer structure, shade, and perching space.",
      "requiredCount": 1,
      "plants": [
        {
          "id": "203",
          "scientificName": "Exocarpos cupressiformis",
          "commonName": "Cherry Ballart",
          "lfCode": "T",
          "growthForms": ["shrub", "tree"],
          "floweringMonths": [1, 2, 3, 4, 5, 10, 11, 12],
          "floweringSeasons": ["spring", "summer", "autumn"],
          "traits": {
            "dispersers": ["birds", "vertebrates"],
            "fruitFleshiness": ["fleshy"],
            "dispersalSyndromes": ["endozoochory", "zoochory"],
            "pollinationSyndromes": ["insect"]
          },
          "reason": "tree canopy structure; bee/insect pollination; spring, summer, autumn flowers"
        }
      ]
    }
  ]
}
```

## Database Tables Used

The planner API expects this PostgreSQL/PostGIS schema:

- `bioregion`
  - `id`
  - `bioregion_name`
  - `boundary` as `geometry(MultiPolygon, 4326)`
- `bioregion_plant`
  - `bioregion_id`
  - `plant_id`
  - `recommendation_weight`
- `plant`
  - `id`
  - `scientific_name`
  - `common_name`
  - `lf_code`
  - `nursery_available`
- `plant_trait`
  - `plant_id`
  - `trait_name`
  - `trait_value`
  - `month`
  - `present`
- `weed_info`
  - `plant_id`

`weed_info` is used to exclude environmental weeds from recommendation results.

## Query Logic

The backend performs these steps:

1. Builds a WGS84 point from `lng` and `lat`.
2. Finds the matching bioregion:
   - prefer a `bioregion.boundary` polygon that contains the point;
   - otherwise choose the nearest `bioregion.boundary`.
3. Joins:
   - `bioregion -> bioregion_plant`
   - `bioregion_plant -> plant`
   - `plant -> plant_trait`
4. Excludes plants that appear in `weed_info`.
5. Aggregates relevant trait values into arrays.
6. Builds goal-specific groups in JavaScript.

The API currently returns all available database candidates for each group, sorted by trait relevance, `recommendation_weight`, and scientific name. The frontend displays the count as `N available`.

## Bird-Friendly Goal Logic

Returned groups:

- `canopy`
  - Trees or tree-like growth forms.
  - Uses `plant.lf_code = T` or `plant_trait.plant_growth_form in ('tree', 'mallee')`.
- `mid`
  - Shrubs.
  - Uses shrub growth forms or shrub-like LF codes such as `MS`, `SS`, `PS`.
- `ground`
  - Herbs, subshrubs, groundcovers, grasses, climbers, ferns, and similar low vegetation.
- `food`
  - Plants with bird food traits.
  - Prioritises:
    - `dispersers in ('birds', 'bird', 'flying_vertebrates')`
    - `fruit_fleshiness = 'fleshy'`
    - `dispersal_syndrome in ('zoochory', 'endozoochory')`

Flowering months are also included so the frontend can explain flowering support for ground-layer and bird habitat recommendations.

## Pollinator Goal Logic

Returned groups:

- `front`
  - Herbs, subshrubs, low shrubs, grasses, groundcovers, and similar front-layer nectar plants.
- `back`
  - Shrubs and trees used as windbreaks, visual backing, and extra nectar structure.
- `seasons`
  - Plants that help cover spring, summer, and autumn flowering.

Pollinator candidates must have:

- `pollination_syndrome in ('bee', 'insect')`
- at least one `flowering_time` row with `present = true` and a valid `month`

Months are mapped to Australian seasons:

- `spring`: September, October, November
- `summer`: December, January, February
- `autumn`: March, April, May
- `winter`: June, July, August

## Plant Size Logic

When a database recommendation is selected for placement in the 3D planner, the frontend builds a temporary `PlantSpec` from `plant.lf_code`.

Typical mature widths:


| LF code | Meaning                 | Typical mature width |
| --------- | ------------------------- | ---------------------- |
| `MS`    | Medium Shrub            | 1.5-3 m              |
| `SS`    | Small Shrub             | 0.5-1.5 m            |
| `T`     | Tree                    | 5-15 m               |
| `MH`    | Medium Herb             | 0.3-0.8 m            |
| `PS`    | Prostrate Shrub         | 1-3 m                |
| `SH`    | Small Herb              | 0.1-0.4 m            |
| `GF`    | Ground Fern             | 0.3-1 m              |
| `LH`    | Large Herb              | 0.8-2 m              |
| `EP`    | Epiphyte                | 0.1-0.5 m            |
| `MTG`   | Medium Tufted Grass     | 0.4-1 m              |
| `SC`    | Scrambler / Climber     | 1-4 m                |
| `LTG`   | Large Tufted Grass      | 0.8-2 m              |
| `MNG`   | Medium Non-tufted Grass | 0.3-1 m              |
| `LNG`   | Large Non-tufted Grass  | 0.8-2.5 m            |
| `TTG`   | Tiny Tufted Grass       | 0.1-0.3 m            |
| `HG`    | Herbaceous Groundcover  | 0.3-1.5 m            |

The frontend uses an approximate midpoint for the actual 3D footprint and spacing calculation.

## Local Development

Use a local PostgreSQL/PostGIS database:

```env
DATABASE_URL=postgresql://misuzukaimo@localhost:5432/postgres
DATABASE_SSL=0
VITE_BYPASS_AUTH=true
```

Recommended local file:

```text
.env.local
```

`.env.local` is ignored by Git and should not be committed.

Run the API:

```bash
npm run dev:api
```

Run the frontend:

```bash
npm run dev
```

In local Vite development, frontend calls to `/api` are proxied to:

```text
http://localhost:3001
```

The proxy is configured in `vite.config.ts`.

Quick API test:

```bash
curl "http://127.0.0.1:3001/api/planner/recommendations?goal=bird&lat=-37.8136&lng=144.9631"
```
