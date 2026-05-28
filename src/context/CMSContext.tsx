import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
  fetchCMS_Data, 
  writeCMS_Data,
  CMSContent, 
  DEFAULT_ALLGEMEIN,
  initAuth 
} from "../lib/googleSheets";
import { 
  TEAM_MEMBERS as DEFAULT_TEAM, 
  HISTORY_MILESTONES as DEFAULT_HISTORY, 
  SERVICE_CATEGORIES as DEFAULT_SERVICES, 
  JOB_VACANCIES as DEFAULT_JOBS 
} from "../data";
import { TeamMember, HistoryMilestone, ServiceCategory, JobVacancy } from "../types";

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

export function CMSProvider({ children }: { children: React.ReactNode }) {
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [isLoadingCMS, setIsLoadingCMS] = useState<boolean>(false);
  const [cmsError, setCmsError] = useState<string | null>(null);

  // Auth local cache
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // CMS Content State initialized with default fallbacks or local cache
  const [content, setContent] = useState<CMSContent>(() => {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("john_haustechnik_cms_public_cache");
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (e) {
      console.error("Fehler beim Laden des lokalen CMS-Caches:", e);
    }
    return {
      allgemeines: DEFAULT_ALLGEMEIN,
      team: DEFAULT_TEAM,
      historie: DEFAULT_HISTORY,
      dienstleistungen: DEFAULT_SERVICES,
      jobs: DEFAULT_JOBS
    };
  });

  // Save/disconnect Spreadsheet ID
  const saveSpreadsheetId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem("john_haustechnik_cms_sheet_id", id);
    } else {
      localStorage.removeItem("john_haustechnik_cms_sheet_id");
    }
    setSpreadsheetId(id);
    setCmsError(null);
  }, []);

  // Fetch dynamic spreadsheet data
  const refreshCMS = useCallback(async () => {
    const currentId = localStorage.getItem("john_haustechnik_cms_sheet_id");
    if (!currentId || !token) {
      // No sheet connected or no access token -> Reset back to default static copies gracefully
      setContent({
        allgemeines: DEFAULT_ALLGEMEIN,
        team: DEFAULT_TEAM,
        historie: DEFAULT_HISTORY,
        dienstleistungen: DEFAULT_SERVICES,
        jobs: DEFAULT_JOBS
      });
      localStorage.removeItem("john_haustechnik_cms_public_cache");
      return;
    }

    setIsLoadingCMS(true);
    setCmsError(null);

    try {
      const cmsData = await fetchCMS_Data(token, currentId);
      setContent(cmsData);
      localStorage.setItem("john_haustechnik_cms_public_cache", JSON.stringify(cmsData));
    } catch (err: any) {
      console.error("Fehler beim Laden der CMS Daten:", err);
      setCmsError("Die CMS-Inhalte konnten nicht per Google Sheets geladen werden. Bitte prüfen Sie die Online-Verbindung oder Ihr Sicherheitstoken.");
    } finally {
      setIsLoadingCMS(false);
    }
  }, [token]);

  // Handle Login State
  const loginUser = useCallback((currentUser: any, currentToken: string) => {
    setUser(currentUser);
    setToken(currentToken);
  }, []);

  const logoutUser = useCallback(() => {
    setUser(null);
    setToken(null);
    setSpreadsheetId(null);
    localStorage.removeItem("john_haustechnik_cms_sheet_id");
    localStorage.removeItem("john_haustechnik_cms_public_cache");
    setContent({
      allgemeines: DEFAULT_ALLGEMEIN,
      team: DEFAULT_TEAM,
      historie: DEFAULT_HISTORY,
      dienstleistungen: DEFAULT_SERVICES,
      jobs: DEFAULT_JOBS
    });
  }, []);

  // Initial read of spreadsheetId and setup auth subscription
  useEffect(() => {
    const storedId = localStorage.getItem("john_haustechnik_cms_sheet_id");
    if (storedId) {
      setSpreadsheetId(storedId);
    }

    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  // Whenever token or spreadsheetId changes, pull the latest data from the sheet
  useEffect(() => {
    if (token && spreadsheetId) {
      refreshCMS();
    }
  }, [token, spreadsheetId, refreshCMS]);

  const saveCMS = useCallback(async (newContent: CMSContent) => {
    // 1. Immediately update local state so changes can be seen in real-time
    setContent(newContent);
    localStorage.setItem("john_haustechnik_cms_public_cache", JSON.stringify(newContent));

    // 2. Transmit to Google Sheet if connected
    const currentId = localStorage.getItem("john_haustechnik_cms_sheet_id");
    if (currentId && token) {
      setIsLoadingCMS(true);
      setCmsError(null);
      try {
        await writeCMS_Data(token, currentId, newContent);
      } catch (err: any) {
        console.error("Fehler beim Online-Speichern über Google Sheets:", err);
        setCmsError("Die CMS-Einträge wurden lokal auf der Seite aktualisiert, konnten aber nicht live in Ihr Google Sheet übertragen werden. Möglicherweise wurde die Verbindung getrennt.");
        throw err;
      } finally {
        setIsLoadingCMS(false);
      }
    }
  }, [token]);

  const value: CMSContextType = {
    allgemeines: content.allgemeines,
    team: content.team,
    historie: content.historie,
    dienstleistungen: content.dienstleistungen,
    jobs: content.jobs,
    isLoadingCMS,
    isCMSEnabled: !!spreadsheetId,
    spreadsheetId,
    saveSpreadsheetId,
    cmsError,
    refreshCMS,
    saveCMS,
    user,
    token,
    loginUser,
    logoutUser
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
