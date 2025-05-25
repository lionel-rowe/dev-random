const LOCALE = 'en-US'
export const listFmt = new Intl.ListFormat(LOCALE, { type: 'disjunction' })
export const numFmt = new Intl.NumberFormat(LOCALE)
export const MAX_COUNT = 10_000

export const SITE_TITLE = 'Random Number Generator'
export const BASE_URL = 'https://dev-random.deno.dev/'
