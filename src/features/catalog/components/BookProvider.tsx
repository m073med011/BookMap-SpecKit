"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type BookContextValue = {
  activeBookId: string | null;
  setActiveBookId: (bookId: string | null) => void;
  setWarnings: (warnings: string[]) => void;
  warnings: string[];
};

const BookContext = createContext<BookContextValue | null>(null);

type BookProviderProps = {
  children: ReactNode;
  initialBookId?: string | null;
};

export function BookProvider({
  children,
  initialBookId = null,
}: BookProviderProps) {
  const [activeBookId, setActiveBookId] = useState<string | null>(initialBookId);
  const [warnings, setWarnings] = useState<string[]>([]);
  const value = useMemo<BookContextValue>(
    () => ({
      activeBookId,
      setActiveBookId,
      setWarnings,
      warnings,
    }),
    [activeBookId, warnings],
  );

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
}

export function useBookContext(): BookContextValue {
  const context = useContext(BookContext);

  if (!context) {
    throw new Error("useBookContext must be used within BookProvider.");
  }

  return context;
}
