import "server-only"
import type { BookingStatus, Prisma } from "@prisma/client"
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors"
import { customerAccountRepository as repo, type CustomerAddressRow } from "@/repositories/customer-account.repository"
import { onboardingRepository as profiles } from "@/repositories/onboarding.repository"
import type { AddressValues, CustomerBookingListQuery, CustomerPaymentQuery, InterestsSettingsValues } from "@/schemas/customer-account.schema"
import type { AddressDto, CustomerAddresses, CustomerBookingList, CustomerPayments, CustomerSettings } from "@/types/customer-account"
import { addressLine, MAX_ADDRESSES, newAddressIsDefault, nextDefaultAfterDelete } from "@/utils/address-book"
import { contactVisible, CUSTOMER_BOOKING_TABS, customerNextStep, customerPaymentLabel, customerPaymentTotals } from "@/utils/customer-booking"
import { bookingPlace } from "@/utils/provider-booking"
import { formatZonedDateTime } from "@/utils/zoned-time"

/**
 * The customer's account pages (docs/customer-account-feature.md): settings (AU-06), saved addresses (CU-14),
 * bookings (CU-13) and payments & invoices (CU-13, SY-07). The user id always comes from the session; another
 * user's address is a 404.
 */

const num = (v: { toString(): string }) => Number(v.toString())
const label = (r: { nameEn: string | null; nameAr: string }) => r.nameEn ?? r.nameAr
const pages = (total: number, page: number, perPage: number) => ({ total, page, perPage, pageCount: Math.max(1, Math.ceil(total / perPage)) })
const titleOf = (b: { service: { title: string } | null; request: { title: string } | null }) => b.service?.title ?? b.request?.title ?? "Booking"

// --- settings -------------------------------------------------------------------

export async function getCustomerSettings(userId: string): Promise<CustomerSettings | null> {
  const [user, categories] = await Promise.all([repo.findUser(userId), repo.findActiveCategories()])
  if (!user) return null
  return {
    personal: { name: user.name, email: user.email, phone: user.phone, avatarUrl: user.avatarUrl, city: user.city ? label(user.city) : null },
    interestIds: user.interests.map((i) => i.categoryId),
    options: { categories: categories.map((c) => ({ id: c.id, name: label(c) })) },
  }
}

export async function saveInterests(userId: string, values: InterestsSettingsValues): Promise<{ ok: true }> {
  const ids = [...new Set(values.categoryIds)]
  if (ids.length && (await profiles.countActiveCategories(ids)) !== ids.length) {
    throw new ValidationError("Please check your choices.", { categoryIds: ["One of the categories isn't available. Choose from the list."] })
  }
  await profiles.transaction((tx) => profiles.replaceInterests(userId, ids, tx))
  return { ok: true }
}

// --- addresses ------------------------------------------------------------------

const toAddress = (a: CustomerAddressRow): AddressDto => {
  const area = a.area ? label(a.area) : null
  return { id: a.id, label: a.label, street: a.street, details: a.details, areaId: a.areaId, area, city: label(a.city), isDefault: a.isDefault, line: addressLine({ street: a.street, details: a.details, area }) }
}

export async function getAddresses(userId: string): Promise<CustomerAddresses> {
  const user = await repo.findUser(userId)
  const [rows, areas] = await Promise.all([repo.findAddresses(userId), user?.cityId ? repo.findActiveAreas(user.cityId) : Promise.resolve([])])
  return { items: rows.map(toAddress), max: MAX_ADDRESSES, city: user?.city ? label(user.city) : null, areas: areas.map((a) => ({ id: a.id, name: label(a) })) }
}

async function cityFor(userId: string, areaId: string) {
  const user = await repo.findUser(userId)
  if (!user?.cityId) throw new ConflictError("Your account has no city yet. Contact support.")
  if (!(await profiles.findActiveArea(areaId, user.cityId))) throw new ValidationError("Please check the address.", { areaId: ["Choose an area from the list."] })
  return user.cityId
}

export async function createAddress(userId: string, v: AddressValues): Promise<{ id: string }> {
  const cityId = await cityFor(userId, v.areaId)
  return repo.transaction(async (tx) => {
    const existing = await repo.findAddresses(userId, tx)
    if (existing.length >= MAX_ADDRESSES) throw new ConflictError(`You can save up to ${MAX_ADDRESSES} addresses. Delete one first.`)
    const created = await repo.createAddress({ userId, cityId, areaId: v.areaId, street: v.street, details: v.details, label: v.label, isDefault: false }, tx)
    if (newAddressIsDefault(existing.length, v.isDefault)) await repo.setDefault(created.id, userId, tx)
    return created
  })
}

export async function updateAddress(userId: string, id: string, v: AddressValues): Promise<{ id: string }> {
  const cityId = await cityFor(userId, v.areaId)
  await repo.transaction(async (tx) => {
    if ((await repo.updateAddress(id, userId, { cityId, areaId: v.areaId, street: v.street, details: v.details, label: v.label }, tx)) === 0) {
      throw new NotFoundError("That address doesn't exist.")
    }
    if (v.isDefault) await repo.setDefault(id, userId, tx)
  })
  return { id }
}

export async function setDefaultAddress(userId: string, id: string): Promise<{ id: string }> {
  await repo.transaction(async (tx) => {
    if (!(await repo.findAddress(id, userId, tx))) throw new NotFoundError("That address doesn't exist.")
    await repo.setDefault(id, userId, tx)
  })
  return { id }
}

/** Delete; if it was the default, the newest remaining address becomes the default. Bookings keep their own copy. */
export async function deleteAddress(userId: string, id: string): Promise<void> {
  await repo.transaction(async (tx) => {
    const all = await repo.findAddresses(userId, tx)
    if (!all.some((a) => a.id === id)) throw new NotFoundError("That address doesn't exist.")
    const next = nextDefaultAfterDelete(all, id)
    await repo.deleteAddress(id, userId, tx)
    if (next) await repo.setDefault(next, userId, tx)
  })
}

// --- bookings -------------------------------------------------------------------

export async function listMyBookings(customerId: string, query: CustomerBookingListQuery): Promise<CustomerBookingList> {
  const statuses = [...CUSTOMER_BOOKING_TABS[query.tab]] as BookingStatus[]
  const where: Prisma.BookingWhereInput = {
    customerId,
    status: { in: statuses },
    ...(query.q
      ? { OR: [{ number: { contains: query.q, mode: "insensitive" } }, { service: { title: { contains: query.q, mode: "insensitive" } } }, { request: { title: { contains: query.q, mode: "insensitive" } } }] }
      : {}),
  }
  const orderBy: Prisma.BookingOrderByWithRelationInput[] =
    query.tab === "current" ? [{ scheduledAt: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }] : [{ scheduledAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]

  const [[rows, total], grouped] = await Promise.all([repo.findBookingPage(where, orderBy, (query.page - 1) * query.perPage, query.perPage), repo.countBookingsByStatus(customerId)])
  const reviewed = new Set((await repo.findReviewedBookingIds(customerId, rows.map((r) => r.id))).map((r) => r.bookingId))
  const byStatus = new Map(grouped.map((g) => [g.status, g._count._all]))
  const sum = (list: readonly BookingStatus[]) => list.reduce((s, st) => s + (byStatus.get(st) ?? 0), 0)

  return {
    items: rows.map((b) => {
      const p = b.payments[0]
      const done = b.status === "COMPLETED" || b.status === "CLOSED"
      return {
        id: b.id,
        number: b.number,
        source: b.source,
        title: titleOf(b),
        status: b.status,
        scheduledAt: b.scheduledAt?.toISOString() ?? null,
        createdAt: b.createdAt.toISOString(),
        amount: num(b.amount),
        place: bookingPlace(b.addressSnapshot, true),
        providerId: b.provider.userId,
        providerName: b.provider.user.name || "Your provider",
        providerPhone: contactVisible(b.contactUnlockedAt !== null, b.status) ? b.provider.user.phone : null,
        paymentMethod: p?.method ?? null,
        paymentLabel: p ? customerPaymentLabel(p.method, p.status, p.escrowState) : null,
        nextStep: customerNextStep(b.status, { deadline: b.autoReleaseAt ? formatZonedDateTime(b.autoReleaseAt) : null, reviewed: reviewed.has(b.id) }),
        canReview: done && !reviewed.has(b.id),
      }
    }),
    ...pages(total, query.page, query.perPage),
    counts: { current: sum(CUSTOMER_BOOKING_TABS.current), finished: sum(CUSTOMER_BOOKING_TABS.finished), cancelled: sum(CUSTOMER_BOOKING_TABS.cancelled) },
    needsAction: (byStatus.get("PENDING_PAYMENT") ?? 0) + (byStatus.get("AWAITING_CONFIRMATION") ?? 0),
  }
}

// --- payments & invoices -----------------------------------------------------------

export async function getMyPayments(customerId: string, query: CustomerPaymentQuery): Promise<CustomerPayments> {
  const skip = (query.page - 1) * query.perPage
  const [all, invoicesPage] = await Promise.all([repo.findAllPaymentAmounts(customerId), repo.findInvoicePage(customerId, query.view === "invoices" ? skip : 0, query.view === "invoices" ? query.perPage : 1)])
  const totals = customerPaymentTotals(all.map((p) => ({ ...p, amount: num(p.amount), refundedAmount: num(p.refundedAmount) })))
  const [invoiceRows, invoiceCount] = invoicesPage

  if (query.view === "invoices") {
    return {
      totals,
      view: "invoices",
      payments: null,
      invoices: {
        items: invoiceRows.map((i) => ({ id: i.id, number: i.number, total: num(i.total), issuedAt: i.issuedAt.toISOString(), hasPdf: false, booking: { id: i.booking.id, number: i.booking.number, title: titleOf(i.booking) } })),
        ...pages(invoiceCount, query.page, query.perPage),
      },
      invoiceCount,
    }
  }

  const [rows, total] = await repo.findPaymentPage(customerId, skip, query.perPage)
  return {
    totals,
    view: "payments",
    payments: {
      items: rows.map((p) => ({
        id: p.id,
        method: p.method,
        status: p.status,
        amount: num(p.amount),
        refundedAmount: num(p.refundedAmount),
        label: customerPaymentLabel(p.method, p.status, p.escrowState),
        milestone: p.milestone?.title ?? null,
        date: (p.paidAt ?? p.createdAt).toISOString(),
        booking: { id: p.booking.id, number: p.booking.number, title: titleOf(p.booking) },
      })),
      ...pages(total, query.page, query.perPage),
    },
    invoices: null,
    invoiceCount,
  }
}
