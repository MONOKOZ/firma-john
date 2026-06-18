import React, { useState } from "react";
import { signInWithGoogle } from "../lib/authClient";

/**
 * LoginScreen — Google-Login (nur Identität) → /api/auth/session → Reload.
 * Wird von admin.astro gezeigt, solange keine gültige Session besteht.
 */
export default function LoginScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      const idToken = await signInWithGoogle();
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(data?.error || `Login fehlgeschlagen (${res.status}).`);
    } catch (e: any) {
      setError(e?.code === "auth/popup-closed-by-user" ? "Login abgebrochen." : (e?.message || "Login fehlgeschlagen."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-7">
      <div className="h-16 w-16 bg-[#ff4c00]/10 rounded-full flex items-center justify-center mx-auto border border-[#ff4c00]/15">
        <svg viewBox="0 0 48 48" className="w-8 h-8">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        </svg>
      </div>
      <div className="space-y-2">
        <h2 className="font-serif text-2xl font-black text-[#121315]">Meister-Backend</h2>
        <p className="text-stone-500 text-sm font-semibold max-w-xs mx-auto">
          Bitte mit deinem freigeschalteten Google-Konto anmelden, um die Inhalte zu verwalten.
        </p>
      </div>
      <button
        onClick={handleLogin}
        disabled={busy}
        className="inline-flex items-center justify-center bg-white border border-stone-300 rounded-xl px-6 h-12 hover:shadow-sm active:bg-stone-50/50 transition-all cursor-pointer disabled:opacity-50 gap-3"
      >
        {busy ? (
          <span className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg viewBox="0 0 48 48" className="w-[18px] h-[18px]">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
        )}
        <span className="font-semibold text-stone-700 text-sm">
          {busy ? "Anmeldung läuft…" : "Mit Google anmelden"}
        </span>
      </button>
      {error && (
        <p className="text-xs font-semibold text-red-600 max-w-xs mx-auto">{error}</p>
      )}
    </div>
  );
}
