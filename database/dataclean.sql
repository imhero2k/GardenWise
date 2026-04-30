DELETE FROM bioregion_plant WHERE plant_id = 5;

DELETE FROM plant WHERE id = 5;

DELETE FROM bioregion_plant WHERE plant_id = 24;

DELETE FROM plant WHERE id = 24;


DELETE FROM bioregion_plant WHERE plant_id = 47;

DELETE FROM plant WHERE id = 47;

DELETE FROM bioregion_plant WHERE plant_id = 157;

DELETE FROM plant WHERE id = 157;


DELETE FROM bioregion_plant WHERE plant_id = 217;

DELETE FROM plant WHERE id = 217;


DELETE FROM bioregion_plant WHERE plant_id = 160;

DELETE FROM plant WHERE id = 160;


DELETE FROM bioregion_plant WHERE plant_id = 221;

DELETE FROM plant WHERE id = 221;


DELETE FROM bioregion_plant WHERE plant_id = 419;

DELETE FROM plant WHERE id = 419;


DELETE FROM bioregion_plant WHERE plant_id = 422;

DELETE FROM plant WHERE id = 422;


DELETE FROM bioregion_plant WHERE plant_id = 449;

DELETE FROM plant WHERE id = 449;


DELETE FROM bioregion_plant WHERE plant_id = 486;

DELETE FROM plant WHERE id = 486;


DELETE FROM bioregion_plant WHERE plant_id = 487;

DELETE FROM plant WHERE id = 487;

DELETE FROM bioregion_plant WHERE plant_id = 243;

DELETE FROM plant WHERE id = 243;


UPDATE plant 
SET scientific_name = 'Chrysocephalum apiculatum' 
WHERE scientific_name = 'Chysocephalum apiculatum';

UPDATE plant 
SET scientific_name = 'Leptorhynchos tenuifolius' 
WHERE scientific_name = 'Leptorhyncos tenuifolius';


UPDATE plant 
SET scientific_name = REPLACE(scientific_name, 'r ', '') 
WHERE id IN (488, 489);


SELECT id, scientific_name 
FROM plant 
WHERE scientific_name LIKE '%  %';


DROP TABLE IF EXISTS plant_dedup_map CASCADE;

-- 1. Create a temporary mapping table to identify duplicates
CREATE TEMP TABLE plant_dedup_map AS
WITH normalized AS (
    -- Remove redundant whitespace to identify semantically identical names
    SELECT 
        id,
        TRIM(REGEXP_REPLACE(scientific_name, '\s+', ' ', 'g')) AS clean_name
    FROM plant
),
keepers AS (
    -- Define the record with the minimum ID as the primary record to keep
    SELECT clean_name, MIN(id) AS keep_id
    FROM normalized
    GROUP BY clean_name
)
SELECT n.id AS old_id, k.keep_id AS new_id, k.clean_name
FROM normalized n
JOIN keepers k ON n.clean_name = k.clean_name
WHERE n.id != k.keep_id;

-- 2. CRITICAL STEP: Resolve potential Primary Key conflicts in the junction table.
--    Delete records from bioregion_plant where a bioregion is already associated 
--    with both the 'old_id' and the 'new_id'.
DELETE FROM bioregion_plant bp
USING plant_dedup_map m
WHERE bp.plant_id = m.old_id
  AND EXISTS (
      SELECT 1
      FROM bioregion_plant bp2
      WHERE bp2.bioregion_id = bp.bioregion_id
        AND bp2.plant_id    = m.new_id
  );

-- 3. Safely update the remaining 'old_id' references to point to the 'new_id'
UPDATE bioregion_plant bp
SET plant_id = m.new_id
FROM plant_dedup_map m
WHERE bp.plant_id = m.old_id;

-- 4. Check other tables referencing plant.id (e.g., weed_info)
--    Apply the same "Resolve Conflict -> Update" pattern for each referencing table.
--    Example for weed_info (assuming 1:1 relationship):
-- DELETE FROM weed_info w USING plant_dedup_map m WHERE w.plant_id = m.old_id AND EXISTS (...);
-- UPDATE weed_info w SET plant_id = m.new_id FROM plant_dedup_map m WHERE w.plant_id = m.old_id;

-- 5. Delete the redundant duplicate rows from the plant table
DELETE FROM plant
WHERE id IN (SELECT old_id FROM plant_dedup_map);

-- 6. Standardize the scientific_name for all remaining rows
--    Ensures all names are trimmed and contain single spaces only
UPDATE plant
SET scientific_name = TRIM(REGEXP_REPLACE(scientific_name, '\s+', ' ', 'g'))
WHERE scientific_name != TRIM(REGEXP_REPLACE(scientific_name, '\s+', ' ', 'g'));