/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  persistLocale,
  readBrowserLocale,
  readPersistedLocale,
} from "../services/LocalePreferenceService";

export type Language = "en" | "ja";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  setTemporaryLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    (() => {
      try {
        return readPersistedLocale(window.localStorage) ?? readBrowserLocale() ?? "en";
      } catch {
        return readBrowserLocale() ?? "en";
      }
    })(),
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => {
        persistLocale(window.localStorage, nextLanguage);
        setLanguage(nextLanguage);
      },
      setTemporaryLanguage: (nextLanguage: Language) => {
        setLanguage(nextLanguage);
      },
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
