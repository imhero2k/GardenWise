export type EducationStat = {
  value: string
  label: string
}

export type EducationSource = {
  label: string
  href?: string
}

const BIODIVERSITY_2037_HREF =
  'https://www.environment.vic.gov.au/biodiversity/biodiversity-plan'

const ADVISORY_WEEDS_HREF =
  'https://www.environment.vic.gov.au/__data/assets/excel_doc/0027/563607/Advisory-list-of-environmental-weeds-in-Victoria_2022.xlsx'

export const LEARN_NATIVE_STATS: EducationStat[] = [
  {
    value: '>50%',
    label: "of Victoria's native vegetation cleared since European settlement",
  },
  {
    value: '4,000',
    label: 'habitat hectares lost every year, even with regulations in place',
  },
  {
    value: '$283M',
    label: "estimated annual health cost of Melbourne's urban heat island effect",
  },
]

export const LEARN_WEED_STATS: EducationStat[] = [
  {
    value: '1,800+',
    label: "environmental weed species listed in Victoria's advisory list (2022)",
  },
  {
    value: '$24.5B',
    label: 'estimated yearly cost of environmental weeds to Australia — plants are the largest share',
  },
  {
    value: '$300M',
    label: 'spent each year on public weed control across national parks and Indigenous lands',
  },
]

export const HOME_IMPACT_STATS: EducationStat[] = [
  {
    value: '~54%',
    label: 'Of Victoria’s original native vegetation estimated cleared since European settlement.',
  },
  {
    value: '$24.5B',
    label: 'Estimated yearly cost of environmental weeds to Australia — plants are the largest share.',
  },
  {
    value: '100+',
    label: 'Australian endemic species recognised as extinct or extinct in the wild since 1788.',
  },
]

/** References for statistics and educational copy on Home and Learn. */
export const EDUCATION_SOURCES: EducationSource[] = [
  {
    label: 'Protecting Victoria’s Environment — Biodiversity 2037 (Victorian Government, DEECA, 2017)',
    href: BIODIVERSITY_2037_HREF,
  },
  {
    label: 'Victorian Auditor-General’s Office — Offsetting native vegetation loss on private land (citing DELWP)',
    href: 'https://www.audit.vic.gov.au/report/offsetting-native-vegetation-loss-private-land/',
  },
  {
    label: 'DEECA / ARI Victoria — Advisory List of Environmental Weeds in Victoria (2022)',
    href: ADVISORY_WEEDS_HREF,
  },
  {
    label: 'Agriculture Victoria — Invasive Plants and Animals Policy Framework',
    href: 'https://agriculture.vic.gov.au/biosecurity/weeds',
  },
  {
    label: 'DEECA — Weeds and Pests on Public Land Program',
    href: 'https://www.environment.vic.gov.au/conservation/land-and-water-management/weeds-and-pests-on-public-land',
  },
  {
    label: 'CSIRO / NeoBiota (2021)',
    href: 'https://www.csiro.au/',
  },
  {
    label: 'Australian State of the Environment (2021)',
    href: 'https://soe.dcceew.gov.au/',
  },
  {
    label: 'Woinarski, J. C. Z. et al. (2019) — Three billion birds lost',
    href: 'https://doi.org/10.1016/j.biocon.2019.07.026',
  },
]
