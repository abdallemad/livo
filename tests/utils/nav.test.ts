import assert from "node:assert/strict"
import { test } from "node:test"
import { MARKETING_NAV_GROUPS } from "@/constants/nav"
import { activeGroupId, buildNavGroups } from "@/utils/nav"

const cats = Array.from({ length: 10 }, (_, i) => ({ slug: `c${i}`, name: `Cat ${i}` }))

test("buildNavGroups: categories only in the Services group, capped", () => {
  const groups = buildNavGroups(MARKETING_NAV_GROUPS, cats, 3)
  const services = groups.find((g) => g.id === "services")!
  assert.deepEqual(services.categories.map((c) => c.href), ["/services/c0", "/services/c1", "/services/c2"])
  assert.ok(groups.filter((g) => g.id !== "services").every((g) => g.categories.length === 0))
  assert.ok(groups.every((g) => !("withCategories" in g)))
})

test("buildNavGroups: a DB outage (no categories) still yields every static link", () => {
  const groups = buildNavGroups(MARKETING_NAV_GROUPS, [])
  assert.equal(groups.length, MARKETING_NAV_GROUPS.length)
  assert.ok(groups[0].items.length > 0)
})

test("nav never links /policies (404 until published)", () => {
  const hrefs = MARKETING_NAV_GROUPS.flatMap((g) => [g.href, ...g.items.map((i) => i.href)])
  assert.equal(hrefs.includes("/policies"), false)
})

test("activeGroupId: longest match wins, unrelated paths match nothing", () => {
  const groups = buildNavGroups(MARKETING_NAV_GROUPS, cats)
  assert.equal(activeGroupId(groups, "/services/c1/page/2"), "services")
  assert.equal(activeGroupId(groups, "/faq"), "help")
  assert.equal(activeGroupId(groups, "/become-provider"), "providers")
  assert.equal(activeGroupId(groups, "/"), null)
  assert.equal(activeGroupId(groups, "/servicesx"), null)
})
