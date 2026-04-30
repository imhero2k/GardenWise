import pandas as pd
from sqlalchemy import create_engine, text

# ============================================================
# Configuration - Adjust according to your environment
# ============================================================
DB_URL = "postgresql://misuzukamio@localhost:5432/postgres"
CSV_DIR = "output"
WEED_CSV = "Advisory_list_environmental_weeds_Vic2022.csv"

engine = create_engine(DB_URL)


# ============================================================
# Utility: Reset SERIAL/SEQUENCE
# ============================================================
def reset_sequence(conn, table_name, id_col="id"):
    """Resets the PostgreSQL sequence to the current max ID to prevent PK conflicts."""
    conn.execute(text(f"""
        SELECT setval(
            pg_get_serial_sequence('{table_name}', '{id_col}'),
            COALESCE((SELECT MAX({id_col}) FROM {table_name}), 1),
            true
        )
    """))


# ============================================================
# Step 1: Import BIOREGION (Excludes geometry, imported via SHP separately)
# ============================================================
print("Importing bioregion...")
df_bio = pd.read_csv(f"{CSV_DIR}/bioregion.csv")

# Keep only necessary columns and drop rows with empty names
df_bio = df_bio[["id", "bioregion_name"]].copy()
df_bio = df_bio[
    df_bio["bioregion_name"].notna()
    & (df_bio["bioregion_name"].astype(str).str.strip() != "")
]

with engine.begin() as conn:
    df_bio.to_sql("bioregion", conn, if_exists="append", index=False)
    reset_sequence(conn, "bioregion", "id")

print(f"  ✅ {len(df_bio)} bioregions imported")


# ============================================================
# Step 2: Import PLANT
# ============================================================
print("Importing plant...")
df_plant = pd.read_csv(f"{CSV_DIR}/plant.csv")

df_plant = df_plant[["id", "scientific_name", "common_name", "lf_code", "nursery_available"]].copy()
df_plant = df_plant[
    df_plant["scientific_name"].notna()
    & (df_plant["scientific_name"].astype(str).str.strip() != "")
]

print(f"  Remaining rows after filtering empty names: {len(df_plant)}")

with engine.begin() as conn:
    df_plant.to_sql("plant", conn, if_exists="append", index=False)
    reset_sequence(conn, "plant", "id")

print(f"  ✅ {len(df_plant)} plants imported")


# ============================================================
# Step 3: Import BIOREGION_PLANT
# ============================================================
print("Importing bioregion_plant mapping...")
df_bp = pd.read_csv(f"{CSV_DIR}/bioregion_plant.csv")
df_bp = df_bp[["bioregion_id", "plant_id", "recommendation_weight"]].copy()

with engine.begin() as conn:
    df_bp.to_sql("bioregion_plant", conn, if_exists="append", index=False)

print(f"  ✅ {len(df_bp)} associations imported")


# ============================================================
# Step 4: Import WEED_INFO (Match scientific_name with existing plant table)
# ============================================================
print("Importing weed_info...")
df_weed = pd.read_csv(WEED_CSV)

# Standardize column names
df_weed.columns = df_weed.columns.str.strip()
df_weed = df_weed.rename(columns={
    "Scientific name": "scientific_name",
    "Risk Rating": "risk_rating",
    "Risk Ranking Score": "risk_score",
    "Weed Status in Victoria": "weed_status_vic",
    "Impact on natural systems": "impact_natural_systems",
    "Impact (Score)": "impact_score",
    "Invasivness (score)": "invasiveness_score",
    "Weeds National Significance (WONS)": "wons_raw",
})

# Clean scientific_name
df_weed["scientific_name"] = df_weed["scientific_name"].astype(str).str.strip()
df_weed = df_weed[
    df_weed["scientific_name"].notna()
    & (df_weed["scientific_name"] != "")
    & (df_weed["scientific_name"].str.lower() != "nan")
].copy()

# Remove duplicate names within the weed dataset to avoid mapping issues
df_weed = df_weed.drop_duplicates(subset=["scientific_name"])

# ---- Step 4a: Insert weeds not present in the plant table into plant table ----
with engine.connect() as conn:
    existing_plants = pd.read_sql(
        text("SELECT scientific_name FROM plant"),
        conn
    )

existing_plants["scientific_name"] = existing_plants["scientific_name"].astype(str).str.strip()
existing_set = set(existing_plants["scientific_name"].str.lower())

weed_names = df_weed[["scientific_name"]].drop_duplicates().copy()
new_weeds = weed_names[
    ~weed_names["scientific_name"].str.lower().isin(existing_set)
].copy()

if len(new_weeds) > 0:
    # Map common name if available in the weed dataset
    if "Common Name" in df_weed.columns:
        name_map = (
            df_weed.drop_duplicates(subset=["scientific_name"])
            .set_index("scientific_name")["Common Name"]
        )
        new_weeds["common_name"] = new_weeds["scientific_name"].map(name_map)
    else:
        new_weeds["common_name"] = None

    new_weeds["lf_code"] = "unknown"
    new_weeds["nursery_available"] = None

    with engine.begin() as conn:
        new_weeds[["scientific_name", "common_name", "lf_code", "nursery_available"]].to_sql(
            "plant", conn, if_exists="append", index=False
        )
        reset_sequence(conn, "plant", "id")

    print(f"  ✅ Added {len(new_weeds)} new weed species to plant table")
else:
    print("  ℹ️ All weed species already exist in plant table")

# ---- Step 4b: Re-fetch full plant_id mapping and import weed_info ----
with engine.connect() as conn:
    plant_map = pd.read_sql(
        text("SELECT id AS plant_id, scientific_name FROM plant"),
        conn
    )

plant_map["scientific_name"] = plant_map["scientific_name"].astype(str).str.strip()

# Inner join to map IDs
df_weed = df_weed.merge(plant_map, on="scientific_name", how="inner")

# Handle boolean is_wons
df_weed["is_wons"] = (
    df_weed["wons_raw"]
    .astype(str)
    .str.strip()
    .str.lower()
    .isin(["yes", "y", "true", "1"])
)

# Select target columns
weed_cols = [
    "plant_id",
    "risk_rating",
    "risk_score",
    "weed_status_vic",
    "impact_natural_systems",
    "impact_score",
    "invasiveness_score",
    "is_wons"
]

df_weed_out = df_weed[weed_cols].drop_duplicates(subset=["plant_id"]).copy()

with engine.begin() as conn:
    df_weed_out.to_sql("weed_info", conn, if_exists="append", index=False)

print(f"  ✅ {len(df_weed_out)} weed records imported into weed_info table")


# ============================================================
# Step 5: Verification
# ============================================================
print("\nData Verification:")
with engine.connect() as conn:
    for table in ["bioregion", "plant", "bioregion_plant", "weed_info"]:
        count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
        print(f"  {table}: {count} rows")

    rec_count = conn.execute(text(
        "SELECT COUNT(DISTINCT plant_id) FROM bioregion_plant"
    )).scalar()

    weed_count = conn.execute(text(
        "SELECT COUNT(*) FROM weed_info"
    )).scalar()

    overlap = conn.execute(text("""
        SELECT COUNT(*)
        FROM bioregion_plant bp
        JOIN weed_info w ON w.plant_id = bp.plant_id
    """)).scalar()

    print(f"\n  Unique recommended plants: {rec_count}")
    print(f"  Weed records:               {weed_count}")
    print(f"  Overlap (Conflicts):        {overlap}")
    if overlap > 0:
        print("  ⚠️ Warning: These should be filtered out during recommendation.")

print("\n✅ Import process completed successfully")