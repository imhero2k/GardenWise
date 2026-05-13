# Database Setup

This document explains how to obtain the raw datasets, build the database schema, and load the data. After following these steps you will have a working PostgreSQL/PostGIS database containing Victorian bioregions, selected EVCs, plant trait information, and environmental weed records.

## Requirements

- PostgreSQL 14+ with the PostGIS extension enabled
- Python 3.9+
- GDAL (provides the `ogr2ogr` command)
- Python dependencies listed in `requirements.txt`

```bash
pip install -r requirements.txt
```

## Data Sources

All data used in this project comes from public sources. Please download each dataset and place the files under `data/raw/` in the order listed below.

### 1. Bioregions and EVC Benchmarks

- **Source**: <https://www.environment.vic.gov.au/biodiversity/bioregions-and-evc-benchmarks>
- **Description**: Victoria is divided into 28 bioregions, each containing multiple EVCs (Ecological Vegetation Classes). For this project we have selected the 6 EVCs most suitable for garden environments:

  | EVC ID | Name |
  |---|---|
  | EVC 3 | Damp Sands Woodland |
  | EVC 48 | Heathy Woodland |
  | EVC 55 | Plains Grassy Woodland |
  | EVC 61 | Box Ironbark Forest |
  | EVC 132 | Plains Grassland |
  | EVC 175 | Grassy Woodland |

- **Usage**: A pre-processed CSV file based on the selected EVCs is already provided under `data/processed/`. If you wish to use a different set of EVCs, you can replace this CSV with your own file in the same format, sourced from the link above.

### 2. Victorian Bioregions Shapefile

- **Source**: <https://datashare.maps.vic.gov.au/search?md=3508ad58-e66b-50e4-9717-0338845ded77>
- **Dataset**: Victorian Bioregions – Mapped at 1:100,000 (version 3.0, May 2004)
- **Download format**: Please choose the **SHP** format.
- **Import command** (example — adjust the file path, database name, username, and password to match your environment):

  ```bash
  ogr2ogr \
    -f "PostgreSQL" PG:"host=localhost port=5432 dbname=mydb user=postgres password=yourpassword" \
    /Users/xxx/data/bioregion.shp \
    -nln bioregion_raw \
    -nlt PROMOTE_TO_MULTI \
    -t_srs EPSG:4326 \
    -lco GEOMETRY_NAME=boundary \
    -overwrite
  ```

  Key parameters:
  - `-nln bioregion_raw` — name of the imported table
  - `-nlt PROMOTE_TO_MULTI` — promotes geometries to MultiPolygon
  - `-t_srs EPSG:4326` — reprojects from the original SRID (7844 / GDA2020) to WGS84 (EPSG:4326)

### 3. AusTraits Plant Trait Data

- **Source**: <https://zenodo.org/records/15718081>
- **Description**: AusTraits is a database of Australian plant traits. Two preprocessing steps are required to produce the CSV used by the ETL pipeline:

  ```bash
  # Step 1: Run the IT2 script to produce plants_enriched_final.csv
  python scripts/IT2.py

  # Step 2: Run the trait normalisation script to produce plant_traits_for_import.csv
  python scripts/normalize_plant_traits.py
  ```

### 4. Advisory List of Environmental Weeds in Victoria

- **Source**: <https://www.environment.vic.gov.au/__data/assets/excel_doc/0027/563607/Advisory-list-of-environmental-weeds-in-Victoria_2022.xlsx>
- **Preprocessing**: Convert the Excel file to CSV using the following Python snippet:

  ```python
  import pandas as pd

  df = pd.read_excel(
      'Advisory-list-of-environmental-weeds-in-Victoria_2022.xlsx',
      sheet_name='Advisory list 2022'
  )
  df.to_csv('Advisory_list_2022.csv', index=False)
  ```

## Building the Database

Once all four datasets have been downloaded and preprocessed, follow the steps below to build the database.

### Step 1: Create the schema

```bash
psql -h localhost -U postgres -d mydb -f createtable.sql
```

### Step 2: Load the data

> ⚠️ Before running, open `etl.py` and update the file paths and database connection settings (host, user, password, dbname) to match your environment.

```bash
python etl.py
```

### Step 3: Clean the data

After the ETL pipeline finishes, run the cleaning script to fix spelling inconsistencies and other minor issues in the source data:

```bash
psql -h localhost -U postgres -d mydb -f dataclean.sql
```

## Verifying the Import

You can run the following queries to confirm that the data has been loaded correctly:

```sql
-- Check bioregion geometries
SELECT COUNT(*) FROM bioregion;

-- Check EVC–plant associations
SELECT COUNT(*) FROM bioregion_plant;

-- Check weed records
SELECT COUNT(*) FROM weed_info;
```

## Troubleshooting

- **`ogr2ogr: command not found`** — Install GDAL (macOS: `brew install gdal`; Ubuntu: `sudo apt install gdal-bin`).
- **PostGIS extension not enabled** — Run `CREATE EXTENSION postgis;` in the target database before importing the shapefile.
- **SRID mismatch** — The raw shapefile uses SRID 7844 (GDA2020). The `-t_srs EPSG:4326` flag in the `ogr2ogr` command above handles the reprojection automatically. If you import via another tool, make sure to apply the same coordinate transformation.
