import { z } from "zod"
import { BOOKING_NOTES_MAX, BOOKING_PAYMENT_METHODS } from "@/utils/booking-checkout"
import { contactProblem } from "@/utils/new-request"

/**
 * Booking a fixed-price service (CU-02, CU-07; docs/booking-checkout-feature.md). One schema for the wizard and
 * `POST /api/me/bookings`. The customer id comes from the session; the price, commission and provider come from the
 * service row on the server — never from the body.
 */
export const createServiceBookingSchema = z.object({
  serviceId: z.string().trim().min(1, "Choose a service.").max(64),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a day."),
  time: z.string().trim().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  addressId: z.string().trim().min(1, "Choose the address for the job.").max(64),
  notes: z
    .string()
    .trim()
    .max(BOOKING_NOTES_MAX, `Keep notes under ${BOOKING_NOTES_MAX} characters.`)
    .refine((v) => contactProblem(v) === null, { message: "Don't include phone numbers, emails or chat links — you'll get the provider's contact once they accept." })
    .optional()
    .transform((v) => v || undefined),
  paymentMethod: z.enum(BOOKING_PAYMENT_METHODS, { error: "Choose how you'll pay." }),
})

export type CreateServiceBookingInput = z.input<typeof createServiceBookingSchema>
export type CreateServiceBookingValues = z.output<typeof createServiceBookingSchema>
