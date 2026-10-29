#!/usr/bin/env python3
"""Load repo CSVs and optional real boundaries/risk data; one atomic DB transaction."""
import argparse
import csv
import importlib.util
import json
from pathlib import Path
from init_db import admin_connect


def rows(path):
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def boolean(value):
    value = str(value or '').strip().lower()
    if not value:
        return None
    if value in ('yes', 'y', 'true', '1'):
        return True
    if value in ('no', 'n', 'false', '0'):
        return False
    raise ValueError(f'Invalid boolean: {value!r}')


def number(value):
    return float(value) if str(value or '').strip() else None


def prepare(args):
    db = args.repo / 'database'
    plants = rows(db / 'plant.csv')
    regions = rows(db / 'bioregion.csv')
    links = rows(db / 'bioregion_plant.csv')
    # Reuse the repository's exact trait normalization without its hardcoded paths.
    spec = importlib.util.spec_from_file_location('gardenwise_traits', db / 'normalize_plant_traits.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.INPUT_CSV = db / 'data/Iteration-2/cleaned/plants_enriched_final.csv'
    traits = module.build_rows()
    geo = json.loads(args.boundaries.read_text()) if args.boundaries else None
    if geo:
        if geo.get('type') != 'FeatureCollection':
            raise ValueError('Boundaries must be a WGS84/EPSG:4326 GeoJSON FeatureCollection.')
        names = {r['bioregion_name'].strip() for r in regions}
        got = set()
        for feature in geo['features']:
            name = feature.get('properties', {}).get('bioregion_name')
            geom = feature.get('geometry') or {}
            if name not in names:
                raise ValueError(f'Unknown/missing bioregion_name in GeoJSON: {name!r}')
            if geom.get('type') not in ('Polygon', 'MultiPolygon'):
                raise ValueError(f'{name}: geometry must be Polygon or MultiPolygon')
            got.add(name)
        if got != names:
            raise ValueError(f'GeoJSON missing bioregions: {sorted(names - got)}')
    weeds = rows(args.weed_csv) if args.weed_csv else []
    required = {'scientific_name', 'common_name', 'risk_rating', 'risk_score', 'weed_status_vic',
                'impact_natural_systems', 'impact_score', 'invasiveness_score', 'is_wons'}
    if args.weed_csv and (not weeds or not required.issubset(weeds[0])):
        raise ValueError('Weed CSV is empty or missing canonical columns: ' + ', '.join(sorted(required)))
    if not args.catalog_only and (not geo or not weeds):
        raise ValueError('Full import requires --boundaries and --weed-csv. Use --catalog-only explicitly for the available repo data; location/weed features will be incomplete.')
    return plants, regions, links, traits, geo, weeds


def load(cur, data):
    plants, regions, links, traits, geo, weeds = data
    for r in regions:
        cur.execute('INSERT INTO bioregion(id,bioregion_name) VALUES (%s,%s) ON CONFLICT DO NOTHING',
                    (int(r['id']), r['bioregion_name'].strip()))
        cur.execute('SELECT bioregion_name FROM bioregion WHERE id=%s', (int(r['id']),))
        if cur.fetchone() != (r['bioregion_name'].strip(),):
            raise ValueError('Existing bioregion IDs differ from the repo. Use a fresh DB or a database dump.')
    for r in plants:
        cur.execute('INSERT INTO plant(id,scientific_name,common_name,lf_code,nursery_available) VALUES (%s,%s,%s,%s,%s) ON CONFLICT DO NOTHING',
                    (int(r['id']), r['scientific_name'].strip(), r['common_name'] or None,
                     r['lf_code'] or None, boolean(r['nursery_available'])))
        cur.execute('SELECT scientific_name FROM plant WHERE id=%s', (int(r['id']),))
        if cur.fetchone() != (r['scientific_name'].strip(),):
            raise ValueError('Existing plant IDs differ from the repo. Use a fresh DB or a database dump.')
    cur.executemany('INSERT INTO bioregion_plant VALUES (%s,%s,%s) ON CONFLICT DO NOTHING',
                    [(int(r['bioregion_id']), int(r['plant_id']), number(r['recommendation_weight'])) for r in links])
    cur.executemany('''INSERT INTO plant_trait(plant_id,trait_name,trait_value,month,present,source_raw)
        SELECT p.id,%s,%s,%s,%s,%s FROM plant p WHERE p.scientific_name=%s ON CONFLICT DO NOTHING''',
        [(r['trait_name'], r['trait_value'] or None, int(r['month']) if r['month'] else None,
          boolean(r['present']), r['source_raw'], r['scientific_name']) for r in traits])
    cur.execute("SELECT setval(pg_get_serial_sequence('plant','id'), COALESCE(MAX(id),1), MAX(id) IS NOT NULL) FROM plant")
    if geo:
        grouped = {}
        for f in geo['features']:
            grouped.setdefault(f['properties']['bioregion_name'], []).append(f['geometry'])
        for name, geometries in grouped.items():
            collection = {'type': 'GeometryCollection', 'geometries': geometries}
            cur.execute('''UPDATE bioregion SET boundary = ST_Multi(ST_CollectionExtract(
                ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(%s),4326)),3))
                WHERE bioregion_name=%s''', (json.dumps(collection), name))
        cur.execute('SELECT count(*) FROM bioregion WHERE boundary IS NULL OR ST_IsEmpty(boundary) OR NOT ST_IsValid(boundary)')
        if cur.fetchone()[0]:
            raise ValueError('One or more bioregion boundaries are empty/invalid; import rolled back.')
    # Start weed-generated IDs after the catalogue IDs. Existing records are preserved.
    for r in weeds:
        name = r['scientific_name'].strip()
        if not name:
            raise ValueError('Weed scientific_name cannot be empty')
        cur.execute("INSERT INTO plant(scientific_name,common_name,lf_code) VALUES (%s,%s,'unknown') ON CONFLICT DO NOTHING",
                    (name, r['common_name'] or None))
        cur.execute('''INSERT INTO weed_info(plant_id,risk_rating,risk_score,weed_status_vic,
            impact_natural_systems,impact_score,invasiveness_score,is_wons)
            SELECT id,%s,%s,%s,%s,%s,%s,%s FROM plant WHERE scientific_name=%s
            ON CONFLICT DO NOTHING''', (r['risk_rating'] or None, number(r['risk_score']),
            r['weed_status_vic'] or None, r['impact_natural_systems'] or None,
            number(r['impact_score']), number(r['invasiveness_score']), boolean(r['is_wons']) or False, name))
    cur.execute("SELECT setval(pg_get_serial_sequence('bioregion','id'), COALESCE(MAX(id),1), MAX(id) IS NOT NULL) FROM bioregion")
    cur.execute('ANALYZE')
    for table in ('plant', 'bioregion', 'bioregion_plant', 'plant_trait', 'weed_info'):
        # Identifiers are fixed constants, never user input.
        cur.execute('SELECT count(*) FROM ' + table)
        print(f'{table}: {cur.fetchone()[0]}')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--repo', type=Path, default=Path(__file__).with_name('GardenWise'))
    p.add_argument('--boundaries', type=Path)
    p.add_argument('--weed-csv', type=Path)
    p.add_argument('--catalog-only', action='store_true')
    p.add_argument('--check-only', action='store_true', help='Validate inputs; do not connect to RDS.')
    args = p.parse_args()
    data = prepare(args)
    print(f'Input: {len(data[0])} plants, {len(data[1])} regions, {len(data[2])} mappings, {len(data[3])} trait rows.')
    if args.catalog_only:
        print('PARTIAL IMPORT: Missing boundaries/risk data means location queries and weed classification are incomplete.')
    if args.check_only:
        return
    _, conn = admin_connect()
    with conn:
        with conn.cursor() as cur:
            cur.execute(Path(__file__).with_name('schema.sql').read_text())
            load(cur, data)
    print('Import committed. Existing matching rows were preserved; no tables were dropped.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, FileNotFoundError) as exc:
        raise SystemExit(str(exc))
