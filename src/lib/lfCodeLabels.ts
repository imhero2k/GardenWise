/** Human-readable labels for `plant.lf_code` (Victorian life-form codes). */

export const LF_CODE_LABELS: Record<string, string> = {
  MS: 'Medium Shrub',
  SS: 'Small Shrub',
  T: 'Tree',
  MH: 'Medium Herb',
  PS: 'Prostrate Shrub',
  SH: 'Small Herb',
  GF: 'Ground Fern',
  LH: 'Large Herb',
  EP: 'Epiphyte',
  MTG: 'Medium Tufted Grass',
  SC: 'Scrambler / Climber',
  LTG: 'Large Tufted Grass',
  MNG: 'Medium Non-tufted Grass',
  LNG: 'Large Non-tufted Grass',
  TTG: 'Tiny Tufted Grass',
  HG: 'Herbaceous Groundcover',
}

export function labelLfCode(code: string | null | undefined): string | null {
  if (code == null || !String(code).trim()) return null
  const k = String(code).trim().toUpperCase()
  return LF_CODE_LABELS[k] ?? k
}
