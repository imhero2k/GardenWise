-- Enable PostGIS extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- 1. BIOREGION - Victoria Bioregions
-- ============================================================
-- Clean up existing tables to ensure a fresh schema
DROP TABLE IF EXISTS bioregion_plant CASCADE;
DROP TABLE IF EXISTS weed_info CASCADE;
DROP TABLE IF EXISTS plant CASCADE;
DROP TABLE IF EXISTS bioregion CASCADE;

CREATE TABLE bioregion (
    id              SERIAL PRIMARY KEY,
    bioregion_name  VARCHAR(100) NOT NULL UNIQUE,
    boundary        GEOMETRY(MultiPolygon, 4326) -- To be populated via SHP import
);

-- Spatial index for geographical queries
CREATE INDEX idx_bioregion_geom ON bioregion USING GIST(boundary);

-- ============================================================
-- 2. PLANT - Main Plant Catalog
-- ============================================================
CREATE TABLE plant (
    id                SERIAL PRIMARY KEY,
    scientific_name   VARCHAR(200) NOT NULL UNIQUE,
    common_name       VARCHAR(200),
    lf_code           VARCHAR(20),           -- Life Form: e.g., T (Tree), SS (Small Shrub)
    nursery_available BOOLEAN DEFAULT NULL    -- Indicates if the plant is commercially available
);

-- Index for filtering by Life Form code
CREATE INDEX idx_plant_lf_code ON plant(lf_code);

-- ============================================================
-- 3. BIOREGION_PLANT - Recommended Species Mapping (Many-to-Many)
-- ============================================================
CREATE TABLE bioregion_plant (
    bioregion_id         INT NOT NULL REFERENCES bioregion(id),
    plant_id             INT NOT NULL REFERENCES plant(id),
    recommendation_weight FLOAT DEFAULT NULL, -- Priority or suitability score
    PRIMARY KEY (bioregion_id, plant_id)
);

-- ============================================================
-- 4. WEED_INFO - Environmental Weed Data (Optional 1:1 with Plant)
-- ============================================================
CREATE TABLE weed_info (
    plant_id              INT PRIMARY KEY REFERENCES plant(id),
    risk_rating           VARCHAR(50),           -- e.g., High, Very High
    risk_score            FLOAT,
    weed_status_vic       VARCHAR(100),          -- Legal/Ecological status in Victoria
    impact_natural_systems VARCHAR(200),
    impact_score          FLOAT,
    invasiveness_score    FLOAT,
    is_wons               BOOLEAN DEFAULT FALSE  -- Weeds of National Significance flag
);

CREATE TABLE plant_trait (
    id BIGSERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plant(id),
    trait_name VARCHAR(50) NOT NULL,
    trait_value VARCHAR(100),
    month SMALLINT,
    present BOOLEAN,
    source_raw TEXT,

    CONSTRAINT plant_trait_month_check
        CHECK (month IS NULL OR month BETWEEN 1 AND 12),

    CONSTRAINT plant_trait_value_check
        CHECK (
            (trait_name IN ('flowering_time', 'fruiting_time') AND month IS NOT NULL AND present IS NOT NULL)
            OR
            (trait_name NOT IN ('flowering_time', 'fruiting_time') AND trait_value IS NOT NULL)
        )
);


select * from plant_trait;
select  * from plant p ;

CREATE UNIQUE INDEX uq_plant_trait_dedup
ON plant_trait (
    plant_id,
    trait_name,
    COALESCE(trait_value, ''),
    COALESCE(month, 0),
    COALESCE(present, false)
);



CREATE TABLE plant_trait_staging (
    plant_id INTEGER,
    scientific_name TEXT,
    common_name TEXT,
    lf_code TEXT,
    trait_name TEXT,
    trait_value TEXT,
    month SMALLINT,
    present BOOLEAN,
    source_raw TEXT
);


copy plant_trait_staging
FROM '/Users/misuzukaimo/Downloads/austraits-7.0.0/plant_traits_for_import.csv'
WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');




select * from plant_trait_staging;

INSERT INTO plant_trait (plant_id, trait_name, trait_value, month, present, source_raw)
SELECT
    p.id,
    s.trait_name,
    NULLIF(s.trait_value, ''),
    s.month,
    s.present,
    s.source_raw
FROM plant_trait_staging s
JOIN plant p
    ON p.scientific_name = s.scientific_name;
