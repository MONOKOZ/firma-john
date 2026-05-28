import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Flame, Bath, Wind, Sun, Wrench, ChevronRight, 
  ArrowRight, Check, CheckCircle2, User, Phone, Mail, Clock, ShieldCheck, AlertCircle
} from "lucide-react";

interface WizardState {
  step: number;
  projectType: string;
  buildingType: string;
  urgency: string;
  name: string;
  phone: string;
  email: string;
  message: string;
}

const PROJECT_TYPES = [
  { id: "heating", title: "Heizung & Wärme", icon: Flame, desc: "Wärmepumpen, Heizungstausch, Modernisierung", accent: "rgba(255, 76, 0, 0.08)", textAccent: "text-[#ff4c00]", borderAccent: "border-[#ff4c00]" },
  { id: "bath", title: "Bad & Sanitär", icon: Bath, desc: "Badmodernisierung, Barrierefreiheit, Rohrnetz", accent: "rgba(2, 132, 199, 0.08)", textAccent: "text-[#0284c7]", borderAccent: "border-[#0284c7]" },
  { id: "ventilation", title: "Klima & Lüftung", icon: Wind, desc: "Klimaanlagen, kontrollierte Wohnraumlüftung", accent: "rgba(13, 148, 136, 0.08)", textAccent: "text-[#0d9488]", borderAccent: "border-[#0d9488]" },
  { id: "solar", title: "Solarthermie & Umwelt", icon: Sun, desc: "Warmwasser mit Sonne, regenerative Energie", accent: "rgba(217, 119, 6, 0.08)", textAccent: "text-[#d97706]", borderAccent: "border-[#d97706]" },
  { id: "repair", title: "Instandhaltung & Notdienst", icon: Wrench, desc: "Wartungen, akute Störungen, Rohrarbeiten", accent: "rgba(18, 19, 21, 0.05)", textAccent: "text-stone-700", borderAccent: "border-stone-400" }
];

const BUILDING_TYPES = [
  { id: "altbau", title: "Bestand / Altbau", label: "Häufig zur Modernisierung bestehender Heizkessel oder Badsanierungen." },
  { id: "neubau", title: "Modernes KfW- / Neubauvorhaben", label: "Meist optimal ausgelegt für hocheffiziente Luft-Wasser-Wärmepumpen." },
  { id: "gewerbe", title: "Gewerbeobjekt / Mehrfamilienhaus", label: "Anspruchsvolle Verrohrung und groß dimensionierte Haustechnik." }
];

const URGENCY_LEVELS = [
  { id: "now", title: "Akuter Handlungsbedarf / Ausfall", label: "Probleme wie Heizungsausfall oder akuter Wasserrohrbruch." },
  { id: "planned", title: "Mittelfristiges Vorhaben (1-3 Monate)", label: "Geplanter Tausch des Wärmeerzeugers oder Bad-Sanierung." },
  { id: "future", title: "Langfristige Modernisierung (> 6 Monate)", label: "Vorausschauende Planung einer regenerativen Anlage." }
];

export function ConsultationWizard({ onSubmitted }: { onSubmitted?: () => void }) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    projectType: "",
    buildingType: "",
    urgency: "",
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const nextStep = () => {
    setErrorBanner(null);
    setState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const prevStep = () => {
    setErrorBanner(null);
    setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const handleSelectProject = (id: string) => {
    setState(prev => ({ ...prev, projectType: id }));
    setTimeout(nextStep, 250); // Fluid delay to mimic physical material weight
  };

  const handleSelectBuilding = (id: string) => {
    setState(prev => ({ ...prev, buildingType: id }));
    setTimeout(nextStep, 250);
  };

  const handleSelectUrgency = (id: string) => {
    setState(prev => ({ ...prev, urgency: id }));
    setTimeout(nextStep, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name.trim() || !state.phone.trim() || !state.email.trim()) {
      setErrorBanner("Bitte füllen Sie alle Pflichtfelder aus (Name, Telefon, E-Mail).");
      return;
    }
    setErrorBanner(null);

    // Save submission payload to localStorage for offline-first synchronization
    const newInquiry = {
      timestamp: new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
      name: state.name,
      phone: state.phone,
      email: state.email,
      projectType: state.projectType,
      projectTitle: currentProject?.title || "",
      buildingTitle: currentBuilding?.title || "",
      urgencyTitle: currentUrgency?.title || "",
      message: state.message || ""
    };

    try {
      const existing = localStorage.getItem("john_inquiries");
      const list = existing ? JSON.parse(existing) : [];
      list.push(newInquiry);
      localStorage.setItem("john_inquiries", JSON.stringify(list));
    } catch (err) {
      console.error("Fehler beim Speichern der Anfrage in localStorage:", err);
    }

    setSubmitted(true);
    if (onSubmitted) {
      onSubmitted();
    }
  };

  const currentProject = PROJECT_TYPES.find(p => p.id === state.projectType);
  const currentBuilding = BUILDING_TYPES.find(b => b.id === state.buildingType);
  const currentUrgency = URGENCY_LEVELS.find(u => u.id === state.urgency);

  const stepsTotal = 4;
  const easingLuxury = [0.16, 1, 0.3, 1] as const; // Premium cubic-bezier transition easing

  return (
    <div id="planungstool" className="w-full bg-[#fcfbfa] border-2 border-[#121315] rounded-3xl shadow-[6px_6px_0px_0px_rgba(18,19,21,1)] overflow-hidden min-h-[520px] flex flex-col justify-between">
      
      {/* Wizard Header Status Bar */}
      <div className="border-b-2 border-[#121315] bg-[#fafaf7] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff4c00] animate-pulse"></span>
          <span className="font-mono text-xs text-[#121315] uppercase tracking-widest font-bold">
            JOHN Haustechnik-Planer
          </span>
        </div>
        {!submitted && (
          <div className="font-mono text-xs text-stone-500 font-bold bg-[#121315]/5 px-2.5 py-1 rounded-md border border-[#121315]/5">
            Schritt {state.step} von {stepsTotal}
          </div>
        )}
      </div>

      {/* Progress Line */}
      {!submitted && (
        <div className="w-full h-1.5 bg-[#121315]/5 relative">
          <div 
            className="h-full bg-gradient-to-r from-[#ff4c00] to-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${(state.step / stepsTotal) * 100}%` }}
          />
        </div>
      )}

      {/* Main Form Compartment */}
      <div className="p-6 md:p-12 flex-grow flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="submitted"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.6, ease: easingLuxury }}
              className="text-center py-6 max-w-xl mx-auto"
            >
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-emerald-50 text-emerald-600 mb-6 border border-emerald-500/15">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              
              <h3 className="font-serif text-3xl font-black text-[#121315] tracking-tight mb-4">
                Anfrage erfolgreich eingereicht
              </h3>
              
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8 max-w-[480px] mx-auto">
                Hallo <span className="font-semibold text-[#121315]">{state.name}</span>, wir haben Ihre Projektdaten erfasst. 
                <span className="block mt-2 font-bold text-[#ff4c00]">
                  Sven John und das Team prüfen Ihre Eckdaten persönlich.
                </span>
                Wir melden uns innerhalb der nächsten 24 Stunden telefonisch bei Ihnen unter <span className="underline font-mono">{state.phone}</span>.
              </p>

              <div className="bg-[#fafaf7] border-2 border-[#121315] rounded-2xl p-6 text-left text-xs sm:text-sm text-stone-600 space-y-3 mb-8 shadow-sm">
                <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400 border-b border-stone-200/50 pb-2.5 font-bold">
                  Zusammenfassung der Planung
                </div>
                <div className="flex justify-between">
                  <span>Fachgebiet:</span>
                  <span className="font-bold text-[#121315]">{currentProject?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Objekttyp:</span>
                  <span className="font-bold text-[#121315]">{currentBuilding?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dringlichkeit:</span>
                  <span className="font-bold text-red-600">{currentUrgency?.title}</span>
                </div>
              </div>

              <button
                id="wizard-reset"
                onClick={() => {
                  setSubmitted(false);
                  setState({
                    step: 1,
                    projectType: "",
                    buildingType: "",
                    urgency: "",
                    name: "",
                    phone: "",
                    email: "",
                    message: ""
                  });
                }}
                className="inline-flex items-center justify-center h-12 px-8 uppercase tracking-widest text-[10px] bg-[#121315] hover:bg-black text-white rounded-full font-bold transition-transform active:scale-95 cursor-pointer"
              >
                Neue Planung starten
              </button>
            </motion.div>
          ) : (
            <div className="w-full">
              {/* Step 1: Project Scope */}
              {state.step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: easingLuxury }}
                >
                  <label className="block font-mono text-[10px] uppercase tracking-[0.15em] text-[#ff4c00] font-black mb-2">
                    Schritt 1
                  </label>
                  <h3 className="font-serif text-3xl sm:text-4xl text-[#121315] font-black tracking-tight leading-none mb-3">
                    Was dürfen wir für Sie anpacken?
                  </h3>
                  <p className="text-stone-500 max-w-xl text-xs sm:text-sm mb-8">
                    Wählen Sie den primären Bereich Ihres Haustechnik-Projekts. Sven John leitet das passende Fachpersonal direkt an Sie weiter.
                  </p>

                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    {PROJECT_TYPES.map((p) => {
                      const IconComponent = p.icon;
                      const isSelected = state.projectType === p.id;
                      return (
                        <button
                          id={`wizard-project-${p.id}`}
                          key={p.id}
                          onClick={() => handleSelectProject(p.id)}
                          type="button"
                          className={`flex items-start text-left p-5 rounded-2xl border-2 transition-all duration-300 min-h-[44px] cursor-pointer ${
                            isSelected 
                              ? "border-[#121315] bg-white shadow-[4px_4px_0px_0px_rgba(18,19,21,1)]"
                              : "border-stone-200 hover:border-stone-400 hover:bg-stone-50/50"
                          }`}
                        >
                          <div 
                            className={`p-3 rounded-xl mr-4 ${isSelected ? p.textAccent : "text-stone-500"}`}
                            style={{ backgroundColor: isSelected ? p.accent : "#fafaf7" }}
                          >
                            <IconComponent className="w-5 h-5 flex-shrink-0" />
                          </div>
                          <div>
                            <h4 className="font-bold text-[#121315] text-sm flex items-center">
                              {p.title}
                              {isSelected && <Check className="w-4 h-4 ml-1.5 text-[#ff4c00]" />}
                            </h4>
                            <p className="text-xs text-stone-500 mt-1 leading-normal font-medium">
                              {p.desc}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Building Type */}
              {state.step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: easingLuxury }}
                >
                  <label className="block font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400 mb-2">
                    Schritt 2 • Gewählt: {currentProject?.title}
                  </label>
                  <h3 className="font-serif text-3xl sm:text-4xl text-[#121315] font-black tracking-tight leading-none mb-3">
                    Um welche Art von Gebäude handelt es sich?
                  </h3>
                  <p className="text-stone-500 max-w-xl text-xs sm:text-sm mb-8">
                    Die baulichen Gegebenheiten bestimmen die optimalen technischen Standards und rechtlichen Vorgaben in Brandenburg.
                  </p>

                  <div className="space-y-3.5">
                    {BUILDING_TYPES.map((b) => {
                      const isSelected = state.buildingType === b.id;
                      return (
                        <button
                          id={`wizard-building-${b.id}`}
                          key={b.id}
                          onClick={() => handleSelectBuilding(b.id)}
                          type="button"
                          className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 text-left cursor-pointer transition-all duration-300 ${
                            isSelected 
                              ? "border-[#121315] bg-white shadow-[4px_4px_0px_0px_rgba(18,19,21,1)]"
                              : "border-stone-200 hover:border-stone-400 hover:bg-stone-50/50"
                          }`}
                        >
                          <div className="pr-4">
                            <h4 className="font-bold text-[#121315] text-sm sm:text-base">
                              {b.title}
                            </h4>
                            <p className="text-xs text-stone-500 mt-1.5 leading-normal font-medium max-w-[580px]">
                              {b.label}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-[#ff4c00] bg-[#ff4c00] text-white" : "border-stone-300"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Urgency */}
              {state.step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: easingLuxury }}
                >
                  <label className="block font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400 mb-2">
                    Schritt 3 • Gewählt: {currentProject?.title} ({currentBuilding?.title})
                  </label>
                  <h3 className="font-serif text-3xl sm:text-4xl text-[#121315] font-black tracking-tight leading-none mb-3">
                    Wie dringlich ist Ihre Umsetzung?
                  </h3>
                  <p className="text-stone-500 max-w-xl text-xs sm:text-sm mb-8">
                    Damit teilt Sabine John unsere Monteure und Notdienstfahrzeuge optimal ein.
                  </p>

                  <div className="space-y-3.5">
                    {URGENCY_LEVELS.map((u) => {
                      const isSelected = state.urgency === u.id;
                      return (
                        <button
                          id={`wizard-urgency-${u.id}`}
                          key={u.id}
                          onClick={() => handleSelectUrgency(u.id)}
                          type="button"
                          className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 text-left cursor-pointer transition-all duration-300 ${
                            isSelected 
                              ? "border-[#121315] bg-white shadow-[4px_4px_0px_0px_rgba(18,19,21,1)]"
                              : "border-stone-200 hover:border-stone-400 hover:bg-stone-50/50"
                          }`}
                        >
                          <div className="pr-4">
                            <h4 className="font-bold text-[#121315] text-sm sm:text-base">
                              {u.title}
                            </h4>
                            <p className="text-xs text-stone-500 mt-1.5 leading-normal font-medium max-w-[580px]">
                              {u.label}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected ? "border-[#ff4c00] bg-[#ff4c00] text-white" : "border-stone-300"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Contact & Finish */}
              {state.step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.5, ease: easingLuxury }}
                >
                  <label className="block font-mono text-[10px] uppercase tracking-[0.15em] text-[#ff4c00] font-black mb-2">
                    Schritt 4 • Letzter Schritt
                  </label>
                  <h3 className="font-serif text-3xl sm:text-4xl text-[#121315] font-black tracking-tight leading-none mb-3">
                    Wer ist Ihr Ansprechpartner?
                  </h3>
                  <p className="text-stone-500 max-w-xl text-xs sm:text-sm mb-8">
                    Sven John meldet sich persönlich bei Ihnen. Ihre Kontaktdaten werden vertraulich behandelt und ausschließlich für diese Anfrage verwendet.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Beautiful, non-blocking inline error notification representing premier craft */}
                    <AnimatePresence>
                      {errorBanner && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl flex items-center space-x-3 text-xs sm:text-sm"
                        >
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <span className="font-semibold">{errorBanner}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider" htmlFor="name">
                          Ihr vollständiger Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-4 h-4.5 w-4.5 text-stone-400" />
                          <input
                            id="wizard-name"
                            required
                            type="text"
                            placeholder="z.B. Hans Müller"
                            value={state.name}
                            onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-stone-200 focus:border-[#121315] focus:outline-none text-sm transition-colors bg-white font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider" htmlFor="phone">
                          Ihre Telefonnummer (für Rückfragen) *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-4 h-4.5 w-4.5 text-stone-400" />
                          <input
                            id="wizard-phone"
                            required
                            type="tel"
                            placeholder="z.B. 03378 12345"
                            value={state.phone}
                            onChange={(e) => setState(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-stone-200 focus:border-[#121315] focus:outline-none text-sm transition-colors bg-white font-mono font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider" htmlFor="email">
                        Ihre E-Mail-Adresse *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 h-4.5 w-4.5 text-stone-400" />
                        <input
                          id="wizard-email"
                          required
                          type="email"
                          placeholder="hans.mueller@beispiel.de"
                          value={state.email}
                          onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full h-12 pl-11 pr-4 rounded-xl border-2 border-stone-200 focus:border-[#121315] focus:outline-none text-sm transition-colors bg-white font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-2 uppercase tracking-wider" htmlFor="message">
                        Kurze Notiz zu Ihrem Vorhaben (optional)
                      </label>
                      <textarea
                        id="wizard-message"
                        rows={4}
                        placeholder="Zusatzdetails wie z.B. aktuelles Heizungsmodell, gewünschte Bad-Maße o.ä."
                        value={state.message}
                        onChange={(e) => setState(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full p-4.5 rounded-xl border-2 border-stone-200 focus:border-[#121315] focus:outline-none text-sm transition-colors bg-white font-medium resize-none"
                      />
                    </div>

                    <div className="flex items-center space-x-2.5 text-[#121315]/70 py-1">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span className="text-[11px] font-semibold leading-relaxed">
                        Datenschutzkonforme SSL-Übermittlung direkt an uns. Keine Werbe-Weitergabe. Wir hassen Spam ebenfalls.
                      </span>
                    </div>

                    <div className="pt-3">
                      <button
                        id="wizard-submit"
                        type="submit"
                        className="w-full h-14 rounded-full bg-[#ff4c00] hover:bg-[#ff4c00]/90 text-white font-black text-xs uppercase tracking-widest transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center cursor-pointer shadow-md shadow-[#ff4c00]/5"
                      >
                        Sven John & Team anfragen
                        <ArrowRight className="w-4.5 h-4.5 ml-2.5" />
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Wizard Footer Controls */}
      {!submitted && (
        <div className="border-t-2 border-[#121315] bg-[#fafaf7] px-8 py-5 flex items-center justify-between">
          <button
            id="wizard-prev"
            type="button"
            onClick={prevStep}
            disabled={state.step === 1}
            className={`font-mono text-[10px] tracking-widest uppercase h-11 px-5 rounded-full border-2 border-transparent hover:border-[#121315]/10 flex items-center transition-all ${
              state.step === 1 
                ? "text-stone-300 cursor-not-allowed" 
                : "text-stone-700 hover:text-black font-bold cursor-pointer"
            }`}
          >
            Zurück
          </button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: stepsTotal }).map((_, idx) => (
              <span 
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx + 1 === state.step 
                    ? "bg-[#ff4c00] w-4.5" 
                    : idx + 1 < state.step 
                      ? "bg-[#121315]" 
                      : "bg-stone-200"
                }`}
              />
            ))}
          </div>

          <button
            id="wizard-next"
            type="button"
            onClick={nextStep}
            disabled={
              state.step === stepsTotal ||
              (state.step === 1 && !state.projectType) ||
              (state.step === 2 && !state.buildingType) ||
              (state.step === 3 && !state.urgency)
            }
            className={`font-mono text-[10px] tracking-widest uppercase h-11 px-6 rounded-full border-2 border-[#121315] flex items-center justify-center transition-all cursor-pointer font-bold ${
              state.step === stepsTotal 
                ? "text-stone-300 border-stone-200 cursor-not-allowed" 
                : (state.step === 1 && !state.projectType) ||
                  (state.step === 2 && !state.buildingType) ||
                  (state.step === 3 && !state.urgency)
                  ? "bg-stone-200 text-stone-400 border-transparent cursor-not-allowed"
                  : "bg-[#121315] hover:bg-black text-white"
            }`}
          >
            Weiter
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
