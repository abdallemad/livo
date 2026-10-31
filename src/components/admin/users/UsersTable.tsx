"use client"

import Link from "next/link"
import { AlertCircle, Users } from "lucide-react"
import { OptionSelect } from "@/components/forms/OptionSelect"
import { ListPagination } from "@/components/admin/shared/ListPagination"
import { SearchBox } from "@/components/admin/shared/SearchBox"
import { EmptyState, PageHeader, UserStatusBadge } from "@/components/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ROLE_LABEL, USER_STATUS } from "@/constants/status"
import { useAdminUsers } from "@/hooks/use-admin-users"
import { useUrlQuery } from "@/hooks/use-url-query"
import { ADMIN_USER_ROLES, ADMIN_USER_STATUSES, userListQuerySchema } from "@/schemas/admin.schema"
import { formatDate } from "@/utils/format"
import { UserStatusActions } from "./UserStatusActions"

const ALL = "ALL"
const ROLE_OPTIONS = [{ id: ALL, name: "All roles" }, ...ADMIN_USER_ROLES.map((r) => ({ id: r, name: ROLE_LABEL[r] }))]
const STATUS_OPTIONS = [{ id: ALL, name: "All statuses" }, ...ADMIN_USER_STATUSES.map((s) => ({ id: s, name: USER_STATUS[s].label }))]
const COLUMNS = 7

/** `/admin/users` (AD-03): every account, searchable and filterable; suspend / activate inline. Filters live in the URL. */
export function UsersTable() {
  const { query, hrefWith, setQuery } = useUrlQuery(userListQuerySchema)
  const { data, isPending, isError, error, isFetching, refetch } = useAdminUsers(query)
  const filtered = !!(query.q || query.role || query.status)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Every customer, provider and admin account. Suspend or re-activate accounts."
        actions={isFetching && !isPending ? <Spinner className="text-muted-foreground" /> : null}
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchBox
              value={query.q}
              onSearch={(q) => setQuery({ q })}
              placeholder="Name, email, phone or id"
              label="Search users"
            />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <div className="sm:w-40 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-role"
                  value={query.role ?? ALL}
                  onChange={(v) => setQuery({ role: v === ALL ? undefined : v })}
                  options={ROLE_OPTIONS}
                  placeholder="Role"
                />
              </div>
              <div className="sm:w-40 [&_[data-slot=select-trigger]]:h-9 [&_[data-slot=select-trigger]]:text-sm">
                <OptionSelect
                  id="filter-status"
                  value={query.status ?? ALL}
                  onChange={(v) => setQuery({ status: v === ALL ? undefined : v })}
                  options={STATUS_OPTIONS}
                  placeholder="Status"
                />
              </div>
            </div>
            {filtered ? (
              <Button size="sm" variant="ghost" render={<Link href={hrefWith({ q: undefined, role: undefined, status: undefined })} />}>
                Clear filters
              </Button>
            ) : null}
          </div>

          {isError ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load users"
              description={error.message}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Sign-up</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={COLUMNS}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : data.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS} className="h-28 text-center text-muted-foreground">
                      <Users className="mx-auto mb-1 size-5" aria-hidden />
                      {filtered ? "No users match these filters." : "No users yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                          {u.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground">
                          <bdi dir="ltr">{u.email ?? u.phone ?? "No contact details"}</bdi>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "ADMIN" ? "primary" : "secondary"}>{ROLE_LABEL[u.role]}</Badge>
                      </TableCell>
                      <TableCell>{u.city ?? "—"}</TableCell>
                      <TableCell>
                        {u.onboardingCompleted ? (
                          <span className="text-sm">Complete</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unfinished</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">{formatDate(u.joinedAt)}</TableCell>
                      <TableCell>
                        <UserStatusBadge status={u.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1.5">
                          <UserStatusActions id={u.id} name={u.name} role={u.role} status={u.status} />
                          <Button size="sm" variant="ghost" render={<Link href={`/admin/users/${u.id}`} />}>
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {data && data.total > 0 ? (
            <ListPagination page={data.page} pageCount={data.pageCount} total={data.total} hrefFor={(page) => hrefWith({ page })} />
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
