#!/usr/bin/env python3

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT_CSV = ROOT / "plants_enriched_final.csv"
OUTPUT_CSV = ROOT / "plant_traits_for_import.csv"


TOKEN_RULES = {
    "pollination_syndrome": [
        "abiotic",
        "bee",
        "bird",
        "insect",
        "mammal",
        "self",
        "vertebrate",
        "wind",
    ],
    "pollination_system": [
        "abiotic",
        "biotic_unspecialised",
    ],
    "flower_colour": [
        "blue_purple",
        "green",
        "pink",
        "red_brown",
        "white_cream",
        "yellow_orange",
    ],
    "fruit_type": [
        "achene",
        "berry",
        "capsule",
        "caryopsis",
        "drupe",
        "follicle",
        "legume",
        "mericarp",
        "nut",
        "nutlet",
        "samara",
        "strobilus",
        "utricle",
    ],
    "fruit_colour": [
        "black",
        "blue",
        "brown",
        "cream",
        "green",
        "grey",
        "orange",
        "pink",
        "purple",
        "red",
        "white",
        "yellow",
    ],
    "fruit_fleshiness": [
        "dry",
        "fleshy",
    ],
    "dispersal_syndrome": [
        "anemochory",
        "ballistic",
        "barochory",
        "endozoochory",
        "epizoochory",
        "hydrochory",
        "myrmecochory",
        "undefined",
        "zoochory",
    ],
    "dispersers": [
        "abiotic_animals",
        "animals",
        "ants",
        "birds",
        "flying_vertebrates",
        "invertebrates",
        "mammals",
        "passive",
        "vertebrates",
        "water",
        "wind",
    ],
    "plant_growth_form": [
        "basal_large",
        "climber",
        "fern",
        "geophyte",
        "graminoid",
        "graminoid_not_tussock",
        "herb",
        "hummock",
        "mallee",
        "palmoid",
        "shrub",
        "subshrub",
        "tree",
        "tussock",
        "woody",
    ],
    "woodiness": [
        "herbaceous",
        "woody",
    ],
    "leaf_phenology": [
        "evergreen",
    ],
}


MULTIWORD_REPLACEMENTS = {
    "pollination_syndrome": {
        "bird insect mammal": "bird insect mammal",
        "bird insect": "bird insect",
        "insect vertebrate": "insect vertebrate",
        "insect self": "insect self",
        "self wind": "self wind",
        "insect wind": "insect wind",
    },
    "dispersers": {
        "abiotic animals": "abiotic_animals",
        "flying vertebrates": "flying_vertebrates",
    },
    "plant_growth_form": {
        "basal large": "basal_large",
        "graminoid not tussock": "graminoid_not_tussock",
        "mallee tree": "mallee tree",
        "shrub tree": "shrub tree",
    },
}


SEASONAL_TRAITS = ("flowering_time", "fruiting_time")
TAG_TRAITS = tuple(TOKEN_RULES.keys())


def split_on_commas(raw_value: str) -> list[str]:
    return [part.strip() for part in re.split(r",\s*", raw_value.strip()) if part.strip()]


def apply_replacements(trait_name: str, text: str) -> str:
    result = f" {text.strip()} "
    for source, target in MULTIWORD_REPLACEMENTS.get(trait_name, {}).items():
        result = result.replace(f" {source} ", f" {target} ")
    return result.strip()


def normalize_tag_values(trait_name: str, raw_value: str) -> list[str]:
    allowed_tokens = TOKEN_RULES[trait_name]
    allowed_set = set(allowed_tokens)
    normalized = []
    seen = set()

    for component in split_on_commas(raw_value):
        component = apply_replacements(trait_name, component)
        words = component.replace("_", " ").split()
        matched = []

        for token in allowed_tokens:
            token_words = token.replace("_", " ").split()
            token_len = len(token_words)
            for index in range(len(words) - token_len + 1):
                if words[index : index + token_len] == token_words:
                    matched.append(token)
                    break

        if not matched:
            fallback = component.strip().replace(" ", "_").lower()
            if fallback:
                matched = [fallback]

        for value in matched:
            value = value.strip().lower()
            if value not in allowed_set and trait_name != "plant_growth_form":
                continue
            if value and value not in seen:
                seen.add(value)
                normalized.append(value)

    return normalized


def normalize_seasonality(raw_value: str) -> list[int]:
    active_months = set()
    for component in split_on_commas(raw_value):
        pattern = component.strip().lower()
        if len(pattern) != 12 or any(char not in {"y", "n"} for char in pattern):
            continue
        for month_index, marker in enumerate(pattern, start=1):
            if marker == "y":
                active_months.add(month_index)
    return sorted(active_months)


def normalize_number(raw_value: str) -> str:
    return format(float(raw_value), ".15g")


def build_rows() -> list[dict[str, str]]:
    rows = []
    with INPUT_CSV.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        for source_row in reader:
            plant_id = source_row["id"].strip()
            scientific_name = source_row["name"].strip()
            common_name = source_row["commonname"].strip()
            lf_code = source_row["lf"].strip()

            for trait_name in TAG_TRAITS:
                raw_value = source_row.get(trait_name, "").strip()
                if not raw_value:
                    continue
                for trait_value in normalize_tag_values(trait_name, raw_value):
                    rows.append(
                        {
                            "plant_id": plant_id,
                            "scientific_name": scientific_name,
                            "common_name": common_name,
                            "lf_code": lf_code,
                            "trait_name": trait_name,
                            "trait_value": trait_value,
                            "month": "",
                            "present": "",
                            "source_raw": raw_value,
                        }
                    )

            raw_height = source_row.get("plant_height", "").strip()
            if raw_height:
                normalized_height = normalize_number(raw_height)
                rows.append(
                    {
                        "plant_id": plant_id,
                        "scientific_name": scientific_name,
                        "common_name": common_name,
                        "lf_code": lf_code,
                        "trait_name": "plant_height_m",
                        "trait_value": normalized_height,
                        "month": "",
                        "present": "",
                        "source_raw": raw_height,
                    }
                )

            for trait_name in SEASONAL_TRAITS:
                raw_value = source_row.get(trait_name, "").strip()
                if not raw_value:
                    continue
                for month in normalize_seasonality(raw_value):
                    rows.append(
                        {
                            "plant_id": plant_id,
                            "scientific_name": scientific_name,
                            "common_name": common_name,
                            "lf_code": lf_code,
                            "trait_name": trait_name,
                            "trait_value": "",
                            "month": str(month),
                            "present": "true",
                            "source_raw": raw_value,
                        }
                    )

    rows.sort(
        key=lambda row: (
            int(row["plant_id"]),
            row["trait_name"],
            int(row["month"]) if row["month"] else 0,
            row["trait_value"],
        )
    )
    return rows


def write_rows(rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "plant_id",
        "scientific_name",
        "common_name",
        "lf_code",
        "trait_name",
        "trait_value",
        "month",
        "present",
        "source_raw",
    ]
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    rows = build_rows()
    write_rows(rows)
    print(f"Wrote {len(rows)} rows to {OUTPUT_CSV.name}")


if __name__ == "__main__":
    main()
