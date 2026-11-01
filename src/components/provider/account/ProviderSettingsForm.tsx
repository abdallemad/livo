"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useClerk, useUser } from "@clerk/nextjs"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera, KeyRound, LogOut, ShieldCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { CheckboxChips } from "@/components/forms/CheckboxChips"
import { FormField } from "@/components/forms/FormField"
import { MetaBadge, PageHeader } from "@/components/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { PROVIDER_BIO_MAX, PROVIDER_MAX_AREAS, PROVIDER_MAX_CATEGORIES } from "@/constants/onboarding"
import { PROVIDER_STATUS } from "@/constants/status"
import { useProviderSettings, useSavePersonalSettings, useSaveWorkSettings } from "@/hooks/use-provider-account"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { applyApiErrors } from "@/lib/form-errors"
import { compressImage } from "@/lib/image-compress"
import {
  personalSettingsSchema,
  workSettingsSchema,
  type PersonalSettingsInput,
  type PersonalSettingsValues,
  type WorkSettingsInput,
  type WorkSettingsValues,
} from "@/schemas/provider-account.schema"
import type { ProviderSettings } from "@/types/provider-account"
import { formatPhone } from "@/utils/format"

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"

function PersonalCard({ data }: { data: ProviderSettings["personal"] }) {
  const { user } = useUser()
  const save = useSavePersonalSettings()
  const fileInput = useRef<HTMLInputElement>(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const form = useForm<PersonalSettingsInput, unknown, PersonalSettingsValues>({
    resolver: zodResolver(personalSettingsSchema),
    defaultValues: { name: data.name, email: data.email ?? "" },
  })
  const { register, handleSubmit, setError, formState, reset, getValues } = form
  useUnsavedChanges(formState.isDirty)

  const submit = handleSubmit((values) =>
    save.mutate(values, {
      onSuccess: () => {
        reset(getValues())
        toast.success("Personal details saved")
      },
      onError: (e) => applyApiErrors(e, setError, ["name", "email"]),
    }),
  )

  // The photo goes straight to Clerk (as in onboarding); saving the details then copies its URL into our DB.
  const changePhoto = async (file: File | undefined) => {
    if (!file || !user) return
    setPhotoBusy(true)
    try {
      await user.setProfileImage({ file: await compressImage(file, 512) })
    } catch {
      toast.error("The photo wasn't uploaded. Try a different one.")
      setPhotoBusy(false)
      return
    }
    try {
      // Copy the new photo URL into our DB using the SAVED details — unsaved edits stay unsaved until "Save details".
      await save.mutateAsync(personalSettingsSchema.parse({ name: data.name, email: data.email ?? "" }))
      toast.success("Photo updated")
    } catch {
      toast.success("Photo updated. It may take a moment to show everywhere.")
    } finally {
      setPhotoBusy(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <CardHeader>
          <CardTitle className="text-lg">Personal details</CardTitle>
          <CardDescription>Your name and photo appear on your public profile. Your phone and email never do.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {user?.hasImage ? <AvatarImage src={user.imageUrl} alt="" /> : data.avatarUrl ? <AvatarImage src={data.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-lg">{initials(data.name)}</AvatarFallback>
            </Avatar>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="settings-photo" onChange={(e) => void changePhoto(e.target.files?.[0])} />
            <Button type="button" variant="outline" disabled={photoBusy || !user} onClick={() => fileInput.current?.click()}>
              {photoBusy ? <Spinner data-icon="inline-start" /> : <Camera data-icon="inline-start" aria-hidden />}
              Change photo
            </Button>
          </div>
          <FormField id="settings-name" label="Full name" error={formState.errors.name?.message} helper="Letters only, the way customers should see it.">
            <Input id="settings-name" autoComplete="name" aria-invalid={!!formState.errors.name} aria-describedby="settings-name-msg" {...register("name")} />
          </FormField>
          <FormField id="settings-email" label="Email" optional error={formState.errors.email?.message} helper="For receipts and important updates.">
            <Input id="settings-email" type="email" dir="ltr" className="text-start" autoComplete="email" aria-invalid={!!formState.errors.email} aria-describedby="settings-email-msg" {...register("email")} />
          </FormField>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Mobile number (sign-in)</dt>
              <dd className="font-medium">{data.phone ? <bdi dir="ltr">{formatPhone(data.phone)}</bdi> : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">City</dt>
              <dd className="font-medium">{data.city ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={save.isPending || !formState.isDirty}>
            {save.isPending && !photoBusy ? <Spinner data-icon="inline-start" /> : null}
            Save details
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function WorkCard({ data, options }: { data: ProviderSettings["work"]; options: ProviderSettings["options"] }) {
  const save = useSaveWorkSettings()
  const form = useForm<WorkSettingsInput, unknown, WorkSettingsValues>({
    resolver: zodResolver(workSettingsSchema),
    defaultValues: { bio: data.bio, yearsExperience: data.yearsExperience ?? "", categoryIds: data.categoryIds, areaIds: data.areaIds },
  })
  const { register, control, handleSubmit, setError, formState, reset, getValues } = form
  useUnsavedChanges(formState.isDirty)

  const submit = handleSubmit((values) =>
    save.mutate(values, {
      onSuccess: () => {
        reset(getValues())
        toast.success("Work profile saved")
      },
      onError: (e) => applyApiErrors(e, setError, ["bio", "yearsExperience", "categoryIds", "areaIds"]),
    }),
  )

  return (
    <Card>
      <form onSubmit={submit} noValidate>
        <CardHeader>
          <CardTitle className="text-lg">Work profile</CardTitle>
          <CardDescription>What you do and where. Your specialties and areas decide which requests you see.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <FormField id="settings-bio" label="About your work" error={formState.errors.bio?.message} helper="Experience, the jobs you're best at, how you work.">
            <Textarea id="settings-bio" rows={4} maxLength={PROVIDER_BIO_MAX} aria-invalid={!!formState.errors.bio} aria-describedby="settings-bio-msg" {...register("bio")} />
          </FormField>
          <FormField id="settings-years" label="Years of experience" error={formState.errors.yearsExperience?.message}>
            <Input id="settings-years" type="number" inputMode="numeric" dir="ltr" className="max-w-32 text-start tabular-nums" aria-invalid={!!formState.errors.yearsExperience} aria-describedby="settings-years-msg" {...register("yearsExperience")} />
          </FormField>
          <FormField id="settings-categories" label="Specialties" error={formState.errors.categoryIds?.message} helper={`Up to ${PROVIDER_MAX_CATEGORIES}.`}>
            <Controller
              control={control}
              name="categoryIds"
              render={({ field }) => (
                <CheckboxChips
                  id="settings-categories"
                  legend="Specialties"
                  options={options.categories.map((c) => ({ id: c.id, label: c.name, hint: c.group }))}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  max={PROVIDER_MAX_CATEGORIES}
                  invalid={!!formState.errors.categoryIds}
                />
              )}
            />
          </FormField>
          <FormField id="settings-areas" label="Areas you work in" error={formState.errors.areaIds?.message} helper={`Up to ${PROVIDER_MAX_AREAS}, in your city.`}>
            <Controller
              control={control}
              name="areaIds"
              render={({ field }) => (
                <CheckboxChips
                  id="settings-areas"
                  legend="Areas"
                  options={options.areas.map((a) => ({ id: a.id, label: a.name }))}
                  value={field.value ?? []}
                  onChange={field.onChange}
                  max={PROVIDER_MAX_AREAS}
                  invalid={!!formState.errors.areaIds}
                />
              )}
            />
          </FormField>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={save.isPending || !formState.isDirty}>
            {save.isPending ? <Spinner data-icon="inline-start" /> : null}
            Save work profile
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function AccountCard({ status }: { status: ProviderSettings["verificationStatus"] }) {
  const { openUserProfile, signOut } = useClerk()
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Account</CardTitle>
      </CardHeader>
      <CardContent className="divide-y">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-muted-foreground" aria-hidden />
            Verification <MetaBadge meta={PROVIDER_STATUS[status]} />
          </span>
          <Button variant="outline" render={<Link href="/provider/verification" />}>
            Open
          </Button>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2">
            <KeyRound className="size-5 text-muted-foreground" aria-hidden />
            Sign-in and security (mobile number, sessions)
          </span>
          <Button variant="outline" onClick={() => openUserProfile()}>
            Manage
          </Button>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2">
            <LogOut className="size-5 text-muted-foreground" aria-hidden />
            Sign out on this device
          </span>
          <Button variant="outline" onClick={() => void signOut({ redirectUrl: "/" })}>
            Sign out
          </Button>
        </div>
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
          <span className="flex items-center gap-2">
            <Trash2 className="size-5 text-muted-foreground" aria-hidden />
            Delete your account
          </span>
          <Button variant="ghost" render={<Link href="/contact" />}>
            Contact support
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * `/provider/settings` (AU-06; docs/provider-verification-settings-feature.md): personal details (name and
 * photo synced with Clerk), the work profile (same rules as onboarding step 3) and account actions.
 * Each card saves on its own and warns before leaving with unsaved changes. First snapshot from the server.
 */
export function ProviderSettingsForm({ initialData }: { initialData: ProviderSettings }) {
  const { data } = useProviderSettings(initialData)
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile, where you work, and your account." />
      <div className="grid gap-6 xl:grid-cols-2">
        <PersonalCard data={data.personal} />
        <AccountCard status={data.verificationStatus} />
      </div>
      <WorkCard data={data.work} options={data.options} />
    </div>
  )
}
