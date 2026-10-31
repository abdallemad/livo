import { History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { auditActionLabel } from "@/constants/audit-actions"
import type { AuditEntryDto } from "@/types/admin"
import { formatDateTime } from "@/utils/format"

/** Audit trail for one entity (AD-11), newest first. */
export function HistoryCard({ entries }: { entries: AuditEntryDto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">History</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="size-4" aria-hidden />
            No admin actions yet.
          </p>
        ) : (
          <ol className="space-y-3">
            {entries.map((e) => (
              <li key={e.id} className="border-s-2 ps-3">
                <p className="text-sm font-medium">{auditActionLabel(e.action)}</p>
                <p className="text-xs text-muted-foreground">
                  {e.actor ?? "System"} · <span className="tabular-nums">{formatDateTime(e.createdAt)}</span>
                </p>
                {e.reason ? <p className="mt-1 text-sm text-muted-foreground">“{e.reason}”</p> : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
