"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Home, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { FormField } from "@/components/forms/FormField"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ConfirmDialog, EmptyState, PageHeader } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { useAddresses, useDeleteAddress, useSaveAddress, useSetDefaultAddress } from "@/hooks/use-customer-account"
import { applyApiErrors } from "@/lib/form-errors"
import { addressSchema, type AddressInput, type AddressValues } from "@/schemas/customer-account.schema"
import type { AddressDto, CustomerAddresses } from "@/types/customer-account"
import { ADDRESS_LABEL_MAX, ADDRESS_LABEL_SUGGESTIONS } from "@/utils/address-book"

const FIELDS = ["label", "areaId", "street", "details"] as const

function AddressDialog({ address, areas, city, isFirst, trigger }: { address: AddressDto | null; areas: CustomerAddresses["areas"]; city: string | null; isFirst: boolean; trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false)
  const save = useSaveAddress(address?.id ?? null)
  const defaults = (): AddressInput => ({ label: address?.label ?? "", areaId: address?.areaId ?? "", street: address?.street ?? "", details: address?.details ?? "", isDefault: address?.isDefault ?? isFirst })
  const form = useForm<AddressInput, unknown, AddressValues>({ resolver: zodResolver(addressSchema), defaultValues: defaults() })
  const { register, control, handleSubmit, setError, setValue, formState, reset } = form

  const submit = handleSubmit((values) =>
    save.mutate(values, {
      onSuccess: () => {
        toast.success(address ? "Address saved" : "Address added")
        setOpen(false)
      },
      onError: (e) => applyApiErrors(e, setError, FIELDS),
    }),
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset(defaults())
        setOpen(next)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={submit} noValidate className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{address ? "Edit address" : "Add an address"}</DialogTitle>
            <DialogDescription>{city ? `In ${city}. ` : ""}Providers see the full address only after they accept your booking.</DialogDescription>
          </DialogHeader>
          <FormField id="addr-label" label="Name" optional error={formState.errors.label?.message} helper={`e.g. Home or Work. Up to ${ADDRESS_LABEL_MAX} characters.`}>
            <div className="space-y-2">
              <Input id="addr-label" aria-invalid={!!formState.errors.label} aria-describedby="addr-label-msg" {...register("label")} />
              <div className="flex flex-wrap gap-1.5">
                {ADDRESS_LABEL_SUGGESTIONS.map((l) => (
                  <Button key={l} type="button" size="sm" variant="outline" onClick={() => setValue("label", l, { shouldDirty: true })}>
                    {l}
                  </Button>
                ))}
              </div>
            </div>
          </FormField>
          <FormField id="addr-area" label="Area" error={formState.errors.areaId?.message}>
            <Controller
              control={control}
              name="areaId"
              render={({ field }) => <OptionSelect id="addr-area" value={field.value ?? ""} onChange={field.onChange} options={areas} placeholder="Choose the area" invalid={!!formState.errors.areaId} />}
            />
          </FormField>
          <FormField id="addr-street" label="Street" error={formState.errors.street?.message}>
            <Input id="addr-street" autoComplete="street-address" aria-invalid={!!formState.errors.street} aria-describedby="addr-street-msg" {...register("street")} />
          </FormField>
          <FormField id="addr-details" label="Building, floor, flat, landmark" optional error={formState.errors.details?.message}>
            <Textarea id="addr-details" rows={2} aria-invalid={!!formState.errors.details} aria-describedby="addr-details-msg" {...register("details")} />
          </FormField>
          {!address?.isDefault && !isFirst ? (
            <Controller
              control={control}
              name="isDefault"
              render={({ field }) => (
                <Label className="flex min-h-11 items-center gap-3 font-normal">
                  <Checkbox checked={!!field.value} onCheckedChange={(v) => field.onChange(!!v)} />
                  Use this address by default
                </Label>
              )}
            />
          ) : null}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? <Spinner data-icon="inline-start" /> : null}
              {address ? "Save address" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * `/account/addresses` (CU-14; docs/customer-account-feature.md): saved addresses with one default (preselected
 * by booking and request forms), add / edit in a dialog, make default, delete. Up to 10. First snapshot from the server.
 */
export function AddressBook({ initialData }: { initialData: CustomerAddresses }) {
  const { data } = useAddresses(initialData)
  const remove = useDeleteAddress()
  const makeDefault = useSetDefaultAddress()
  const full = data.items.length >= data.max

  const addButton = (
    <AddressDialog
      address={null}
      areas={data.areas}
      city={data.city}
      isFirst={data.items.length === 0}
      trigger={
        <Button size="lg" disabled={full}>
          <Plus data-icon="inline-start" aria-hidden />
          Add an address
        </Button>
      }
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Addresses"
        description={full ? `You've saved the maximum of ${data.max} addresses. Delete one to add another.` : "Save the places you book for, so booking takes a tap."}
        actions={addButton}
      />
      {data.items.length === 0 ? (
        <EmptyState icon={MapPin} title="No saved addresses" description="Add your home or work address once and pick it when you book." action={addButton} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.items.map((a) => (
            <li key={a.id}>
              <Card className="h-full gap-3">
                <CardContent className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {a.label?.toLowerCase() === "home" ? <Home className="size-5" aria-hidden /> : <MapPin className="size-5" aria-hidden />}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      {a.label ?? "Address"}
                      {a.isDefault ? <Badge variant="info">Default</Badge> : null}
                    </p>
                    <p className="text-sm">{a.line}</p>
                    <p className="text-sm text-muted-foreground">{a.city}</p>
                  </div>
                </CardContent>
                <CardFooter className="mt-auto flex flex-wrap gap-1 border-t pt-3">
                  {!a.isDefault ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={makeDefault.isPending}
                      onClick={() => makeDefault.mutate(a.id, { onSuccess: () => toast.success("Default address changed"), onError: (e) => toast.error(e.message) })}
                    >
                      <Star data-icon="inline-start" aria-hidden />
                      Make default
                    </Button>
                  ) : null}
                  <div className="ms-auto flex gap-1">
                    <AddressDialog
                      address={a}
                      areas={data.areas}
                      city={data.city}
                      isFirst={false}
                      trigger={
                        <Button size="sm" variant="outline">
                          <Pencil data-icon="inline-start" aria-hidden />
                          Edit
                        </Button>
                      }
                    />
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="ghost" className="text-destructive" aria-label={`Delete ${a.label ?? "address"}`} disabled={remove.isPending}>
                          <Trash2 aria-hidden />
                        </Button>
                      }
                      title={`Delete “${a.label ?? a.line}”?`}
                      description={a.isDefault && data.items.length > 1 ? "Your newest other address becomes the default. Past bookings keep their address." : "Past bookings keep their address."}
                      confirmLabel="Delete address"
                      cancelLabel="Keep it"
                      onConfirm={() => remove.mutate(a.id, { onSuccess: () => toast.success("Address deleted"), onError: (e) => toast.error(e.message) })}
                    />
                  </div>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
