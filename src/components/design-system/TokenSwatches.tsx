/** Every colour token from globals.css (docs/DESIGN-SYSTEM.md §2). */
const TOKENS: { name: string; bg: string; fg?: string; note: string }[] = [
  { name: "background", bg: "bg-background", fg: "text-foreground", note: "الصفحة" },
  { name: "foreground", bg: "bg-foreground", fg: "text-background", note: "النص" },
  { name: "card", bg: "bg-card", fg: "text-card-foreground", note: "الأسطح" },
  { name: "primary", bg: "bg-primary", fg: "text-primary-foreground", note: "الإجراء الأساسي" },
  { name: "secondary", bg: "bg-secondary", fg: "text-secondary-foreground", note: "إجراء ثانوي" },
  { name: "muted", bg: "bg-muted", fg: "text-muted-foreground", note: "نص ثانوي" },
  { name: "accent", bg: "bg-accent", fg: "text-accent-foreground", note: "hover / تحديد" },
  { name: "commit", bg: "bg-commit", fg: "text-commit-foreground", note: "لحظات الالتزام فقط" },
  { name: "destructive", bg: "bg-destructive", fg: "text-white", note: "حذف / إلغاء" },
  { name: "success", bg: "bg-success", fg: "text-white", note: "نجاح" },
  { name: "warning", bg: "bg-warning", fg: "text-white", note: "تنبيه" },
  { name: "info", bg: "bg-info", fg: "text-white", note: "معلومة" },
  { name: "border", bg: "bg-border", fg: "text-foreground", note: "الحدود" },
  { name: "ring", bg: "bg-ring", fg: "text-primary-foreground", note: "التركيز" },
]

const CHARTS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"]

export function TokenSwatches() {
  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
        {TOKENS.map((t) => (
          <li key={t.name} className="overflow-hidden rounded-lg border bg-card">
            <div className={`flex h-16 items-end p-2 ${t.bg} ${t.fg ?? ""}`}>
              <span className="text-xs font-medium">Aa نص</span>
            </div>
            <div className="p-2">
              <p className="font-mono text-xs" dir="ltr">
                {t.name}
              </p>
              <p className="text-xs text-muted-foreground">{t.note}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">الرسوم البيانية</span>
        {CHARTS.map((c, i) => (
          <span key={c} className={`flex size-8 items-center justify-center rounded-md text-xs font-semibold text-white ${c}`}>
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}
