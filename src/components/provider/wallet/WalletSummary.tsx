import { AlertTriangle, Banknote, Lock, Percent, Wallet } from "lucide-react"
import { StatCard } from "@/components/shared"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { WalletSummaryDto } from "@/types/provider-wallet"
import { formatNumber, formatPrice } from "@/utils/format"

/**
 * Due / collected / commission (PR-11, DESIGN-SYSTEM §8 `WalletSummary`) — presentational, used by
 * `/provider/earnings` and `/provider/payouts`. docs/provider-earnings-payouts-feature.md.
 */
export function WalletSummary({ s }: { s: WalletSummaryDto }) {
  return (
    <div className="space-y-4">
      {s.balance < 0 ? (
        <Alert variant="warning">
          <AlertTriangle aria-hidden />
          <AlertTitle>You owe Livo {formatPrice(-s.balance)} in commission</AlertTitle>
          <AlertDescription>From jobs the customer paid in cash. It&apos;s taken from your next online earnings, before you can withdraw.</AlertDescription>
        </Alert>
      ) : null}
      <section aria-label="Your wallet" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Available to withdraw"
          value={formatPrice(s.available)}
          icon={Wallet}
          hint={s.openPayouts ? `${formatPrice(s.openPayouts)} already requested` : `Wallet balance ${formatPrice(s.balance)}`}
          className="border-primary/30"
        />
        <StatCard
          label="On hold"
          value={formatPrice(s.onHold)}
          icon={Lock}
          hint={s.onHoldBookings ? `${formatNumber(s.onHoldBookings)} ${s.onHoldBookings === 1 ? "job" : "jobs"} waiting for the customer to confirm` : "Nothing waiting for confirmation"}
        />
        <StatCard
          label="Received"
          value={formatPrice(s.paidOut + s.cashCollected)}
          icon={Banknote}
          hint={`${formatPrice(s.paidOut)} paid out · ${formatPrice(s.cashCollected)} cash from customers`}
        />
        <StatCard label="Commission deducted" value={formatPrice(s.commission)} icon={Percent} hint="Livo's share of your completed jobs" />
      </section>
    </div>
  )
}
