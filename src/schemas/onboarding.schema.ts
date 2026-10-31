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
 * its API route (parseBody). Messages are the Arabic UI copy
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
  .min(NAME_MIN, `الاسم لازم يكون ${NAME_MIN} حروف على الأقل.`)
  .max(NAME_MAX, `الاسم أطول من ${NAME_MAX} حرف.`)
  .regex(NAME_PATTERN, "اكتب الاسم بالحروف بس، من غير أرقام أو رموز.")

/** Step 1. Only the two self-service roles; ADMIN is impossible here by construction. */
export const roleStepSchema = z.object({
  role: z.enum(["CUSTOMER", "PROVIDER"], { error: "اختار نوع الحساب." }),
})

/** Step 2. `areaId` is required for providers (their primary area); the service enforces that per role. */
export const basicInfoStepSchema = z.object({
  name: nameSchema,
  email: z
    .union([z.literal(""), z.email("الإيميل مش صحيح. مثال: name@example.com")])
    .optional()
    .transform((v) => (v ? v.toLowerCase() : null)),
  cityId: id.or(z.literal("")).refine((v) => v !== "", "اختار المدينة."),
  areaId: id.optional().or(z.literal("")).transform((v) => v || null),
})

/** Customer step 3 (optional). */
export const addressStepSchema = z.object({
  areaId: id.or(z.literal("")).refine((v) => v !== "", "اختار المنطقة."),
  street: z.string().trim().min(3, "اكتب اسم الشارع.").max(120, "اسم الشارع طويل أوي."),
  details: z
    .string()
    .trim()
    .max(200, "التفاصيل طويلة أوي، اختصرها.")
    .optional()
    .transform((v) => v || null),
})

/** Customer step 4 (optional). */
export const interestsStepSchema = z.object({
  categoryIds: z.array(id).max(MAX_CUSTOMER_INTERESTS, `اختار ${MAX_CUSTOMER_INTERESTS} حاجات بالكتير.`),
})

/** Provider step 3. */
export const providerProfileStepSchema = z.object({
  bio: z
    .string()
    .trim()
    .min(PROVIDER_BIO_MIN, `اكتب نبذة عن شغلك (${PROVIDER_BIO_MIN} حرف على الأقل).`)
    .max(PROVIDER_BIO_MAX, `النبذة أطول من ${PROVIDER_BIO_MAX} حرف.`),
  yearsExperience: z.coerce
    .number({ error: "اكتب عدد سنين الخبرة بالأرقام." })
    .int("اكتب رقم صحيح.")
    .min(0, "سنين الخبرة ما ينفعش تكون أقل من صفر.")
    .max(PROVIDER_MAX_YEARS, `سنين الخبرة أكتر من ${PROVIDER_MAX_YEARS}؟ راجع الرقم.`),
  categoryIds: z
    .array(id)
    .min(1, "اختار تخصص واحد على الأقل.")
    .max(PROVIDER_MAX_CATEGORIES, `اختار ${PROVIDER_MAX_CATEGORIES} تخصصات بالكتير.`),
  areaIds: z
    .array(id)
    .min(1, "اختار منطقة واحدة على الأقل.")
    .max(PROVIDER_MAX_AREAS, `اختار ${PROVIDER_MAX_AREAS} منطقة بالكتير.`),
})

/** Provider step 4: the document type sent alongside the uploaded file (multipart field). */
export const documentTypeSchema = z.enum(["NATIONAL_ID", "SELFIE", "CERTIFICATE"], { error: "نوع المستند مش معروف." })
export { MAX_CERTIFICATES }

/** Provider step 5. Price is a number in EGP; the service stores it as Decimal. */
export const firstServiceStepSchema = z.object({
  title: z
    .string()
    .trim()
    .min(SERVICE_TITLE_MIN, `العنوان لازم يكون ${SERVICE_TITLE_MIN} حروف على الأقل.`)
    .max(SERVICE_TITLE_MAX, `العنوان أطول من ${SERVICE_TITLE_MAX} حرف.`),
  categoryId: id.or(z.literal("")).refine((v) => v !== "", "اختار تصنيف الخدمة."),
  description: z
    .string()
    .trim()
    .min(SERVICE_DESCRIPTION_MIN, `اوصف الخدمة في ${SERVICE_DESCRIPTION_MIN} حرف على الأقل.`)
    .max(SERVICE_DESCRIPTION_MAX, `الوصف أطول من ${SERVICE_DESCRIPTION_MAX} حرف.`),
  price: z.coerce
    .number({ error: "اكتب السعر بالأرقام." })
    .positive("السعر لازم يكون أكبر من صفر.")
    .min(SERVICE_PRICE_MIN, `أقل سعر ${SERVICE_PRICE_MIN} ج.م.`)
    .max(SERVICE_PRICE_MAX, `أعلى سعر ${SERVICE_PRICE_MAX.toLocaleString("en")} ج.م. لو الشغل أكبر، خليه بعرض سعر.`)
    .multipleOf(0.01, "السعر بحد أقصى قرشين بعد العلامة."),
  durationMinutes: z.coerce
    .number({ error: "اختار المدة المتوقعة." })
    .int()
    .min(SERVICE_DURATION_MIN, `أقل مدة ${SERVICE_DURATION_MIN} دقيقة.`)
    .max(SERVICE_DURATION_MAX, "أطول مدة يوم واحد."),
  imageIds: z.array(id).max(SERVICE_MAX_IMAGES, `${SERVICE_MAX_IMAGES} صور بالكتير.`).default([]),
})

/** Provider step 6. */
export const submitStepSchema = z.object({
  // A boolean refined to true (not z.literal(true)) so the checkbox's input type stays `boolean`.
  acceptTerms: z
    .boolean({ error: "لازم توافق على الشروط عشان تبعت ملفك للمراجعة." })
    .refine((v) => v, "لازم توافق على الشروط عشان تبعت ملفك للمراجعة."),
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
