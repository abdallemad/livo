/**
 * Services throw these; `toErrorResponse()` in `src/lib/api-route.ts` turns
 * them into an `ApiFailure` with the matching HTTP status. Anything that is
 * not an `AppError` is logged server-side and answered with a generic 500.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = new.target.name
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Please sign in to continue.") {
    super(message, "UNAUTHORIZED", 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource.") {
    super(message, "FORBIDDEN", 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(message, "NOT_FOUND", 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, "CONFLICT", 409, fieldErrors)
  }
}

export class ValidationError extends AppError {
  constructor(message = "Please check the highlighted fields.", fieldErrors?: Record<string, string[]>) {
    super(message, "VALIDATION", 422, fieldErrors)
  }
}

/** Delete guards: the row is still referenced by something else. */
export class DependencyError extends AppError {
  constructor(message: string) {
    super(message, "DEPENDENCY", 409)
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError
