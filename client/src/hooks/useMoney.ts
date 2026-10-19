import { useQuery } from '@tanstack/react-query';
import { currencyApi } from '../api/endpoints';
import { formatMoney } from '../lib/format';
import { useAppSelector } from '../store';

// Returns a function that shows a PKR amount in the visitor's chosen currency.
export function useMoney() {
  const currency = useAppSelector((s) => s.ui.currency);
  const { data } = useQuery({
    queryKey: ['rates'],
    queryFn: currencyApi.rates,
    staleTime: 60 * 60 * 1000,
    enabled: currency !== 'PKR',
  });
  return {
    currency,
    isEstimate: currency !== 'PKR',
    money: (amountInPkr: number) => formatMoney(amountInPkr, currency, data?.rates),
  };
}
