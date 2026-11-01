"use client"

import Link from "next/link"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { AccountActionsCard } from "@/components/account/AccountActionsCard"
import { PersonalDetailsCard } from "@/components/account/PersonalDetailsCard"
import { CheckboxChips } from "@/components/forms/CheckboxChips"
import { FormField } from "@/components/forms/FormField"
import { MetaBadge, PageHeader } from "@/components/shared"
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
import { workSettingsSchema, type WorkSettingsInput, type WorkSettingsValues } from "@/schemas/provider-account.schema"
import type { ProviderSettings } from "@/types/provider-account"

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

function ProviderAccountCard({ status }: { status: ProviderSettings["verificationStatus"] }) {
  return (
    <AccountActionsCard>
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 py-2">
        <span className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-muted-foreground" aria-hidden />
          Verification <MetaBadge meta={PROVIDER_STATUS[status]} />
        </span>
        <Button variant="outline" render={<Link href="/provider/verification" />}>
          Open
        </Button>
      </div>
    </AccountActionsCard>
  )
}

/**
 * `/provider/settings` (AU-06; docs/provider-verification-settings-feature.md): personal details (name and
 * photo synced with Clerk), the work profile (same rules as onboarding step 3) and account actions.
 * Each card saves on its own and warns before leaving with unsaved changes. First snapshot from the server.
 */
export function ProviderSettingsForm({ initialData }: { initialData: ProviderSettings }) {
  const { data } = useProviderSettings(initialData)
  const savePersonal = useSavePersonalSettings()
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your profile, where you work, and your account." />
      <div className="grid gap-6 xl:grid-cols-2">
        <PersonalDetailsCard data={data.personal} save={savePersonal} description="Your name and photo appear on your public profile. Your phone and email never do." />
        <ProviderAccountCard status={data.verificationStatus} />
      </div>
      <WorkCard data={data.work} options={data.options} />
    </div>
  )
}
