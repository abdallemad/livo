"use client"

import { useState } from "react"
import { toast } from "sonner"
import { AccountActionsCard } from "@/components/account/AccountActionsCard"
import { PersonalDetailsCard } from "@/components/account/PersonalDetailsCard"
import { CheckboxChips } from "@/components/forms/CheckboxChips"
import { PageHeader } from "@/components/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { MAX_CUSTOMER_INTERESTS } from "@/constants/onboarding"
import { useCustomerSettings, useSaveCustomerPersonal, useSaveInterests } from "@/hooks/use-customer-account"
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes"
import type { CustomerSettings } from "@/types/customer-account"

function InterestsCard({ initial, options }: { initial: string[]; options: CustomerSettings["options"]["categories"] }) {
  const save = useSaveInterests()
  const [selected, setSelected] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const dirty = [...selected].sort().join() !== [...saved].sort().join()
  useUnsavedChanges(dirty)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">What you&apos;re interested in</CardTitle>
        <CardDescription>So we can suggest the right services. Optional.</CardDescription>
      </CardHeader>
      <CardContent>
        <CheckboxChips
          id="settings-interests"
          legend="Interests"
          options={options.map((c) => ({ id: c.id, label: c.name }))}
          value={selected}
          onChange={setSelected}
          max={MAX_CUSTOMER_INTERESTS}
        />
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          disabled={!dirty || save.isPending}
          onClick={() =>
            save.mutate(
              { categoryIds: selected },
              {
                onSuccess: () => {
                  setSaved(selected)
                  toast.success("Interests saved")
                },
                onError: (e) => toast.error(e.message),
              },
            )
          }
        >
          {save.isPending ? <Spinner data-icon="inline-start" /> : null}
          Save interests
        </Button>
      </CardFooter>
    </Card>
  )
}

/**
 * `/account/settings` (AU-06; docs/customer-account-feature.md): personal details (shared with provider
 * settings), interests (onboarding step 4) and account actions. Account deletion (AU-07) goes through
 * support for now. First snapshot from the server.
 */
export function CustomerSettingsForm({ initialData }: { initialData: CustomerSettings }) {
  const { data } = useCustomerSettings(initialData)
  const savePersonal = useSaveCustomerPersonal()
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your details and your account." />
      <div className="grid gap-6 xl:grid-cols-2">
        <PersonalDetailsCard data={data.personal} save={savePersonal} description="Providers see your name once a booking is confirmed. Your phone and email are never public." />
        <AccountActionsCard />
      </div>
      <InterestsCard initial={data.interestIds} options={data.options.categories} />
    </div>
  )
}
