export interface SeasonalCard {
  id: string
  title: string
  description: string
  tags: string[]
  ecoTip: string
}

export const seasonalCards: SeasonalCard[] = [
  {
    id: 's1',
    title: 'Best plants this season',
    description:
      'Try native kangaroo paw and correa for colour with lower water needs.',
    tags: ['Summer', 'Outdoor', 'Native'],
    ecoTip: 'Mulch with local arborist chips to lock in moisture and feed soil life.',
  },
  {
    id: 's2',
    title: 'Cool-season picks',
    description:
      'Brassicas and peas in vegie beds; indoors, shift light-loving plants closer to windows.',
    tags: ['Winter', 'Outdoor', 'Indoor'],
    ecoTip: 'Collect rainwater in winter to use on dry spells — reduces tap water use.',
  },
  {
    id: 's3',
    title: 'Indoor jungle refresh',
    description:
      'Snake plants and pothos thrive in bright indirect light; group for humidity.',
    tags: ['Indoor', 'Year-round'],
    ecoTip: 'Wipe leaves monthly — cleaner leaves photosynthesise better and need less “help”.',
  },
  {
    id: 's4',
    title: 'Biodiversity boost',
    description:
      'Layer heights: groundcovers, shrubs, and small trees to support birds and insects.',
    tags: ['Outdoor', 'Spring'],
    ecoTip: 'Leave a small “wild corner” with leaf litter — native skinks love it.',
  },
]
