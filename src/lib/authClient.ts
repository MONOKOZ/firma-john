/**
 * authClient.ts — client-seitiges Google-Login NUR zur Identität.
 *
 * signInWithPopup(Google) ohne Sheets-Scopes → ID-Token. Das Token geht an
 * /api/auth/session; der Server verifiziert + setzt das 30-Tage-Cookie.
 * KEIN Sheets-Token mehr im Browser.
 */
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

function firebaseAuth() {
  const cfg: any = (firebaseConfig as any).default ?? firebaseConfig;
  const app = getApps().length > 0 ? getApp() : initializeApp(cfg);
  return getAuth(app);
}

/** Öffnet den Google-Login-Popup und gibt das Firebase-ID-Token zurück. */
export async function signInWithGoogle(): Promise<string> {
  const auth = firebaseAuth();
  const provider = new GoogleAuthProvider();
  // Bewusst KEINE Sheets-/Drive-Scopes — nur Identität.
  const result = await signInWithPopup(auth, provider);
  return await result.user.getIdToken();
}
