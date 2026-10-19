import { STATUS_STYLES } from '../../lib/format';
import { BookingStatus } from '../../types';

export function StatusBadge({ status }: { status: BookingStatus }) {
  const style = STATUS_STYLES[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>{style.label}</span>;
}
