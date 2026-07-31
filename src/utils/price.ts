import { useExchangeRate } from "@/context/ExchangeRateContext";

export function toSYP(price: number, currency: string | undefined | null, rate: number): number {
  if (currency === "usd" || currency == null) return Math.round(price * rate);
  return price;
}

export function formatSYP(price: number | undefined | null, currency: string | undefined | null, rate: number): string {
  return `${toSYP(price ?? 0, currency, rate).toLocaleString()} SYP`;
}

export function usePrice() {
  const { rate } = useExchangeRate();
  return {
    rate,
    toSYP: (price: number, currency?: string | null) => toSYP(price, currency, rate),
    formatSYP: (price?: number | null, currency?: string | null) => formatSYP(price, currency, rate),
  };
}
