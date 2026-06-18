import React, { useState } from "react";
import { 
  Database, FileSpreadsheet, LogIn, LogOut, CheckCircle2, 
  RotateCw, RefreshCw, Layers, ExternalLink, HelpCircle, 
  Settings, Sparkles, Building2, MapPin, Phone, Mail, Clock, AlertTriangle,
  Plus, Trash2, Image, UserPlus, Briefcase, Calendar, Save, Info, BookOpen,
  Upload
} from "lucide-react";
import { useCMS, CMSProvider } from "../context/CMSContext";
import { googleSignIn, createCMS_Sheet, logout, uploadTeamPhoto } from "../lib/googleSheets";

export function AdminDashboard() {
  const { 
    allgemeines,
    team,
    historie,
    dienstleistungen,
    jobs,
    isLoadingCMS,
    isCMSEnabled,
    spreadsheetId,
    saveSpreadsheetId,
    cmsError,
    refreshCMS,
    saveCMS,
    user,
    token,
    loginUser,
    logoutUser
  } = useCMS();

  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState<boolean>(false);
  const [manualSheetId, setManualSheetId] = useState<string>("");
  const [showHowTo, setShowHowTo] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Synchronisierter Entwurf für das live CMS
  const [cmsDraft, setCmsDraft] = useState<any>(null);
  const [activeCmsTab, setActiveCmsTab] = useState<"general" | "services" | "team" | "history" | "jobs">("general");
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  // Storage Photo upload state
  const [uploadingIndices, setUploadingIndices] = useState<Record<number, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<number, string>>({});

  const handlePhotoUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIndices(prev => ({ ...prev, [index]: true }));
    setUploadErrors(prev => ({ ...prev, [index]: "" }));

    try {
      const downloadUrl = await uploadTeamPhoto(file);
      updateTeamMember(index, "imageUrl", downloadUrl);
      setFeedbackMsg(`🎉 Foto für "${cmsDraft?.team?.[index]?.name || "Team-Mitglied"}" erfolgreich in Firebase Storage hochgeladen! Drücken Sie unten auf "Änderungen speichern", um es dauerhaft zu machen.`);
    } catch (err: any) {
      console.error(err);
      setUploadErrors(prev => ({ ...prev, [index]: err.message || "Fehler beim Upload" }));
    } finally {
      setUploadingIndices(prev => ({ ...prev, [index]: false }));
    }
  };

  React.useEffect(() => {
    if (allgemeines && !cmsDraft) {
      setCmsDraft({
        allgemeines,
        team,
        historie,
        dienstleistungen,
        jobs
      });
    }
  }, [allgemeines, team, historie, dienstleistungen, jobs, cmsDraft]);

  const isCmsDirty = React.useMemo(() => {
    if (!cmsDraft) return false;
    return JSON.stringify({
      allgemeines,
      team,
      historie,
      dienstleistungen,
      jobs
    }) !== JSON.stringify(cmsDraft);
  }, [cmsDraft, allgemeines, team, historie, dienstleistungen, jobs]);

  // RESET DRAFT TO CURRENT ACTIVE VALUES
  const handleResetDraft = () => {
    setCmsDraft({
      allgemeines,
      team,
      historie,
      dienstleistungen,
      jobs
    });
    setFeedbackMsg("Bearbeitungsentwurf auf aktuelle Live-Inhalte zurückgesetzt.");
  };

  // UPDATE HELPERS
  const updateAllgemeinField = (key: string, val: string) => {
    if (!cmsDraft) return;
    setCmsDraft({
      ...cmsDraft,
      allgemeines: {
        ...cmsDraft.allgemeines,
        [key]: val
      }
    });
  };

  const updateTeamMember = (index: number, field: string, val: any) => {
    if (!cmsDraft) return;
    const updated = [...cmsDraft.team];
    updated[index] = {
      ...updated[index],
      [field]: val
    };
    setCmsDraft({
      ...cmsDraft,
      team: updated
    });
  };

  const addTeamMember = () => {
    if (!cmsDraft) return;
    const newMember = {
      name: "Neuer Mitarbeiter",
      role: "Heizungs- & Sanitärinstallateur",
      quote: "Handwerkliche Perfektion ist das, was uns antreibt.",
      description: "Unterstützt unser Team tatkräftig bei Installationen und Kundeneinsätzen.",
      experienceYear: new Date().getFullYear(),
      imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600"
    };
    setCmsDraft({
      ...cmsDraft,
      team: [...cmsDraft.team, newMember]
    });
  };

  const removeTeamMember = (index: number) => {
    if (!cmsDraft) return;
    setCmsDraft({
      ...cmsDraft,
      team: cmsDraft.team.filter((_: any, idx: number) => idx !== index)
    });
  };

  const updateCategory = (catIndex: number, field: "title" | "description", val: string) => {
    if (!cmsDraft) return;
    const updated = [...cmsDraft.dienstleistungen];
    updated[catIndex] = {
      ...updated[catIndex],
      [field]: val
    };
    setCmsDraft({
      ...cmsDraft,
      dienstleistungen: updated
    });
  };

  const updateServiceDetail = (catIndex: number, detailIndex: number, field: string, val: any) => {
    if (!cmsDraft) return;
    const updated = [...cmsDraft.dienstleistungen];
    const catDetails = [...updated[catIndex].details];
    
    if (field === "bullets") {
      catDetails[detailIndex] = {
        ...catDetails[detailIndex],
        bullets: val.split(";").map((b: string) => b.trim()).filter(Boolean)
      };
    } else {
      catDetails[detailIndex] = {
        ...catDetails[detailIndex],
        [field]: val
      };
    }

    updated[catIndex] = {
      ...updated[catIndex],
      details: catDetails
    };

    setCmsDraft({
      ...cmsDraft,
      dienstleistungen: updated
    });
  };

  const addServiceDetail = (catIndex: number) => {
    if (!cmsDraft) return;
    const updated = [...cmsDraft.dienstleistungen];
    const catDetails = [...updated[catIndex].details];
    catDetails.push({
      id: `service_detail_${Date.now()}`,
      title: "Neue Spezifikation",
      description: "Genaue Details zur angebotenen Haustechnik-Leistung frei formulieren.",
      bullets: ["Garantierte Fachausführung", "Faire, transparente Preise"]
    });
    updated[catIndex] = {
      ...updated[catIndex],
      details: catDetails
    };
    setCmsDraft({
      ...cmsDraft,
      dienstleistungen: updated
    });
  };

  const removeServiceDetail = (catIndex: number, detailIndex: number) => {
    if (!cmsDraft) return;
    const updated = [...cmsDraft.dienstleistungen];
    const catDetails = updated[catIndex].details.filter((_: any, idx: number) => idx !== detailIndex);
    updated[catIndex] = {
      ...updated[catIndex],
      details: catDetails
    };
    setCmsDraft({
      ...cmsDraft,
      dienstleistungen: updated
    });
  };

  const updateJob = (index: number, field: string, val: any) => {
    if (!cmsDraft) return;
    const updated = [...cmsDraft.jobs];
    if (field === "requirements" || field === "benefits") {
      updated[index] = {
        ...updated[index],
        [field]: val.split(";").map((x: string) => x.trim()).filter(Boolean)
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: val
      };
    }
    setCmsDraft({
      ...cmsDraft,
      jobs: updated
    });
  };

  const addJob = () => {
    if (!cmsDraft) return;
    const newJob = {
      id: `job_${Date.now()}`,
      title: "Auszubildender zum Anlagenmechaniker SHK (m/w/d)",
      type: "Ausbildung (Ludwigsfelde)",
      intro: "Lerne das Handwerk von den Profis. Wir bilden dich auf höchstem Niveau aus und bieten dir eine glänzende Zukunftsperspektive.",
      requirements: ["Haupt- oder Realschulabschluss", "Interesse an Technik & Handwerk", "Lust auf Teamarbeit"],
      benefits: ["Sehr gute Ausbildungsvergütung", "Echtes Werkzeug & eigene Arbeitskleidung", "Hohe Übernahmequote nach der Ausbildung"]
    };
    setCmsDraft({
      ...cmsDraft,
      jobs: [...cmsDraft.jobs, newJob]
    });
  };

  const removeJob = (index: number) => {
    if (!cmsDraft) return;
    setCmsDraft({
      ...cmsDraft,
      jobs: cmsDraft.jobs.filter((_: any, idx: number) => idx !== index)
    });
  };

  const updateHistory = (index: number, field: string, val: any) => {
    if (!cmsDraft) return;
    const updated = [...cmsDraft.historie];
    if (field === "year") {
      updated[index] = {
        ...updated[index],
        year: Number(val) || new Date().getFullYear()
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: val
      };
    }
    setCmsDraft({
      ...cmsDraft,
      historie: updated
    });
  };

  const addHistory = () => {
    if (!cmsDraft) return;
    const newMilestone = {
      year: new Date().getFullYear(),
      title: "Zukunft & Innovation",
      description: "Ausbau unseres Notdienstes und Einführung intelligenter Wärmepumpen-Fernüberwachung."
    };
    setCmsDraft({
      ...cmsDraft,
      historie: [...cmsDraft.historie, newMilestone]
    });
  };

  const removeHistory = (index: number) => {
    if (!cmsDraft) return;
    setCmsDraft({
      ...cmsDraft,
      historie: cmsDraft.historie.filter((_: any, idx: number) => idx !== index)
    });
  };

  const handleSaveDraft = async () => {
    if (!cmsDraft) return;
    setIsSavingDraft(true);
    setFeedbackMsg(null);
    try {
      await saveCMS(cmsDraft);
      setFeedbackMsg("🎉 Hervorragend! Ihre Änderungen wurden erfolgreich lokal übernommen und live in Ihre Google-Tabelle übertragen.");
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg("❌ Fehler beim Übertragen der Daten an Google Sheets. Bitte stellen Sie sicher, dass Ihr Token gültig ist.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Inhalte frisch aus dem Sheet einlesen (z. B. falls direkt im Sheet editiert wurde).
  const handleReload = async () => {
    if (isCmsDirty && !window.confirm("Ungespeicherte Änderungen gehen verloren. Inhalte wirklich neu aus dem Sheet laden?")) return;
    await refreshCMS();
    setCmsDraft(null); // löst den Sync-Effekt aus → Formular zeigt die frischen Sheet-Werte
  };

  // Character counter view helper
  const CharacterCount = ({ current, limit, idealMin, idealMax }: { current: number; limit: number; idealMin?: number; idealMax?: number }) => {
    const isOverLimit = current > limit;
    let colorClass = "text-stone-400 font-mono text-[9px]";
    let text = `${current} / ${limit} Zeichen`;

    if (isOverLimit) {
      colorClass = "text-[#ff4c00] font-bold font-mono text-[10px]";
      text += " - Achtung! Layout-Überlauf droht";
    } else if (idealMin !== undefined && idealMax !== undefined) {
      if (current < idealMin) {
        colorClass = "text-amber-500 font-semibold font-mono text-[9.5px]";
        text += ` (Kürzer als empfohlen: am besten ${idealMin}-${idealMax} Zeichen)`;
      } else if (current > idealMax) {
        colorClass = "text-amber-500 font-semibold font-mono text-[9.5px]";
        text += ` (Länger als empfohlen: am besten ${idealMin}-${idealMax} Zeichen)`;
      } else {
        colorClass = "text-emerald-600 font-bold font-mono text-[9.5px]";
        text += " (Perfekte Länge für Ihr Premium-Layout!)";
      }
    }
    return <span className={`${colorClass} block mt-1 tracking-wide uppercase`}>{text}</span>;
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setFeedbackMsg(null);
    try {
      const result = await googleSignIn();
      if (result) {
        loginUser(result.user, result.accessToken);
        setFeedbackMsg("Erfolgreich mit Google verknüpft.");
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg("Fehler bei der Google Anmeldung. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    logoutUser();
    setFeedbackMsg("Vom Google Konto abgemeldet.");
  };

  const handleCreateCMS = async () => {
    if (!token) return;
    setIsCreatingSheet(true);
    setFeedbackMsg(null);
    try {
      const newId = await createCMS_Sheet(token);
      saveSpreadsheetId(newId);
      setFeedbackMsg("Glückwunsch! Ihre neue CMS-Tabelle wurde erfolgreich in Ihrem Google Drive erstellt.");
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg("Konnte die CMS-Tabelle nicht erstellen. Prüfen Sie Ihre Google Drive Berechtigungen.");
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleConnectManual = () => {
    if (!manualSheetId.trim()) return;
    saveSpreadsheetId(manualSheetId.trim());
    setFeedbackMsg("Verbindung zur angegebenen Tabelle hergestellt.");
    setManualSheetId("");
  };

  const handleDisconnect = () => {
    const confirm = window.confirm("Möchten Sie die Verknüpfung der Homepage mit dieser Tabelle wirklich aufheben? Ihre Inhalte werden dabei auf die Standard-Meisterkopie zurückgesetzt.");
    if (confirm) {
      saveSpreadsheetId(null);
      setFeedbackMsg("Verknüpfung aufgehoben.");
    }
  };

  return (
    <div id="admin-panel" className="w-full bg-white border-2 border-[#121315] rounded-3xl p-6 sm:p-10 shadow-[6px_6px_0px_0px_rgba(18,19,21,1)] relative overflow-hidden font-sans">
      
      {/* Editorial Title Block */}
      <div className="border-b border-stone-200 pb-6 mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="font-mono text-[9px] text-[#ff4c00] uppercase tracking-[0.25em] font-black mb-1.5 flex items-center">
            <Settings className="w-3 h-3 mr-1" /> MEISTER-BACKEND // GOOGLE SHEETS AS CMS
          </div>
          <h2 className="font-serif text-3xl font-black text-[#121315] tracking-tight">
            Homepage Content-Manager
          </h2>
          <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-xl font-medium">
            Verwalten Sie alle Texte, Adressen, Dienstleistungen, Stellenausschreibungen und Biografien direkt über eine Google-Tabelle. Ohne Programmierkenntnisse, live anpassbar.
          </p>
        </div>

        {user ? (
          <div className="flex items-center space-x-3 bg-stone-50 border border-stone-200/60 p-2 rounded-2xl">
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full border border-stone-300" 
              />
            )}
            <div className="text-left">
              <div className="text-xs font-black text-[#121315] truncate leading-normal">{user.displayName}</div>
              <div className="text-[10px] font-mono text-stone-400 truncate leading-none">{user.email}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
              title="Konto trennen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center h-10 px-4.5 bg-[#121315] hover:bg-black text-white rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoggingIn ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin mr-2" />
            ) : (
              <LogIn className="w-3.5 h-3.5 mr-2" />
            )}
            <span>Mit Google anmelden</span>
          </button>
        )}
      </div>

      {/* FEEDBACK BANNERS */}
      {feedbackMsg && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold animate-slide">
          {feedbackMsg}
        </div>
      )}

      {cmsError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs text-red-800 font-medium">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p>{cmsError}</p>
        </div>
      )}

      {/* BEFORE GOOGLE SIGN-IN */}
      {!user ? (
        <div className="max-w-xl mx-auto text-center py-6 space-y-6">
          <div className="h-16 w-16 bg-[#ff4c00]/10 rounded-full flex items-center justify-center mx-auto border border-[#ff4c00]/15">
            <Database className="w-8 h-8 text-[#ff4c00]" />
          </div>
          
          <div className="space-y-3">
            <h3 className="font-serif text-2xl font-black text-[#121315]">
              Sicheren Google Workspace Zugriff starten
            </h3>
            <p className="text-stone-500 text-sm leading-relaxed max-w-sm mx-auto font-semibold">
              Um eine Tabelle in Ihrem Google Drive lesen und strukturieren zu können, melden Sie sich bitte kurz mit Ihrem Google-Konto an.
            </p>
          </div>

          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="inline-flex items-center bg-white border border-stone-300 rounded-xl px-5 h-12 hover:shadow-sm active:bg-stone-50/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoggingIn ? (
              <RotateCw className="w-4 h-4 animate-spin text-stone-500 mr-2.5" />
            ) : (
              <div className="mr-3.5 flex-shrink-0">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px] block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
            )}
            <span className="font-semibold text-stone-700 text-sm">
              {isLoggingIn ? "Verbindung wird hergestellt..." : "Inhaber-Konto verknüpfen"}
            </span>
          </button>
        </div>
      ) : (
        /* AFTER GOOGLE SIGN-IN */
        <div className="space-y-8 animate-fade text-left">
          
          {/* SPREADSHEET DETECTOR */}
          {!isCMSEnabled ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-4xl mx-auto py-4">
              {/* Option A: Create template auto */}
              <div className="p-8 bg-stone-50 border border-stone-200 rounded-3xl text-center space-y-5 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="h-12 w-12 bg-[#ff4c00]/10 text-[#ff4c00] rounded-full flex items-center justify-center mx-auto border border-[#ff4c00]/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-black text-[#121315]">
                      Vorlage-Tabelle neu erstellen
                    </h4>
                    <p className="text-stone-500 text-xs leading-relaxed mt-1 font-semibold max-w-xs mx-auto">
                      Erstellt eine frische Google Sheets Datei direkt in Ihrem Google Drive. Alle aktuellen Website-Inhalte sind fix und fertig als voreingestellte Zeilen eingetragen!
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleCreateCMS}
                    disabled={isCreatingSheet}
                    className="w-full inline-flex items-center justify-center h-11 uppercase font-black tracking-wider text-[10px] bg-[#ff4c00] hover:bg-[#ff4c00]/90 text-white rounded-full transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingSheet ? (
                      <>
                        <RotateCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Tabelle wird erzeugt...
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5 mr-2" />
                        CMS-Tabelle anlegen
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option B: Enter manual ID */}
              <div className="p-8 bg-white border border-stone-200 rounded-3xl text-center space-y-5 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-500/10">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg font-black text-[#121315]">
                      Bestehende Tabellen-ID eintragen
                    </h4>
                    <p className="text-stone-500 text-xs leading-relaxed mt-1 font-semibold max-w-xs mx-auto">
                      Haben Sie bereits ein fertiges Google Sheet eingerichtet oder verschoben? Fügen Sie einfach die kryptische Google Sheets ID unten ein.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input 
                    type="text"
                    value={manualSheetId}
                    onChange={(e) => setManualSheetId(e.target.value)}
                    placeholder="z.B. 1x_A342Bcl9K..."
                    className="w-full h-11 px-4 border-2 border-stone-200 rounded-xl text-xs font-mono focus:border-[#ff4c00] outline-none"
                  />
                  <button 
                    onClick={handleConnectManual}
                    disabled={!manualSheetId.trim()}
                    className="w-full inline-flex items-center justify-center h-10 px-5 rounded-full border border-stone-300 text-stone-700 hover:text-black font-extrabold text-[10px] uppercase tracking-wider transition-colors bg-stone-50 disabled:opacity-50 cursor-pointer"
                  >
                    Verknüpfen
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* CURRENTLY THE ACTIVE LIVE SHEET CMS STATUS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Visual Connection Card */}
                <div className="lg:col-span-8 bg-[#fafaf7] border border-stone-200/80 p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6">
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/10 font-black">
                      CMS VERKNÜPFUNG AKTIV // LIVE-DRIVEN
                    </span>
                    <h4 className="font-serif text-2xl font-black text-[#121315] pt-1">
                      JOHN Haustechnik - Homepage CMS (Live)
                    </h4>
                    <p className="text-stone-400 text-xs font-mono font-medium truncate max-w-md">
                      ID: {spreadsheetId}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <button
                      onClick={() => setShowHowTo(!showHowTo)}
                      className="inline-flex items-center text-xs font-semibold text-stone-500 hover:text-black cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 mr-1.5" /> {showHowTo ? "Anleitung ausblenden" : "Kurzanleitung anzeigen"}
                    </button>
                  </div>
                </div>

                {/* SRE-PULL SYNC TRIGGER */}
                <div className="lg:col-span-4 bg-[#121315] text-white p-6 sm:p-8 rounded-3xl flex flex-col justify-between space-y-6">
                  <div className="space-y-1.5">
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-[#ff4c00] font-black">
                      TEMPO & DRY REFRESH
                    </span>
                    <h4 className="font-serif text-base font-black text-white">
                      Inhalte neu einlesen
                    </h4>
                    <p className="text-stone-400 text-xs leading-relaxed font-semibold">
                      Direkt im Google Sheet etwas geändert? Hier neu einlesen, um die Formularfelder zu aktualisieren. (Speichern hier geht ohnehin sofort live.)
                    </p>
                  </div>

                  <button
                    onClick={handleReload}
                    disabled={isLoadingCMS}
                    className="w-full inline-flex items-center justify-center h-11 bg-[#ff4c00] hover:bg-[#ff4c00]/90 text-white rounded-full font-black text-[9.5px] uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isLoadingCMS ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Lade…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-2" />
                        Vom Sheet neu laden
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* DETAILS OF INGESTED DATA COUNTS (VISUAL PROOF) */}
              <div className="p-6 bg-[#fafaf7] border border-stone-200/80 rounded-3xl space-y-4">
                <div className="font-mono text-[10px] tracking-wide text-stone-400 border-b border-stone-200/40 pb-2 mb-2 uppercase font-bold flex items-center justify-between">
                  <span>Aktuell eingelesene CMS-Statistik</span>
                  <span className="text-emerald-600 flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Stand: Synchronisiert
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                  <div className="bg-white p-4.5 rounded-2xl border border-stone-100 flex flex-col justify-between">
                    <span className="font-serif font-black text-[#121315] text-xl">
                      {Object.keys(allgemeines).length}
                    </span>
                    <span className="font-mono text-[9px] text-[#ff4c00] uppercase font-black mt-1">
                      Allgemeines
                    </span>
                  </div>
                  <div className="bg-white p-4.5 rounded-2xl border border-stone-100 flex flex-col justify-between">
                    <span className="font-serif font-black text-[#121315] text-xl">
                      {dienstleistungen.length}
                    </span>
                    <span className="font-mono text-[9px] text-blue-600 uppercase font-black mt-1">
                      Kategorien
                    </span>
                  </div>
                  <div className="bg-white p-4.5 rounded-2xl border border-stone-100 flex flex-col justify-between">
                    <span className="font-serif font-black text-[#121315] text-xl">
                      {team.length}
                    </span>
                    <span className="font-mono text-[9px] text-teal-600 uppercase font-black mt-1">
                      Teammember
                    </span>
                  </div>
                  <div className="bg-white p-4.5 rounded-2xl border border-stone-100 flex flex-col justify-between">
                    <span className="font-serif font-black text-[#121315] text-xl">
                      {historie.length}
                    </span>
                    <span className="font-mono text-[9px] text-amber-600 uppercase font-black mt-1">
                      Milestones
                    </span>
                  </div>
                  <div className="bg-white p-4.5 rounded-2xl border border-stone-100 flex flex-col justify-between">
                    <span className="font-serif font-black text-[#121315] text-xl">
                      {jobs.length}
                    </span>
                    <span className="font-mono text-[9px] text-stone-500 uppercase font-black mt-1">
                      Offene Jobs
                    </span>
                  </div>
                </div>
              </div>

              {/* CURATOR VISUAL HOW-TO GUIDE */}
              {showHowTo && (
                <div className="p-6 bg-stone-50 border border-stone-200 rounded-3xl space-y-4 text-xs font-semibold leading-relaxed text-stone-600 animate-slide">
                  <h5 className="font-serif text-sm font-black text-[#121315]">
                    💡 Wie pflege ich meine Website über Google Sheets?
                  </h5>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <span className="text-black font-bold">Neue Jobs oder Meilensteine hinzufügen:</span> Fügen Sie im Tab <span className="font-mono">Karriere</span> oder <span className="font-mono">Historie</span> einfach unten eine neue Zeile hinzu und tragen Sie die Inhalte ein. Nach dem Synchronisieren erscheint das Angebot vollautomatisch auf der Seite!
                    </li>
                    <li>
                      <span className="text-black font-bold">Texte ändern (Telefon, Öffnungszeiten, Hero-Text):</span> Im Tab <span className="font-mono">Allgemeines</span> sehen Sie in Spalte A die Programmschlüssel. Ändern Sie einfach den Wert in Spalte B (z.B. die Telefonnummer) ab. Wichtig: Die Schlüssel in Spalte A dürfen <span className="text-red-500 font-bold">nicht umbenannt</span> werden.
                    </li>
                    <li>
                      <span className="text-black font-bold">Bulletpoints gliedern:</span> Bei den Dienstleistungen oder Karrierebeschreibungen können Sie mehrere Bullets (Spiegelstriche) in einer einzigen Zelle auflisten – trennen Sie diese einfach sauber mit einem Semikolon (<span className="font-mono font-bold">;</span>).
                    </li>
                    <li>
                      <span className="text-black font-bold">Zweites Dienstjahr:</span> Die Jahreszahlen helfen, das Dienstjahr vollautomatisch auf das aktuelle Jahr hochzurechnen, um das meisterliche Dienstalter exakt anzuzeigen.
                    </li>
                  </ul>
                </div>
              )}

              {/* INTERACTIVE FORM CMS EDITOR */}
              {cmsDraft && (
                <div className="mt-12 pt-12 border-t border-stone-200/80 space-y-8 animate-fade">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/60 pb-5">
                    <div>
                      <span className="font-mono text-[9px] text-[#ff4c00] uppercase tracking-widest font-black flex items-center">
                        <Sparkles className="w-3 h-3 mr-1" /> VISUELLES LIVE-CMS WEB-FORMULAR
                      </span>
                      <h3 className="font-serif text-2xl font-black text-[#121315] pt-0.5">
                        Inhalte direkt auf der Webseite bearbeiten
                      </h3>
                      <p className="text-stone-500 text-xs font-semibold mt-1">
                        Alle Texte und Porträts können hier mit Echtzeit-Layoutschutz und optimaler Längenberatung gepflegt und live im Google Sheet korrigiert werden!
                      </p>
                    </div>

                    {isCmsDirty && (
                      <div className="flex items-center space-x-2 bg-amber-50 text-amber-800 text-[10px] uppercase tracking-wider font-extrabold border border-amber-200/60 px-3.5 py-2 rounded-xl animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#ff4c00]" />
                        <span>Ungespeicherte Änderungen vorhanden!</span>
                      </div>
                    )}
                  </div>

                  {/* TAB SWITCHER PILLS */}
                  <div className="flex flex-wrap gap-2 border-b border-stone-100 pb-4">
                    <button
                      onClick={() => setActiveCmsTab("general")}
                      className={`px-4.5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                        activeCmsTab === "general"
                          ? "bg-[#ff4c00] text-white shadow-sm"
                          : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/50"
                      }`}
                    >
                      📂 Allgemeines & Header-Texte
                    </button>
                    <button
                      onClick={() => setActiveCmsTab("services")}
                      className={`px-4.5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                        activeCmsTab === "services"
                          ? "bg-[#ff4c00] text-white shadow-sm"
                          : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/50"
                      }`}
                    >
                      🛠️ Dienstleistungen (4 Bereiche)
                    </button>
                    <button
                      onClick={() => setActiveCmsTab("team")}
                      className={`px-4.5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                        activeCmsTab === "team"
                          ? "bg-[#ff4c00] text-white shadow-sm"
                          : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/50"
                      }`}
                    >
                      👥 Team-Manager & Porträtfotos
                    </button>
                    <button
                      onClick={() => setActiveCmsTab("jobs")}
                      className={`px-4.5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                        activeCmsTab === "jobs"
                          ? "bg-[#ff4c00] text-white shadow-sm"
                          : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/50"
                      }`}
                    >
                      💼 Offene Jobs & Ausbildung
                    </button>
                    <button
                      onClick={() => setActiveCmsTab("history")}
                      className={`px-4.5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all cursor-pointer ${
                        activeCmsTab === "history"
                          ? "bg-[#ff4c00] text-white shadow-sm"
                          : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/50"
                      }`}
                    >
                      ⏳ Historie & Meilensteine
                    </button>
                  </div>

                  {/* ACTIVE TAB CONTAINER */}
                  <div className="bg-[#fafaf7]/50 border border-stone-200/50 p-6 sm:p-8 rounded-3xl">
                    
                    {/* 1. GENERAL TEXTS TAB */}
                    {activeCmsTab === "general" && (
                      <div className="space-y-6">
                        <div className="font-mono text-[9px] tracking-wider text-[#ff4c00] uppercase font-black">
                          Dachzeilen, Kontaktpunkte & Statistiken bearbeiten
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* HERO TITLE */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Zentraler Werbespruch / Hero-Titel (H1)</label>
                            <textarea
                              value={cmsDraft.allgemeines.hero_title || ""}
                              onChange={(e) => updateAllgemeinField("hero_title", e.target.value)}
                              rows={2}
                              className="w-full text-xs font-sans font-medium px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.hero_title || "").length} limit={110} idealMin={35} idealMax={75} />
                          </div>

                          {/* HERO SUBTITLE */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Untertitel / Teaser-Beschreibung</label>
                            <textarea
                              value={cmsDraft.allgemeines.hero_subtitle || ""}
                              onChange={(e) => updateAllgemeinField("hero_subtitle", e.target.value)}
                              rows={3}
                              className="w-full text-xs font-sans px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.hero_subtitle || "").length} limit={320} idealMin={120} idealMax={260} />
                          </div>

                          {/* PHONE BÜRO */}
                          <div className="space-y-1.5">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Haupt-Telefonnummer (Büro)</label>
                            <input
                              type="text"
                              value={cmsDraft.allgemeines.contact_phone || ""}
                              onChange={(e) => updateAllgemeinField("contact_phone", e.target.value)}
                              className="w-full text-xs font-mono font-bold px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.contact_phone || "").length} limit={25} />
                          </div>

                          {/* PHONE EMERGENCY */}
                          <div className="space-y-1.5">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Notdienst- Bereitschaftsnummer (Signalrot)</label>
                            <input
                              type="text"
                              value={cmsDraft.allgemeines.notdienst_phone || ""}
                              onChange={(e) => updateAllgemeinField("notdienst_phone", e.target.value)}
                              className="w-full text-xs font-mono font-bold text-red-500 px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.notdienst_phone || "").length} limit={25} />
                          </div>

                          {/* EMAIL */}
                          <div className="space-y-1.5">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">E-Mail-Adresse für Anfragen</label>
                            <input
                              type="email"
                              value={cmsDraft.allgemeines.contact_email || ""}
                              onChange={(e) => updateAllgemeinField("contact_email", e.target.value)}
                              className="w-full text-xs font-sans px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.contact_email || "").length} limit={50} />
                          </div>

                          {/* FIRMENADRESSE */}
                          <div className="space-y-1.5">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Firmensitz Anschrift (Zweigstellen-Zentriert)</label>
                            <input
                              type="text"
                              value={cmsDraft.allgemeines.contact_address || ""}
                              onChange={(e) => updateAllgemeinField("contact_address", e.target.value)}
                              className="w-full text-xs font-sans px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.contact_address || "").length} limit={100} />
                          </div>

                          {/* SERVICEZEITEN */}
                          <div className="space-y-1.5 md:col-span-2">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Büro-Öffnungszeiten & Erreichbarkeitslabel</label>
                            <input
                              type="text"
                              value={cmsDraft.allgemeines.contact_hours || ""}
                              onChange={(e) => updateAllgemeinField("contact_hours", e.target.value)}
                              className="w-full text-xs font-sans px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.contact_hours || "").length} limit={120} />
                          </div>

                          {/* STATS */}
                          <div className="space-y-1.5">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Zahlensymbol: Erfahrungswert (z.B. "45 Jahre")</label>
                            <input
                              type="text"
                              value={cmsDraft.allgemeines.experience_stat || ""}
                              onChange={(e) => updateAllgemeinField("experience_stat", e.target.value)}
                              className="w-full text-xs font-sans px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.experience_stat || "").length} limit={20} />
                          </div>

                          <div className="space-y-1.5">
                            <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Zahlensymbol: Qualitätsgarantie (z.B. "100%")</label>
                            <input
                              type="text"
                              value={cmsDraft.allgemeines.success_stat || ""}
                              onChange={(e) => updateAllgemeinField("success_stat", e.target.value)}
                              className="w-full text-xs font-sans px-4 py-3 bg-white border border-stone-200 rounded-xl focus:border-[#ff4c00] outline-none"
                            />
                            <CharacterCount current={(cmsDraft.allgemeines.success_stat || "").length} limit={20} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. SERVICES TAB (ZENTRALE TEXTE, KEINE REDUNDANTEN DOPPELBAUSTELLEN) */}
                    {activeCmsTab === "services" && (
                      <div className="space-y-12 animate-fade">
                        <div className="font-mono text-[9px] tracking-wider text-[#ff4c00] uppercase font-black pb-2 border-b border-stone-200/40">
                          4 Kernleistungen editieren - Ein zentraler Teaser pro Kategorie schließt redundante Tippduplikate aus!
                        </div>

                        {cmsDraft.dienstleistungen.map((cat: any, catIdx: number) => {
                          const badgeColor = catIdx === 0 
                            ? "text-teal-600 bg-teal-50 border-teal-200" 
                            : catIdx === 1 
                              ? "text-red-500 bg-red-50 border-red-200" 
                              : catIdx === 2 
                                ? "text-cyan-600 bg-cyan-50 border-cyan-200" 
                                : "text-amber-600 bg-amber-50 border-amber-200";

                          return (
                            <div key={cat.id} className="border-2 border-stone-200/50 bg-white p-6 sm:p-8 rounded-2xl space-y-6">
                              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                                <div className="space-y-1">
                                  <span className={`font-mono text-[8px] tracking-[0.2em] font-extrabold uppercase px-2.5 py-1 rounded-full border ${badgeColor}`}>
                                    BEREICH: {cat.id.toUpperCase()}
                                  </span>
                                  <h4 className="font-serif text-lg font-black text-[#121315] pt-1">
                                    {cat.title || cat.id}
                                  </h4>
                                </div>
                              </div>

                              {/* ZENTRALE TEXTFELDER PRO KATEGORIE */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="font-mono text-[9px] uppercase text-stone-500 font-bold">Überschrift des Fachbereichs</label>
                                  <input
                                    type="text"
                                    value={cat.title}
                                    onChange={(e) => updateCategory(catIdx, "title", e.target.value)}
                                    className="w-full text-xs font-sans font-bold px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                  <label className="font-mono text-[9px] uppercase text-stone-500 font-bold">Zentraler Teasertext (Erscheint oben am Leistungsbalken - EINMALIG zu füllen)</label>
                                  <textarea
                                    value={cat.description}
                                    onChange={(e) => updateCategory(catIdx, "description", e.target.value)}
                                    rows={2}
                                    className="w-full text-xs font-sans px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                  <CharacterCount current={(cat.description || "").length} limit={250} idealMin={60} idealMax={180} />
                                </div>
                              </div>

                              {/* KARTEN-LISTE */}
                              <div className="space-y-4 pt-2">
                                <div className="font-mono text-[9px] text-[#ff4c00] tracking-wider uppercase font-black">
                                  Gliederungskarten für {cat.title} ({cat.details?.length || 0})
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                  {(cat.details || []).map((det: any, detIdx: number) => (
                                    <div key={det.id} className="relative p-5 bg-stone-50/40 border border-stone-200/50 rounded-xl space-y-4">
                                      <button
                                        onClick={() => removeServiceDetail(catIdx, detIdx)}
                                        className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                        title="Spezifikation löschen"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <label className="font-mono text-[8px] uppercase text-stone-400 font-bold">Leistungskarten Name / Service</label>
                                          <input
                                            type="text"
                                            value={det.title}
                                            onChange={(e) => updateServiceDetail(catIdx, detIdx, "title", e.target.value)}
                                            className="w-full text-xs font-sans font-bold px-3 py-1.5 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                          />
                                          <CharacterCount current={(det.title || "").length} limit={40} />
                                        </div>

                                        <div className="space-y-1">
                                          <label className="font-mono text-[8px] uppercase text-stone-400 font-bold">Bullet-Stichpunkte (Mit Semikolon ; trennen)</label>
                                          <input
                                            type="text"
                                            value={(det.bullets || []).join("; ")}
                                            onChange={(e) => updateServiceDetail(catIdx, detIdx, "bullets", e.target.value)}
                                            placeholder="z.B. Wartungsvertrag; Fachbetriebsgarantie; Meisterprüfung"
                                            className="w-full text-xs font-sans px-3 py-1.5 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                          />
                                        </div>

                                        <div className="space-y-1 md:col-span-2">
                                          <label className="font-mono text-[8px] uppercase text-stone-400 font-bold">Beschreibender Fließtext auf der Karte</label>
                                          <textarea
                                            value={det.description}
                                            onChange={(e) => updateServiceDetail(catIdx, detIdx, "description", e.target.value)}
                                            rows={2}
                                            className="w-full text-[11px] font-sans px-3 py-1.5 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                          />
                                          <CharacterCount current={(det.description || "").length} limit={160} idealMin={40} idealMax={120} />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <button
                                  onClick={() => addServiceDetail(catIdx)}
                                  className="inline-flex items-center text-xs font-bold text-[#ff4c00] hover:text-[#ff4c00]/85 cursor-pointer mt-1"
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" /> Neue Karte in {cat.title} hinzufügen
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. TEAM MANAGE TAB WITH PERFECT PORTRAIT GUIDANCE */}
                    {activeCmsTab === "team" && (
                      <div className="space-y-8 animate-fade">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                          <div className="space-y-0.5">
                            <h4 className="font-serif text-lg font-black text-[#121315]">
                              Spezialisten & Team-Verwaltung
                            </h4>
                            <p className="text-[11px] text-stone-400 font-semibold uppercase font-mono">
                              Porträts werden für hervorragende Visuals in ein meisterliches 4:5 polaroid-layout eingefügt
                            </p>
                          </div>
                          <button
                            onClick={addTeamMember}
                            className="inline-flex items-center h-10 px-4.5 bg-[#121315] hover:bg-black text-[10px] uppercase tracking-wider font-extrabold text-white rounded-xl transition-transform active:scale-95 cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4 mr-1.5" /> Mitarbeiter anlegen
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          {cmsDraft.team.map((member: any, mIdx: number) => (
                            <div key={member.name + mIdx} className="border-2 border-stone-200/80 bg-white p-6 rounded-2xl flex flex-col md:flex-row gap-6 relative shadow-[2px_2px_0px_0px_rgba(18,19,21,0.05)]">
                              <button
                                onClick={() => removeTeamMember(mIdx)}
                                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="Mitarbeiter löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              {/* PORTRAIT PREVIEW & ASSISTANCE SIZE BOX */}
                              <div className="w-full md:w-40 flex-shrink-0 flex flex-col items-center justify-center space-y-2 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-stone-100 pr-0 md:pr-4">
                                <div className="w-[110px] aspect-[4/5] bg-stone-50 border-2 border-[#121315] rounded-md overflow-hidden flex items-center justify-center shadow-sm relative">
                                  {member.imageUrl ? (
                                    <img
                                      src={member.imageUrl}
                                      alt={member.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.opacity = '0.3';
                                      }}
                                    />
                                  ) : (
                                    <div className="text-center text-stone-300 p-2">
                                      <Image className="w-6 h-6 mx-auto stroke-1" />
                                      <span className="text-[7px] font-mono block mt-1 uppercase font-bold">No Image</span>
                                    </div>
                                  )}
                                </div>
                                <span className="font-mono text-[7.5px] text-[#ff4c00] font-black uppercase tracking-wider text-center bg-[#ff4c00]/5 px-2 py-0.5 rounded border border-[#ff4c00]/10">
                                  Verhältnis 4:5 weite
                                </span>
                              </div>

                              {/* CORE EDIT FIELDS */}
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Mitarbeiter Name</label>
                                  <input
                                    type="text"
                                    value={member.name}
                                    onChange={(e) => updateTeamMember(mIdx, "name", e.target.value)}
                                    className="w-full text-xs font-sans font-bold px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Rolle im Kundendienst / Office</label>
                                  <input
                                    type="text"
                                    value={member.role}
                                    onChange={(e) => updateTeamMember(mIdx, "role", e.target.value)}
                                    className="w-full text-xs font-sans px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Zitat / Persönlicher Leitsatz</label>
                                  <textarea
                                    value={member.quote}
                                    onChange={(e) => updateTeamMember(mIdx, "quote", e.target.value)}
                                    rows={2}
                                    className="w-full text-xs font-sans italic px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                  <CharacterCount current={(member.quote || "").length} limit={180} idealMin={50} idealMax={130} />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Mitarbeiter Biografie (Kompetenzen & Charakter)</label>
                                  <textarea
                                    value={member.description}
                                    onChange={(e) => updateTeamMember(mIdx, "description", e.target.value)}
                                    rows={2}
                                    className="w-full text-xs font-sans px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                  <CharacterCount current={(member.description || "").length} limit={360} idealMin={120} idealMax={260} />
                                </div>

                                <div className="space-y-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Eintritts- oder Dienstjahr (z.B. "2013")</label>
                                  <input
                                    type="number"
                                    value={member.experienceYear || ""}
                                    onChange={(e) => updateTeamMember(mIdx, "experienceYear", e.target.value)}
                                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Foto-Dateipfad, Internet-Bildlink oder Upload</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={member.imageUrl || ""}
                                      onChange={(e) => updateTeamMember(mIdx, "imageUrl", e.target.value)}
                                      placeholder="https://images.unsplash.com/photo-..."
                                      className="flex-1 text-xs font-mono px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                    />
                                    <label className="inline-flex items-center justify-center px-4 bg-[#121315] hover:bg-black text-white rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-colors cursor-pointer shrink-0 select-none">
                                      {uploadingIndices[mIdx] ? (
                                        <RotateCw className="w-3.5 h-3.5 animate-spin mr-1" />
                                      ) : (
                                        <Upload className="w-3.5 h-3.5 mr-1" />
                                      )}
                                      <span>{uploadingIndices[mIdx] ? "Upload..." : "Hochladen"}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadingIndices[mIdx]}
                                        onChange={(e) => handlePhotoUpload(mIdx, e)}
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                  {uploadErrors[mIdx] && (
                                    <div className="text-[10px] text-red-500 font-bold mt-1">
                                      ⚠️ {uploadErrors[mIdx]}
                                    </div>
                                  )}
                                  <span className="text-[8px] leading-normal font-medium text-stone-400 block mt-1 uppercase font-mono">
                                    💡 Perfektes Bildformat: Vertikal 600 × 750px (Weite:Höhe ratio 4:5). Bilder werden sicher per Firebase Storage gespeichert.
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. OPEN JOBS TAB */}
                    {activeCmsTab === "jobs" && (
                      <div className="space-y-8 animate-fade">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                          <div className="space-y-0.5">
                            <h4 className="font-serif text-lg font-black text-[#121315]">
                              Aktuelle Ausschreibungen & Handwerks-Jobs
                            </h4>
                            <p className="text-[11px] text-stone-400 font-semibold uppercase font-mono">
                              Bieten Sie Bewerbern ein Premium-Karriereportal direkt auf der Homepage an
                            </p>
                          </div>
                          <button
                            onClick={addJob}
                            className="inline-flex items-center h-10 px-4.5 bg-[#121315] hover:bg-black text-[10px] uppercase tracking-wider font-extrabold text-white rounded-xl transition-transform active:scale-95 cursor-pointer"
                          >
                            <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Job ausschreiben
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          {cmsDraft.jobs.map((job: any, jIdx: number) => (
                            <div key={job.id} className="border-2 border-stone-200 bg-white p-6 rounded-2xl relative space-y-4 shadow-[2px_2px_0px_0px_rgba(18,19,21,0.05)]">
                              <button
                                onClick={() => removeJob(jIdx)}
                                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="Ausschreibung entfernen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Stellenbezeichnung (H2)</label>
                                  <input
                                    type="text"
                                    value={job.title}
                                    onChange={(e) => updateJob(jIdx, "title", e.target.value)}
                                    className="w-full text-xs font-sans font-bold px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                  <CharacterCount current={(job.title || "").length} limit={60} />
                                </div>

                                <div className="space-y-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Anstellungsverhältnis & Arbeitsort</label>
                                  <input
                                    type="text"
                                    value={job.type}
                                    onChange={(e) => updateJob(jIdx, "type", e.target.value)}
                                    placeholder="z.B. Vollzeit / Unbefristet in Ludwigsfelde"
                                    className="w-full text-xs font-sans px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                  <CharacterCount current={(job.type || "").length} limit={40} />
                                </div>

                                <div className="space-y-1 sm:col-span-2">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Einleitende Jobbeschreibung</label>
                                  <textarea
                                    value={job.intro}
                                    onChange={(e) => updateJob(jIdx, "intro", e.target.value)}
                                    rows={2}
                                    className="w-full text-xs font-sans px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                  <CharacterCount current={(job.intro || "").length} limit={250} />
                                </div>

                                <div className="space-y-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold font-black">Ihr Profil / Anforderungen (Mit Semikolon ; trennen)</label>
                                  <textarea
                                    value={(job.requirements || []).join("; ")}
                                    onChange={(e) => updateJob(jIdx, "requirements", e.target.value)}
                                    rows={3}
                                    className="w-full text-xs font-sans px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none font-medium leading-relaxed"
                                    placeholder="Fachausbildung SHK; Selbstständiges Arbeiten; Führerschein B..."
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold font-black">Betriebsvorteile / Wir bieten (Mit Semikolon ; trennen)</label>
                                  <textarea
                                    value={(job.benefits || []).join("; ")}
                                    onChange={(e) => updateJob(jIdx, "benefits", e.target.value)}
                                    rows={3}
                                    className="w-full text-xs font-sans px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none font-medium leading-relaxed"
                                    placeholder="Übertariflicher Lohn; 30 Tage Urlaub; Moderner Fuhrpark..."
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. HISTORY TAB */}
                    {activeCmsTab === "history" && (
                      <div className="space-y-8 animate-fade">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                          <div className="space-y-0.5">
                            <h4 className="font-serif text-lg font-black text-[#121315]">
                              Historie-Meilensteine der Firma
                            </h4>
                            <p className="text-[11px] text-stone-400 font-semibold uppercase font-mono">
                              Dokumentieren Sie die traditionsreiche Handwerksgeschichte seit 1981
                            </p>
                          </div>
                          <button
                            onClick={addHistory}
                            className="inline-flex items-center h-10 px-4.5 bg-[#121315] hover:bg-black text-[10px] uppercase tracking-wider font-extrabold text-white rounded-xl transition-transform active:scale-95 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Meilenstein anlegen
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          {cmsDraft.historie.map((milestone: any, hIdx: number) => (
                            <div key={milestone.year + milestone.title + hIdx} className="border-2 border-stone-200 bg-white p-6 rounded-2xl relative space-y-4 shadow-[2px_2px_0px_0px_rgba(18,19,21,0.05)]">
                              <button
                                onClick={() => removeHistory(hIdx)}
                                className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="Meilenstein löschen"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1 col-span-1">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Historisches Kalenderjahr</label>
                                  <input
                                    type="number"
                                    value={milestone.year}
                                    onChange={(e) => updateHistory(hIdx, "year", e.target.value)}
                                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                </div>

                                <div className="space-y-1 md:col-span-2">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Meilenstein Schlagzeile</label>
                                  <input
                                    type="text"
                                    value={milestone.title}
                                    onChange={(e) => updateHistory(hIdx, "title", e.target.value)}
                                    className="w-full text-xs font-sans font-bold px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                  <CharacterCount current={(milestone.title || "").length} limit={60} />
                                </div>

                                <div className="space-y-1 md:col-span-3">
                                  <label className="font-mono text-[9px] uppercase text-stone-400 font-bold">Was ist in diesem Jahr Wichtiges geschehen?</label>
                                  <textarea
                                    value={milestone.description}
                                    onChange={(e) => updateHistory(hIdx, "description", e.target.value)}
                                    rows={3}
                                    className="w-full text-xs font-sans px-3 py-2 bg-white border border-stone-200 rounded-lg focus:border-[#ff4c00] outline-none"
                                  />
                                  <CharacterCount current={(milestone.description || "").length} limit={250} idealMin={40} idealMax={180} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* FORM TRIGGER SAVE/CANCEL CONTROLS BAR */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-100 p-5 rounded-3xl border border-stone-200/50">
                    <div className="text-left">
                      <h5 className="text-xs font-black text-[#121315]">
                        Änderungen online in Ihrer Google-Tabelle speichern?
                      </h5>
                      <p className="text-stone-400 text-[10px] font-semibold mt-0.5 uppercase tracking-wide font-mono">
                        Das Google Sheet wird im Hintergrund synchronisiert und überschrieben
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={handleResetDraft}
                        disabled={!isCmsDirty || isSavingDraft}
                        className="px-5 h-11 bg-white hover:bg-stone-50 border border-stone-200 font-bold text-stone-600 hover:text-stone-900 rounded-full font-sans text-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Verwerfen (Reset)
                      </button>

                      <button
                        onClick={handleSaveDraft}
                        disabled={isSavingDraft || !isCmsDirty}
                        className={`px-6.5 h-11 inline-flex items-center justify-center font-black tracking-widest text-[9.5px] uppercase rounded-full transition-transform active:scale-95 cursor-pointer ${
                          isCmsDirty 
                            ? "bg-[#ff4c00] hover:bg-[#ff4c00]/90 text-white shadow-[0_4px_12px_rgba(255,76,0,0.25)]" 
                            : "bg-stone-200 text-stone-450 cursor-not-allowed"
                        }`}
                      >
                        {isSavingDraft ? (
                          <>
                            <RotateCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Werte werden übertragen...
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 mr-2" />
                            Tabellen-Inhalte jetzt aktualisieren
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      )}

    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border-2 border-red-500 rounded-3xl max-w-2xl mx-auto my-12 text-left space-y-4">
          <h3 className="text-xl font-bold text-red-800">Ups! Ein Fehler ist aufgetreten (Client-Side Crash)</h3>
          <p className="text-sm text-red-700 font-semibold">Das Admin-Interface konnte nicht geladen werden. Folgender Fehler trat auf:</p>
          <pre className="p-4 bg-red-100 rounded-xl overflow-x-auto font-mono text-xs text-red-900 border border-red-200">
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <p className="text-xs text-stone-500 font-medium">Bitte kopieren Sie diese Fehlermeldung, damit wir sie sofort beheben können.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AdminDashboardWithProvider({ userEmail }: { userEmail?: string }) {
  return (
    <ErrorBoundary>
      <CMSProvider userEmail={userEmail}>
        <AdminDashboard />
      </CMSProvider>
    </ErrorBoundary>
  );
}
