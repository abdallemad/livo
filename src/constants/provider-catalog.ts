import { SERVICE_MAX_IMAGES } from "./onboarding"

/**
 * Limits for the provider's own catalog (docs/provider-services-portfolio-feature.md).
 * Service field limits (title, description, price, duration, photos) are shared with onboarding
 * step 5 and live in `constants/onboarding.ts`.
 */
export const SERVICES_MAX_PER_PROVIDER = 30

export const PORTFOLIO_MAX_ITEMS = 30
export const PORTFOLIO_MAX_IMAGES = 6
export const PORTFOLIO_TITLE_MIN = 3
export const PORTFOLIO_TITLE_MAX = 80
export const PORTFOLIO_DESCRIPTION_MAX = 500

/**
 * Total photos (attached + not yet saved) a provider may keep per prefix: every slot full plus a
 * little room for uploads in an unsaved form. Stops anyone parking unlimited private files.
 */
export const SERVICE_PHOTOS_CAP = SERVICES_MAX_PER_PROVIDER * SERVICE_MAX_IMAGES + 10
export const PORTFOLIO_PHOTOS_CAP = PORTFOLIO_MAX_ITEMS * PORTFOLIO_MAX_IMAGES + 12
