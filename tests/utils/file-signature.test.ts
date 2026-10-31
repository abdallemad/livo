import { test } from "node:test"
import assert from "node:assert/strict"
import { detectFileType } from "@/utils/file-signature"

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])

test("detects real image and PDF signatures", () => {
  assert.equal(detectFileType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg")
  assert.equal(detectFileType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png")
  assert.equal(detectFileType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50)), "image/webp")
  assert.equal(detectFileType(new TextEncoder().encode("%PDF-1.7\n...")), "application/pdf")
})

test("rejects disguised and unknown files", () => {
  assert.equal(detectFileType(new TextEncoder().encode("<html><script>alert(1)</script>")), null)
  assert.equal(detectFileType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x41, 0x56, 0x49, 0x20)), null) // RIFF/AVI
  assert.equal(detectFileType(new Uint8Array([])), null)
})
