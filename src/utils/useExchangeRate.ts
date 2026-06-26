import { getApiClient } from "@/api";
import { useEffect, useState, useRef } from "react";

const DEFAULT_RATE = 15000;

export function useExchangeRate() {
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
      // Keep existing rate on failure
    }
  };

  useEffect(() => {
    fetchRate();
    intervalRef.current = setInterval(fetchRate, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return rate;
}

export function convertPrice(usdPrice: number, rate: number): number {
  return Math.round(usdPrice * rate);
}
