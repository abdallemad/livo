"use client"

import { useState } from "react"
import { ChevronDown, Info, MoreHorizontal, Pencil, Settings, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { OtpField } from "@/components/forms/OtpField"
import { PhoneField } from "@/components/forms/PhoneField"
import { ConfirmDialog, RatingInput, Stepper } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Demo } from "./Section"

const CATEGORIES = [
  { value: "plumbing", label: "سباكة" },
  { value: "electrical", label: "كهرباء" },
  { value: "cleaning", label: "تنظيف" },
  { value: "painting", label: "نقاشة وتشطيبات" },
]

export function LoadingButtonDemo() {
  const [loading, setLoading] = useState(false)
  return (
    <Button
      loading={loading}
      onClick={() => {
        setLoading(true)
        setTimeout(() => {
          setLoading(false)
          toast.success("تم الحفظ")
        }, 1500)
      }}
    >
      احفظ التغييرات
    </Button>
  )
}

export function FormDemos() {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState<string>()
  const [rating, setRating] = useState(0)
  const phoneError = phone.length > 0 && !/^01\d{9}$/.test(phone) ? "رقم الموبايل غير صحيح. اكتب 11 رقم يبدأ بـ 01." : undefined

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Demo title="حقل نصي — العنوان فوق، المساعدة تحت، الخطأ مكانها" className="flex-col items-stretch">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-name">الاسم</Label>
          <Input id="ds-name" placeholder="مثال: أحمد محمود" />
          <p className="text-sm text-muted-foreground">الاسم اللي هيظهر لمزود الخدمة.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-desc">وصف الشغلانة</Label>
          <Textarea id="ds-desc" placeholder="مثال: تسريب مية تحت حوض المطبخ من امبارح." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-disabled">حقل غير متاح</Label>
          <Input id="ds-disabled" disabled defaultValue="القاهرة" />
        </div>
      </Demo>

      <Demo title="رقم الموبايل (LTR، +20)" className="flex-col items-stretch">
        <PhoneField value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} error={phoneError} />
      </Demo>

      <Demo title="كود التحقق — 6 خانات، إرسال تلقائي" className="flex-col">
        <OtpField
          value={otp}
          onChange={(v) => {
            setOtp(v)
            setOtpError(undefined)
          }}
          onComplete={(v) => setOtpError(v === "123456" ? undefined : "الكود غلط. جرّب تاني أو اطلب كود جديد.")}
          resendAfter={30}
          error={otpError}
        />
        <p className="text-xs text-muted-foreground">
          جرّب <bdi dir="ltr">123456</bdi>
        </p>
      </Demo>

      <Demo title="اختيارات" className="flex-col items-stretch gap-5">
        <div className="flex flex-col gap-2">
          <Label>التصنيف</Label>
          <Select items={CATEGORIES} defaultValue="plumbing">
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <RadioGroup defaultValue="fixed" className="gap-3">
          <Label className="flex items-center gap-3 font-normal">
            <RadioGroupItem value="fixed" /> خدمة بسعر ثابت
          </Label>
          <Label className="flex items-center gap-3 font-normal">
            <RadioGroupItem value="quote" /> اطلب عرض سعر
          </Label>
        </RadioGroup>
        <Label className="flex items-center gap-3 font-normal">
          <Checkbox defaultChecked /> أوافق على شروط الاستخدام
        </Label>
        <Label className="flex items-center justify-between gap-3 font-normal">
          استقبل إشعارات الطلبات الجديدة
          <Switch defaultChecked />
        </Label>
      </Demo>

      <Demo title="إدخال التقييم" className="flex-col items-start">
        <RatingInput value={rating} onChange={setRating} />
      </Demo>

      <Demo title="معالج الخطوات (يمين ← شمال)" className="flex-col items-stretch">
        <Stepper steps={["الميعاد", "العنوان", "ملاحظات", "الدفع", "التأكيد"]} current={2} />
        <Progress value={60} aria-label="التقدم" />
      </Demo>
    </div>
  )
}

export function OverlayDemos() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Demo title="Dialog — تأكيد ونماذج قصيرة">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>عدّل العنوان</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>عدّل العنوان</DialogTitle>
              <DialogDescription>العنوان ده هيوصل لمزود الخدمة بعد تأكيد الحجز.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-address">العنوان</Label>
              <Input id="ds-address" defaultValue="مدينة نصر، شارع عباس العقاد" />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>تراجع</DialogClose>
              <DialogClose render={<Button />} onClick={() => toast.success("تم حفظ العنوان")}>
                احفظ العنوان
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Demo>

      <Demo title="ConfirmDialog — العواقب في العنوان">
        <ConfirmDialog
          trigger={<Button variant="destructive" />}
          title="إلغاء الحجز؟ هيرجع لك المبلغ المحجوز خلال 3 أيام"
          description="مزود الخدمة هيتبلغ بالإلغاء، ومش هتقدر ترجع الحجز تاني."
          confirmLabel="ألغِ الحجز"
          onConfirm={() => toast("تم إلغاء الحجز")}
        />
      </Demo>

      <Demo title="Sheet — قوائم وفلاتر الموبايل">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>الفلاتر</SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>الفلاتر</SheetTitle>
              <SheetDescription>بتفتح من بداية السطر (اليمين في العربي).</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>من تحت</SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>اختار الميعاد</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </Demo>

      <Demo title="Popover · Tooltip · Dropdown · Toast">
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            <Info data-icon="inline-start" aria-hidden />
            يعني إيه مبلغ محجوز؟
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>مبلغ محجوز</PopoverTitle>
              <PopoverDescription>بندفع لمزود الخدمة بعد ما تأكد إن الشغل خلص.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
        <Tooltip>
          <TooltipTrigger render={<Button size="icon" variant="ghost" aria-label="الإعدادات" />}>
            <Settings />
          </TooltipTrigger>
          <TooltipContent>الإعدادات</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            إجراءات
            <ChevronDown data-icon="inline-end" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>الخدمة</DropdownMenuLabel>
              <DropdownMenuItem>
                <Pencil aria-hidden /> عدّل الخدمة
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MoreHorizontal aria-hidden /> انسخ الرابط
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 aria-hidden /> احذف الخدمة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="secondary" onClick={() => toast.success("تم الحجز", { description: "هنبعت لك تفاصيل الميعاد في رسالة." })}>
          اعرض Toast
        </Button>
      </Demo>
    </div>
  )
}

export function NavigationDemos() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Demo title="Tabs" className="flex-col items-stretch">
        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">للعملاء</TabsTrigger>
            <TabsTrigger value="providers">لمزودي الخدمة</TabsTrigger>
          </TabsList>
          <TabsContent value="customers" className="pt-3 text-muted-foreground">
            اختار الخدمة، احجز الميعاد، وادفع بأمان.
          </TabsContent>
          <TabsContent value="providers" className="pt-3 text-muted-foreground">
            استقبل طلبات في منطقتك وقدّم عروض أسعار.
          </TabsContent>
        </Tabs>
      </Demo>
      <Demo title="Command — بحث سريع" className="items-stretch">
        <Command className="rounded-lg border">
          <CommandInput placeholder="ابحث عن خدمة…" />
          <CommandList>
            <CommandEmpty>ما لقيناش نتائج.</CommandEmpty>
            <CommandGroup heading="التصنيفات">
              {CATEGORIES.map((c) => (
                <CommandItem key={c.value}>{c.label}</CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </Demo>
      <Demo title="Calendar">
        <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-lg border" />
      </Demo>
    </div>
  )
}
