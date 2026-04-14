/**
 * Example local management hints keyed by keywords that can overlap ALA profile text.
 * Replace or load from your AWS/API dataset; this is illustrative only.
 */

import type { LocalManagementAdviceEntry } from '../lib/weedsAdviceMatch'

export const WEEDS_LOCAL_ADVICE_HINTS: LocalManagementAdviceEntry[] = [
  {
    id: 'chemical-safety',
    keywords: ['herbicide', 'chemical', 'spray', 'glyphosate', 'metsulfuron'],
    advice:
      'Always read the label, use the right rate for the situation, and check weather and buffer distances to protect nearby plants and water.',
  },
  {
    id: 'fragment-spread',
    keywords: ['fragment', 'stem', 'vegetative', 'rhizome', 'spread'],
    advice:
      'Many aquatic and creeping weeds spread from tiny fragments — clean tools between sites and avoid moving mud or plant bits to new areas.',
  },
  {
    id: 'get-local-rules',
    keywords: ['council', 'biosecurity', 'declared', 'permit'],
    advice:
      'Declared species and herbicide use are regulated by state/territory and council — confirm before you treat or dispose of material.',
  },
]
