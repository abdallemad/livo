import { test } from "node:test"
import assert from "node:assert/strict"
import { bookingChannel, parseChannel, userChannel } from "@/constants/realtime"
import { sendMessageSchema } from "@/schemas/chat.schema"
import { canReadChat, chatClosedReason, mergeMessage, messagePreview } from "@/utils/chat"

test("chat opens only once the provider accepted, and closes when the job ends", () => {
  assert.equal(canReadChat(false), false)
  assert.match(chatClosedReason("PENDING_PROVIDER", false)!, /accepts/)
  for (const s of ["CONFIRMED", "IN_PROGRESS", "AWAITING_CONFIRMATION"] as const) assert.equal(chatClosedReason(s, true), null)
  assert.match(chatClosedReason("COMPLETED", true)!, /finished/)
  assert.match(chatClosedReason("CANCELLED", true)!, /cancelled/)
  assert.match(chatClosedReason("DISPUTED", true)!, /dispute/)
})

test("preview is one trimmed line cut at a word", () => {
  assert.equal(messagePreview("  hello\n\nthere  "), "hello there")
  const long = "word ".repeat(40)
  const p = messagePreview(long, 30)
  assert.ok(p.length <= 30 && p.endsWith("…") && !p.includes("  "))
})

const m = (id: string, at: string, clientId: string | null = null) => ({ id, clientId, createdAt: at })

test("merging messages replaces the optimistic copy and keeps time order", () => {
  const list = [m("a", "2026-11-02T10:00:00Z"), m("pending-x", "2026-11-02T10:05:00Z", "x")]
  const merged = mergeMessage(list, m("b", "2026-11-02T10:04:59Z", "x"))
  assert.deepEqual(merged.map((x) => x.id), ["a", "b"])
  assert.equal(mergeMessage(merged, m("b", "2026-11-02T10:04:59Z", "x")).length, 2) // pushed duplicate
  assert.deepEqual(mergeMessage(merged, m("c", "2026-11-02T09:00:00Z")).map((x) => x.id), ["c", "a", "b"])
})

test("channel names round-trip and anything else is refused", () => {
  assert.deepEqual(parseChannel(userChannel("user_2abcXYZ")), { kind: "user", id: "user_2abcXYZ" })
  assert.deepEqual(parseChannel(bookingChannel("cmh123abc")), { kind: "booking", id: "cmh123abc" })
  assert.equal(parseChannel("private-admin-1"), null)
  assert.equal(parseChannel("presence-user-1"), null)
  assert.equal(parseChannel("private-user-a-b"), null)
  assert.equal(parseChannel("private-user-"), null)
})

test("message schema", () => {
  assert.deepEqual(sendMessageSchema.parse({ body: "  hi  " }), { body: "hi" })
  assert.equal(sendMessageSchema.safeParse({ body: "   " }).success, false)
  assert.equal(sendMessageSchema.safeParse({ body: "x".repeat(2001) }).success, false)
})
