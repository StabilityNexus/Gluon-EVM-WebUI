export const TERMS_OF_USE_URL =
  "https://raw.githubusercontent.com/StabilityNexus/Info/main/TermsOfUse.md"

export const TERMS_OF_USE_PAGE_URL =
  "https://github.com/StabilityNexus/Info/blob/main/TermsOfUse.md"

export const TERMS_ACCEPTED_DATE_KEY =
  "stability_nexus_terms_accepted_utc_date"

export function getUtcDateKey(now: Date = new Date()) {
  return now.toISOString().slice(0, 10)
}

export function hasAcceptedTermsToday(
  storage: Pick<Storage, "getItem">,
  now: Date = new Date(),
) {
  return storage.getItem(TERMS_ACCEPTED_DATE_KEY) === getUtcDateKey(now)
}

export function markTermsAcceptedToday(
  storage: Pick<Storage, "setItem">,
  now: Date = new Date(),
) {
  storage.setItem(TERMS_ACCEPTED_DATE_KEY, getUtcDateKey(now))
}
