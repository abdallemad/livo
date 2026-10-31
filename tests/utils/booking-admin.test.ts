import { test } from "node:test"
import assert from "node:assert/strict"
import { adminCancelBlockedReason, bookingEvents, formatAddressSnapshot } from "@/utils/booking-admin"

const unpaid = [{ status: "PENDING" as const, escrowState: "NONE" as const }]
const held = [{ status: "PAID" as const, escrowState: "HELD" as const }]

test("an unpaid booking that hasn't started can be cancelled", () => {
  assert.equal(adminCancelBlockedReason("PENDING_PAYMENT", unpaid), null)
  assert.equal(adminCancelBlockedReason("PENDING_PROVIDER", []), null)
  assert.equal(adminCancelBlockedReason("CONFIRMED", [{ status: "PENDING", escrowState: "NONE" }]), null)
})

test("captured money blocks cancelling (refunds go through a dispute)", () => {
  assert.match(adminCancelBlockedReason("PENDING_PROVIDER", held)!, /already paid/)
  assert.match(adminCancelBlockedReason("CONFIRMED", [{ status: "PARTIALLY_REFUNDED", escrowState: "PARTIALLY_REFUNDED" }])!, /already paid/)
})

test("started, finished, closed or disputed bookings can't be cancelled here", () => {
  for (const status of ["IN_PROGRESS", "AWAITING_CONFIRMATION", "COMPLETED", "CLOSED"] as const) {
    assert.match(adminCancelBlockedReason(status, [])!, /started or finished/)
  }
  assert.match(adminCancelBlockedReason("DISPUTED", [])!, /dispute/)
  assert.match(adminCancelBlockedReason("CANCELLED", [])!, /already closed/)
  assert.match(adminCancelBlockedReason("REJECTED", [])!, /already closed/)
})

test("events are ordered and a future auto-release is upcoming", () => {
  const now = new Date("2026-10-31T12:00:00Z")
  const events = bookingEvents(
    {
      createdAt: new Date("2026-10-30T08:00:00Z"),
      contactUnlockedAt: new Date("2026-10-30T10:00:00Z"),
      startedAt: new Date("2026-10-31T09:00:00Z"),
      providerCompletedAt: new Date("2026-10-31T11:00:00Z"),
      completedAt: null,
      autoReleaseAt: new Date("2026-11-02T11:00:00Z"),
      cancelledAt: null,
    },
    now,
  )
  assert.deepEqual(events.map((e) => e.key), ["created", "confirmed", "started", "provider-done", "auto-release"])
  assert.equal(events.at(-1)!.upcoming, true)
})

test("auto-release is hidden once the customer confirmed", () => {
  const at = new Date("2026-10-30T08:00:00Z")
  const events = bookingEvents({ createdAt: at, contactUnlockedAt: null, startedAt: null, providerCompletedAt: null, completedAt: at, autoReleaseAt: at, cancelledAt: null })
  assert.ok(!events.some((e) => e.key === "auto-release"))
})

test("address snapshots show the parts they have", () => {
  assert.equal(formatAddressSnapshot({ street: "9 Abbas St", area: "Nasr City", city: "Cairo", label: "Home" }), "9 Abbas St, Nasr City, Cairo")
  assert.equal(formatAddressSnapshot(null), null)
  assert.equal(formatAddressSnapshot({}), null)
})
