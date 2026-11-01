import assert from "node:assert/strict"
import { test } from "node:test"
import { profileMetaDescription, publicWeek, specialtiesPhrase } from "@/utils/provider-profile"

test("publicWeek: null when no hours were set", () => {
  assert.equal(publicWeek([]), null)
})

test("publicWeek: Saturday first, sorted ranges, closed days empty", () => {
  const week = publicWeek([
    { weekday: 0, startTime: "14:00", endTime: "18:00" },
    { weekday: 0, startTime: "09:00", endTime: "12:00" },
    { weekday: 6, startTime: "10:00", endTime: "24:00" },
  ])!
  assert.equal(week.length, 7)
  assert.equal(week[0].day, "Saturday")
  assert.deepEqual(week[0].ranges, ["10:00 AM – Midnight"])
  assert.deepEqual(week[1].ranges, ["9:00 AM – Noon", "2:00 PM – 6:00 PM"])
  assert.equal(week[6].day, "Friday")
  assert.deepEqual(week[6].ranges, [])
})

test("specialtiesPhrase", () => {
  assert.equal(specialtiesPhrase([]), "")
  assert.equal(specialtiesPhrase(["Painting"]), "Painting")
  assert.equal(specialtiesPhrase(["Painting", "Plumbing"]), "Painting and Plumbing")
  assert.equal(specialtiesPhrase(["A", "B", "C", "D"]), "A, B and 2 more")
})

test("profileMetaDescription: facts only, skips missing ones", () => {
  assert.equal(
    profileMetaDescription({ name: "Omar", specialties: ["Plumbing"], city: "Cairo", completedJobs: 0, yearsExperience: null }),
    "Omar is a verified Plumbing provider in Cairo. See services, past work and reviews, and book or request a quote.",
  )
  assert.match(profileMetaDescription({ name: "Omar", specialties: [], city: "Cairo", completedJobs: 12, yearsExperience: 5 }), /5 years of experience, 12 jobs done on Livo\./)
})
