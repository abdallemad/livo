import { z } from "zod"
import {
  MAX_CERTIFICATES,
  MAX_CUSTOMER_INTERESTS,
  NAME_MAX,
  NAME_MIN,
  PROVIDER_BIO_MAX,
  PROVIDER_BIO_MIN,
  PROVIDER_MAX_AREAS,
  PROVIDER_MAX_CATEGORIES,
  PROVIDER_MAX_YEARS,
  SERVICE_DESCRIPTION_MAX,
  SERVICE_DESCRIPTION_MIN,
  SERVICE_DURATION_MAX,
  SERVICE_DURATION_MIN,
  SERVICE_MAX_IMAGES,
  SERVICE_PRICE_MAX,
  SERVICE_PRICE_MIN,
  SERVICE_TITLE_MAX,
  SERVICE_TITLE_MIN,
} from "@/constants/onboarding"

/**
 * One schema per onboarding step, shared by the step form (zodResolver) and
 * its API route (parseBody). Messages are the English UI copy
 * (docs/DESIGN-SYSTEM.md §9: say how to fix it, don't apologise).
 *
 * Never part of any schema: userId, ADMIN, verificationStatus, status —
 * those come from the session or are set by the service only.
 */

const id = z.string().min(1).max(64)

/**
 * Arabic or Latin letters, spaces and . ' - ; no digits of ANY numbering system
 * (Arabic-Indic ٠-٩ are in the Arabic script) so a phone number can't hide in a name (SY-04).
 */
const NAME_PATTERN = /^(?!.*\p{Nd})[\p{Script=Arabic}\p{Script=Latin}][\p{Script=Arabic}\p{Script=Latin}\s.'-]*$/u

export const nameSchema = z
  .string()
  .trim()
  .min(NAME_MIN, `The name must be at least ${NAME_MIN} characters.`)
  .max(NAME_MAX, `The name is longer than ${NAME_MAX} characters.`)
  .regex(NAME_PATTERN, "Use letters only, without numbers or symbols.")

/** Step 1. Only the two self-service roles; ADMIN is impossible here by construction. */
export const roleStepSchema = z.object({
  role: z.enum(["CUSTOMER", "PROVIDER"], { error: "Choose an account type." }),
})

/** Step 2. `areaId` is required for providers (their primary area); the service enforces that per role. */
export const basicInfoStepSchema = z.object({
  name: nameSchema,
  email: z
    .union([z.literal(""), z.email("Invalid email. Example: name@example.com")])
    .optional()
    .transform((v) => (v ? v.toLowerCase() : null)),
  cityId: id.or(z.literal("")).refine((v) => v !== "", "Choose the city."),
  areaId: id.optional().or(z.literal("")).transform((v) => v || null),
})

/** Customer step 3 (optional). */
export const addressStepSchema = z.object({
  areaId: id.or(z.literal("")).refine((v) => v !== "", "Choose the area."),
  street: z.string().trim().min(3, "Enter the street name.").max(120, "The street name is too long."),
  details: z
    .string()
    .trim()
    .max(200, "The details are too long. Please shorten them.")
    .optional()
    .transform((v) => v || null),
})

/** Customer step 4 (optional). */
export const interestsStepSchema = z.object({
  categoryIds: z.array(id).max(MAX_CUSTOMER_INTERESTS, `Choose at most ${MAX_CUSTOMER_INTERESTS} items.`),
})

/** Provider step 3. */
export const providerProfileStepSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(PROVIDER_BIO_MIN, `Write a short bio about your work (at least ${PROVIDER_BIO_MIN} characters).`)
    .max(PROVIDER_BIO_MAX, `The bio is longer than ${PROVIDER_BIO_MAX} characters.`),
  yearsExperience: z.coerce
    .number({ error: "Enter your years of experience as a number." })
    .int("Enter a whole number.")
    .min(0, "Years of experience can't be less than zero.")
    .max(PROVIDER_MAX_YEARS, `More than ${PROVIDER_MAX_YEARS} years of experience? Check the number.`),
  categoryIds: z
    .array(id)
    .min(1, "Choose at least one specialty.")
    .max(PROVIDER_MAX_CATEGORIES, `Choose at most ${PROVIDER_MAX_CATEGORIES} specialties.`),
  areaIds: z
    .array(id)
    .min(1, "Choose at least one area.")
    .max(PROVIDER_MAX_AREAS, `Choose at most ${PROVIDER_MAX_AREAS} areas.`),
})

/** Provider step 4: the document type sent alongside the uploaded file (multipart field). */
export const documentTypeSchema = z.enum(["NATIONAL_ID", "SELFIE", "CERTIFICATE"], { error: "Unknown document type." })
export { MAX_CERTIFICATES }

/** Provider step 5. Price is a number in EGP; the service stores it as Decimal. */
export const firstServiceStepSchema = z.object({
  title: z
    .string()
    .trim()
    .min(SERVICE_TITLE_MIN, `The title must be at least ${SERVICE_TITLE_MIN} characters.`)
    .max(SERVICE_TITLE_MAX, `The title is longer than ${SERVICE_TITLE_MAX} characters.`),
  categoryId: id.or(z.literal("")).refine((v) => v !== "", "Choose the service category."),
  description: z
    .string()
    .trim()
    .min(SERVICE_DESCRIPTION_MIN, `Describe the service in at least ${SERVICE_DESCRIPTION_MIN} characters.`)
    .max(SERVICE_DESCRIPTION_MAX, `The description is longer than ${SERVICE_DESCRIPTION_MAX} characters.`),
  price: z.coerce
    .number({ error: "Enter the price in numbers." })
    .positive("The price must be greater than zero.")
    .min(SERVICE_PRICE_MIN, `The minimum price is ${SERVICE_PRICE_MIN} EGP.`)
    .max(SERVICE_PRICE_MAX, `The maximum price is ${SERVICE_PRICE_MAX.toLocaleString("en")} EGP. For bigger jobs, use a quote instead.`)
    .multipleOf(0.01, "The price can have at most two decimal places."),
  durationMinutes: z.coerce
    .number({ error: "Choose the estimated duration." })
    .int()
    .min(SERVICE_DURATION_MIN, `The minimum duration is ${SERVICE_DURATION_MIN} minutes.`)
    .max(SERVICE_DURATION_MAX, "The longest duration is one day."),
  imageIds: z.array(id).max(SERVICE_MAX_IMAGES, `At most ${SERVICE_MAX_IMAGES} photos.`).default([]),
})

/** Provider step 6. */
export const submitStepSchema = z.object({
  // A boolean refined to true (not z.literal(true)) so the checkbox's input type stays `boolean`.
  acceptTerms: z
    .boolean({ error: "You must accept the terms to send your profile for review." })
    .refine((v) => v, "You must accept the terms to send your profile for review."),
})

export type RoleStepValues = z.infer<typeof roleStepSchema>
export type BasicInfoStepInput = z.input<typeof basicInfoStepSchema>
export type BasicInfoStepValues = z.output<typeof basicInfoStepSchema>
export type AddressStepInput = z.input<typeof addressStepSchema>
export type AddressStepValues = z.output<typeof addressStepSchema>
export type InterestsStepValues = z.infer<typeof interestsStepSchema>
export type ProviderProfileStepInput = z.input<typeof providerProfileStepSchema>
export type ProviderProfileStepValues = z.output<typeof providerProfileStepSchema>
export type DocumentType = z.infer<typeof documentTypeSchema>
export type FirstServiceStepInput = z.input<typeof firstServiceStepSchema>
export type FirstServiceStepValues = z.output<typeof firstServiceStepSchema>
export type SubmitStepValues = z.infer<typeof submitStepSchema>
