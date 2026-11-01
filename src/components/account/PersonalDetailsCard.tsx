"use client"

import { useRef, useState } from "react"
import { useUser } from "@clerk/nextjs"
import type { UseMutationResult } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Camera } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import { applyApiErrors } from "@/lib/form-errors"
import { compressImage } from "@/lib/image-compress"
import { personalSettingsSchema, type PersonalSettingsInput, type PersonalSettingsValues } from "@/schemas/provider-account.schema"
import type { PersonalDetailsDto } from "@/types/customer-account"
import { formatPhone } from "@/utils/format"

type SaveMutation = UseMutationResult<unknown, Error, PersonalSettingsValues>

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"

/**
 * Personal details for any signed-in user (AU-06): photo (uploaded straight to Clerk, then the SAVED details
 * are re-sent so the photo URL is copied into our DB), name, optional email; mobile and city read-only.
 * Used by `/provider/settings` and `/account/settings` — each passes its own save mutation.
 * docs/customer-account-feature.md, docs/provider-verification-settings-feature.md.
 */
export function PersonalDetailsCard({ data, save, description }: { data: PersonalDetailsDto; save: SaveMutation; description: string }) {
  const { user } = useUser()
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
          <CardDescription>{description}</CardDescription>
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

