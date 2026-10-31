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
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "cleaning", label: "Cleaning" },
  { value: "painting", label: "Painting and finishing" },
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
          toast.success("Saved")
        }, 1500)
      }}
    >
      Save changes
    </Button>
  )
}

export function FormDemos() {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [otpError, setOtpError] = useState<string>()
  const [rating, setRating] = useState(0)
  const phoneError = phone.length > 0 && !/^01\d{9}$/.test(phone) ? "Invalid mobile number. Enter 11 digits starting with 01." : undefined

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Demo title="Text field — Label on top, help below, error in its place" className="flex-col items-stretch">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-name">Name</Label>
          <Input id="ds-name" placeholder="e.g. Ahmed Mahmoud" />
          <p className="text-sm text-muted-foreground">The name the provider will see.</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-desc">Job description</Label>
          <Textarea id="ds-desc" placeholder="e.g. Water leaking under the kitchen sink since yesterday." />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ds-disabled">Disabled field</Label>
          <Input id="ds-disabled" disabled defaultValue="Cairo" />
        </div>
      </Demo>

      <Demo title="Mobile number (+20)" className="flex-col items-stretch">
        <PhoneField value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} error={phoneError} />
      </Demo>

      <Demo title="Verification code — 6 Boxes, auto-submit" className="flex-col">
        <OtpField
          value={otp}
          onChange={(v) => {
            setOtp(v)
            setOtpError(undefined)
          }}
          onComplete={(v) => setOtpError(v === "123456" ? undefined : "Wrong code. Try again or request a new code.")}
          resendAfter={30}
          error={otpError}
        />
        <p className="text-xs text-muted-foreground">
          Try <bdi dir="ltr">123456</bdi>
        </p>
      </Demo>

      <Demo title="Choices" className="flex-col items-stretch gap-5">
        <div className="flex flex-col gap-2">
          <Label>Category</Label>
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
            <RadioGroupItem value="fixed" /> Fixed-price service
          </Label>
          <Label className="flex items-center gap-3 font-normal">
            <RadioGroupItem value="quote" /> Request a quote
          </Label>
        </RadioGroup>
        <Label className="flex items-center gap-3 font-normal">
          <Checkbox defaultChecked /> I agree to the terms of use
        </Label>
        <Label className="flex items-center justify-between gap-3 font-normal">
          Get notified about new requests
          <Switch defaultChecked />
        </Label>
      </Demo>

      <Demo title="Rating input" className="flex-col items-start">
        <RatingInput value={rating} onChange={setRating} />
      </Demo>

      <Demo title="Step wizard (left → right)" className="flex-col items-stretch">
        <Stepper steps={["Date & time", "Address", "Notes", "Payment", "Confirm"]} current={2} />
        <Progress value={60} aria-label="Progress" />
      </Demo>
    </div>
  )
}

export function OverlayDemos() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Demo title="Dialog — Confirmations and short forms">
        <Dialog>
          <DialogTrigger render={<Button variant="outline" />}>Edit address</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit address</DialogTitle>
              <DialogDescription>The provider will get this address after the booking is confirmed.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ds-address">Address</Label>
              <Input id="ds-address" defaultValue="Nasr City, Abbas El Akkad St." />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Undo</DialogClose>
              <DialogClose render={<Button />} onClick={() => toast.success("Address saved")}>
                Save address
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Demo>

      <Demo title="ConfirmDialog — Consequences in the title">
        <ConfirmDialog
          trigger={<Button variant="destructive" />}
          title="Cancel the booking? The held amount will be refunded within 3 days"
          description="The provider will be notified of the cancellation, and you won't be able to restore the booking."
          confirmLabel="Cancel booking"
          onConfirm={() => toast("Booking cancelled")}
        />
      </Demo>

      <Demo title="Sheet — Mobile menus and filters">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>Filters</SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Opens from the start of the line (the left in English).</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>From the bottom</SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Choose a time</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </Demo>

      <Demo title="Popover · Tooltip · Dropdown · Toast">
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>
            <Info data-icon="inline-start" aria-hidden />
            What is a held payment?
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Held payment</PopoverTitle>
              <PopoverDescription>We pay the provider after you confirm the job is done.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
        <Tooltip>
          <TooltipTrigger render={<Button size="icon" variant="ghost" aria-label="Settings" />}>
            <Settings />
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Actions
            <ChevronDown data-icon="inline-end" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Service</DropdownMenuLabel>
              <DropdownMenuItem>
                <Pencil aria-hidden /> Edit service
              </DropdownMenuItem>
              <DropdownMenuItem>
                <MoreHorizontal aria-hidden /> Copy link
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 aria-hidden /> Delete service
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="secondary" onClick={() => toast.success("Booked", { description: "We'll send you the appointment details in a message." })}>
          Show Toast
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
            <TabsTrigger value="customers">For customers</TabsTrigger>
            <TabsTrigger value="providers">For providers</TabsTrigger>
          </TabsList>
          <TabsContent value="customers" className="pt-3 text-muted-foreground">
            Choose a service, book a time, and pay safely.
          </TabsContent>
          <TabsContent value="providers" className="pt-3 text-muted-foreground">
            Get requests in your area and send quotes.
          </TabsContent>
        </Tabs>
      </Demo>
      <Demo title="Command — Quick search" className="items-stretch">
        <Command className="rounded-lg border">
          <CommandInput placeholder="Search for a service…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Categories">
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
