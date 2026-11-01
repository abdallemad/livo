/**
 * `AuditLog.action` → the sentence shown in admin history panels (AD-11).
 * Unknown actions fall back to the raw key, so a new action is never hidden.
 */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "provider.submit_for_review": "Submitted the application for review",
  "provider.approve": "Approved the provider",
  "provider.reject": "Rejected the application",
  "provider.suspend": "Suspended the provider",
  "provider.reinstate": "Reinstated the provider",
  "user.suspend": "Suspended the account",
  "user.activate": "Re-activated the account",
  "dispute.start_review": "Started reviewing the dispute",
  "category.create": "Created the category",
  "category.update": "Edited the category",
  "category.activate": "Activated the category",
  "category.deactivate": "Deactivated the category",
  "category.delete": "Deleted the category",
  "service.hide": "Hid the service",
  "service.restore": "Restored the service",
  "request.cancel": "Closed the request",
  "booking.cancel": "Cancelled the booking",
  "dispute.resolve": "Resolved the dispute",
  "review.hide": "Hid the review",
  "review.show": "Showed the review again",
}

export const auditActionLabel = (action: string) => AUDIT_ACTION_LABEL[action] ?? action
