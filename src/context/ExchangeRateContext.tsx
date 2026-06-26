import { getApiClient } from "@/api";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const DEFAULT_RATE = 15000;

interface ExchangeRateContextValue {
  rate: number;
  convert: (usdPrice: number) => number;
}

const ExchangeRateContext = createContext<ExchangeRateContextValue>({
  rate: DEFAULT_RATE,
  convert: (p) => Math.round(p * DEFAULT_RATE),
});

export function ExchangeRateProvider({ children }: { children: ReactNode }) {
  const [rate, setRate] = useState(DEFAULT_RATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRate = async () => {
    try {
      const client = getApiClient();
      const resp = await client.get("settings/exchange-rate");
      const newRate = resp.data?.data?.rate;
      if (typeof newRate === "number" && newRate > 0) {
        setRate(newRate);
      }
    } catch {
      // Keep existing rate
    }
  };

  useEffect(() => {
    fetchRate();
    intervalRef.current = setInterval(fetchRate, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const convert = (usdPrice: number) => Math.round(usdPrice * rate);

  return (
    <ExchangeRateContext.Provider value={{ rate, convert }}>
      {children}
    </ExchangeRateContext.Provider>
  );
}

export function useExchangeRate() {
  return useContext(ExchangeRateContext);
}
