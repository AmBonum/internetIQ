import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ALL_ACCEPTED,
  ALL_REJECTED,
  type ConsentCategories,
  type ConsentRecord,
  hasConsent,
  loadConsent,
  saveConsent,
  type ConsentCategory,
} from "@/lib/consent";

interface ConsentContextValue {
  /** Persisted record, or `null` until the user makes a choice. */
  record: ConsentRecord | null;
  /** Was the consent loaded from storage already? false during SSR / first paint. */
  hydrated: boolean;
  /** True when the user has not yet decided — the banner should be visible. */
  needsDecision: boolean;
  /** True when the preferences dialog is open. */
  preferencesOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  saveCategories: (categories: ConsentCategories) => void;
  openPreferences: () => void;
  closePreferences: () => void;
  /** Quick check used by gated tracking helpers. */
  isAllowed: (category: ConsentCategory) => boolean;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  // Hydrate from localStorage on the client only — keeps SSR markup
  // deterministic so the banner does not flash on every navigation.
  useEffect(() => {
    setRecord(loadConsent());
    setHydrated(true);
  }, []);

  const persist = useCallback((categories: ConsentCategories) => {
    setRecord(saveConsent(categories));
  }, []);

  const acceptAll = useCallback(() => persist(ALL_ACCEPTED), [persist]);
  const rejectAll = useCallback(() => persist(ALL_REJECTED), [persist]);

  const saveCategories = useCallback(
    (categories: ConsentCategories) => {
      persist(categories);
      setPreferencesOpen(false);
    },
    [persist],
  );

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const isAllowed = useCallback(
    (category: ConsentCategory) => hasConsent(record, category),
    [record],
  );

  const value = useMemo<ConsentContextValue>(
    () => ({
      record,
      hydrated,
      needsDecision: hydrated && record === null,
      preferencesOpen,
      acceptAll,
      rejectAll,
      saveCategories,
      openPreferences,
      closePreferences,
      isAllowed,
    }),
    [
      record,
      hydrated,
      preferencesOpen,
      acceptAll,
      rejectAll,
      saveCategories,
      openPreferences,
      closePreferences,
      isAllowed,
    ],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent must be used inside a ConsentProvider");
  }
  return ctx;
}
