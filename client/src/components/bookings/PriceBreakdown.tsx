import { useMoney } from '../../hooks/useMoney';
import { PriceBreakdown as Price } from '../../types';

export function PriceBreakdown({ price, pricePerDay }: { price: Price; pricePerDay?: number }) {
  const { money, isEstimate, currency } = useMoney();

  return (
    <div className="space-y-2 text-sm">
      <Row label={pricePerDay ? `${money(pricePerDay)} x ${price.nights} night${price.nights > 1 ? 's' : ''}` : `${price.nights} night${price.nights > 1 ? 's' : ''}`} value={money(price.baseTotal)} />
      {price.weekendSurcharge > 0 && <Row label="Weekend nights (Fri, Sat)" value={`+ ${money(price.weekendSurcharge)}`} />}
      {price.discount > 0 && <Row label="Long-stay discount" value={`- ${money(price.discount)}`} green />}
      <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-bold">
        <span>Total</span>
        <span>{money(price.total)}</span>
      </div>
      {isEstimate && (
        <p className="text-xs text-slate-500">
          Estimate in {currency}. You are charged {new Intl.NumberFormat('en-US').format(price.total)} {price.currency}.
        </p>
      )}
    </div>
  );
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${green ? 'text-emerald-700' : 'text-slate-600'}`}>
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
