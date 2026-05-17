import { useMemo } from 'react'
import { useLocationArea } from '../context/LocationContext'
import { getGardensForWildlifeInfo } from '../lib/gardensForWildlife'

const linkProps = { target: '_blank' as const, rel: 'noopener noreferrer' }

export function GardensForWildlifeBlurb() {
  const { placeLabel } = useLocationArea()
  const info = useMemo(() => getGardensForWildlifeInfo(placeLabel), [placeLabel])

  return (
    <>
      <strong>
        <a href={info.vicUrl} {...linkProps}>
          Gardens for Wildlife
        </a>
      </strong>{' '}
      — free mentoring and resources to help you create habitat for local birds, insects and other wildlife in your
      garden.{' '}
      {info.kind === 'local' ? (
        <>
          For <strong>{info.suburbLabel}</strong>,{' '}
          <strong>
            <a href={info.councilUrl} {...linkProps}>
              {info.councilName}
            </a>
          </strong>{' '}
          runs a local Gardens for Wildlife program.
        </>
      ) : !placeLabel ? (
        <>Set your Victorian postcode or suburb in the location bar to see if your council has a local program link here.</>
      ) : null}
    </>
  )
}
