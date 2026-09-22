import React, { createContext, useContext, useState } from 'react';
import { currentMonthRange } from '@/lib/utils';

interface DateRangeValue {
  start: string; // YYYY-MM-DD (local)
  end: string;
  setRange: (start: string, end: string) => void;
}

const DateRangeContext = createContext<DateRangeValue | null>(null);

/** Global period picked in the header; dashboard, transactions and statistics follow it. */
export const DateRangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [range, setRangeState] = useState(currentMonthRange);
  const setRange = (start: string, end: string) => setRangeState({ start, end });
  return <DateRangeContext.Provider value={{ ...range, setRange }}>{children}</DateRangeContext.Provider>;
};

export function useDateRange(): DateRangeValue {
  const ctx = useContext(DateRangeContext);
  if (!ctx) throw new Error('useDateRange must be used inside DateRangeProvider');
  return ctx;
}
