import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { CMSContent, TeamMember, HistoryMilestone, ServiceCategory, JobVacancy } from "../types";

/**
 * CMSContext — lädt/speichert serverseitig über die session-gegateten API-Endpunkte
 * (/api/cms/load, /api/cms/save). KEIN Google-Token im Browser, kein localStorage,
 * kein „Sheet verbinden". Schnittstelle bleibt kompatibel zum bestehenden AdminDashboard
 * (das alte Login-/Sheet-UI wird durch das SSR-Gate nie gerendert; Cleanup in M6).
 */
export interface CMSContextType {
  allgemeines: Record<string, string>;
  team: TeamMember[];
  historie: HistoryMilestone[];
  dienstleistungen: ServiceCategory[];
  jobs: JobVacancy[];
  isLoadingCMS: boolean;
  isCMSEnabled: boolean;
  spreadsheetId: string | null;
  saveSpreadsheetId: (id: string | null) => void;
  cmsError: string | null;
  refreshCMS: () => Promise<void>;
  saveCMS: (newContent: CMSContent) => Promise<void>;
  user: any | null;
  token: string | null;
  loginUser: (user: any, token: string) => void;
  logoutUser: () => void;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export function CMSProvider({ children, userEmail }: { children: React.ReactNode; userEmail?: string }) {
  const [content, setContent] = useState<CMSContent | null>(null);
  const [isLoadingCMS, setIsLoadingCMS] = useState<boolean>(true);
  const [cmsError, setCmsError] = useState<string | null>(null);

  const refreshCMS = useCallback(async () => {
    setIsLoadingCMS(true);
    setCmsError(null);
    try {
      const res = await fetch("/api/cms/load", { credentials: "same-origin" });
      if (!res.ok) {
        throw new Error(res.status === 401
          ? "Sitzung abgelaufen — bitte neu anmelden."
          : `Inhalte konnten nicht geladen werden (${res.status}).`);
      }
      const data = await res.json();
      setContent(data.content);
    } catch (err: any) {
      console.error("Fehler beim Laden der CMS-Daten:", err);
      setCmsError(err?.message || "Inhalte konnten nicht geladen werden.");
    } finally {
      setIsLoadingCMS(false);
    }
  }, []);

  useEffect(() => { refreshCMS(); }, [refreshCMS]);

  const saveCMS = useCallback(async (newContent: CMSContent) => {
    setIsLoadingCMS(true);
    setCmsError(null);
    try {
      const res = await fetch("/api/cms/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 422 && Array.isArray(data?.errors) && data.errors.length) {
          throw new Error("Limit überschritten — " + data.errors.map((e: any) => e.message).join(" "));
        }
        throw new Error(data?.error || `Speichern fehlgeschlagen (${res.status}).`);
      }
      // Lokal übernehmen; dank SSR ist die Änderung sofort live auf der Seite.
      setContent(newContent);
    } catch (err: any) {
      console.error("Fehler beim Speichern:", err);
      setCmsError(err?.message || "Speichern fehlgeschlagen.");
      throw err;
    } finally {
      setIsLoadingCMS(false);
    }
  }, []);

  const logoutUser = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
      .catch(() => {})
      .finally(() => window.location.reload());
  }, []);

  const value: CMSContextType = {
    // Bis geladen ist `allgemeines` undefined → AdminDashboard wartet mit dem Draft.
    allgemeines: (content?.allgemeines as any),
    team: content?.team ?? [],
    historie: content?.historie ?? [],
    dienstleistungen: content?.dienstleistungen ?? [],
    jobs: content?.jobs ?? [],
    isLoadingCMS,
    isCMSEnabled: true,
    spreadsheetId: "server",
    saveSpreadsheetId: () => {},
    cmsError,
    refreshCMS,
    saveCMS,
    user: { email: userEmail || "" },
    token: null,
    loginUser: () => {},
    logoutUser,
  };

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMS must be used within a CMSProvider component.");
  }
  return context;
}
