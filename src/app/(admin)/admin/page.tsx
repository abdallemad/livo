import { EmptyState } from "@/components/shared"

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">لوحة التحكم</h1>
      <EmptyState title="لا توجد بيانات بعد" description="ستظهر المؤشرات هنا عند إضافة الميزات." />
    </div>
  )
}
