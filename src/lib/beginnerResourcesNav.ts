export const BEGINNER_RESOURCES_ID = 'beginner-resources'
export const BEGINNER_RESOURCES_HASH = 'beginner-resources'
export const BEGINNER_RESOURCES_PATH = '/beginners#beginner-resources'

export function scrollToBeginnerResources() {
  document.getElementById(BEGINNER_RESOURCES_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
