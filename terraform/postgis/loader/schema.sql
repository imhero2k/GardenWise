-- Fresh GardenWise schema, adapted from commit 63f5424. No DROP/TRUNCATE.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE IF NOT EXISTS bioregion (
  id SERIAL PRIMARY KEY,
  bioregion_name VARCHAR(100) NOT NULL UNIQUE,
  boundary geometry(MultiPolygon, 4326)
);
CREATE INDEX IF NOT EXISTS idx_bioregion_geom ON bioregion USING gist(boundary);
CREATE TABLE IF NOT EXISTS plant (
  id SERIAL PRIMARY KEY,
  scientific_name VARCHAR(200) NOT NULL UNIQUE,
  common_name VARCHAR(200),
  lf_code VARCHAR(20),
  nursery_available BOOLEAN
);
CREATE INDEX IF NOT EXISTS idx_plant_lf_code ON plant(lf_code);
CREATE TABLE IF NOT EXISTS bioregion_plant (
  bioregion_id INT NOT NULL REFERENCES bioregion(id),
  plant_id INT NOT NULL REFERENCES plant(id),
  recommendation_weight DOUBLE PRECISION,
  PRIMARY KEY (bioregion_id, plant_id)
);
CREATE TABLE IF NOT EXISTS weed_info (
  plant_id INT PRIMARY KEY REFERENCES plant(id),
  risk_rating VARCHAR(50), risk_score DOUBLE PRECISION,
  weed_status_vic VARCHAR(100), impact_natural_systems VARCHAR(200),
  impact_score DOUBLE PRECISION, invasiveness_score DOUBLE PRECISION,
  is_wons BOOLEAN DEFAULT false
);
CREATE TABLE IF NOT EXISTS plant_trait (
  id BIGSERIAL PRIMARY KEY,
  plant_id INT NOT NULL REFERENCES plant(id),
  trait_name VARCHAR(50) NOT NULL, trait_value VARCHAR(100),
  month SMALLINT CHECK (month IS NULL OR month BETWEEN 1 AND 12),
  present BOOLEAN, source_raw TEXT,
  CHECK ((trait_name IN ('flowering_time','fruiting_time') AND month IS NOT NULL AND present IS NOT NULL)
      OR (trait_name NOT IN ('flowering_time','fruiting_time') AND trait_value IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_plant_trait_dedup ON plant_trait (
  plant_id, trait_name, COALESCE(trait_value,''), COALESCE(month,0), COALESCE(present,false)
);
CREATE INDEX IF NOT EXISTS idx_plant_trait_plant ON plant_trait(plant_id);
