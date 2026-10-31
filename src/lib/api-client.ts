import type { ApiResponse } from "@/types/api"

/**
 * Browser-side fetch wrapper used ONLY by hooks in `src/hooks`. It unwraps the
 * `ApiResponse` envelope: returns `data` on success, throws `ApiError` (with
 * `fieldErrors` for react-hook-form) on failure. Components never call it.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

interface ApiRequestInit extends Omit<RequestInit, "body"> {
  query?: Query
  body?: unknown
}

function withQuery(path: string, query?: Query) {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

export async function apiFetch<T>(path: string, { query, body, headers, ...init }: ApiRequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData
  const response = await fetch(withQuery(path, query), {
    ...init,
    headers: {
      accept: "application/json",
      ...(body !== undefined && !isFormData ? { "content-type": "application/json" } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    credentials: "same-origin",
  })

  if (response.status === 204) return undefined as T

  let payload: ApiResponse<T> | undefined
  try {
    payload = (await response.json()) as ApiResponse<T>
  } catch {
    payload = undefined
  }

  if (!payload) throw new ApiError("Unexpected response from the server.", response.status, "INVALID_RESPONSE")
  if (!payload.success) throw new ApiError(payload.error, response.status, payload.code, payload.fieldErrors)
  return payload.data
}

export const api = {
  get: <T,>(path: string, query?: Query, init?: ApiRequestInit) =>
    apiFetch<T>(path, { ...init, query, method: "GET" }),
  post: <T,>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body }),
  put: <T,>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PUT", body }),
  patch: <T,>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T,>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
}
