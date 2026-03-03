import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback } from "react";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  "90944402860-bdfg85etkj4de1vmp457p4nd3jplbo84.apps.googleusercontent.com";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const TOKEN_STORAGE_KEY = "@cuspiscam/google-token";

/**
 * The redirect URI registered in Google Cloud Console.
 * Expo's auth proxy at auth.expo.io forwards the token back to the app
 * via a deep-link, so Google only sees this https:// URL.
 */
const PROXY_REDIRECT_URI = "https://auth.expo.io/@cuspiscam/cuspiscam";

// ─── Auth result type ───────────────────────────────────────────

export type AuthResult =
  | { type: "success"; accessToken: string; expiresIn: number }
  | { type: "cancel" | "dismiss" | "locked" };

// ─── Persisted token helpers ────────────────────────────────────

export type StoredToken = {
  accessToken: string;
  expiresAt: number; // unix ms
};

export async function getPersistedToken(): Promise<StoredToken | null> {
  try {
    const raw = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    if (Date.now() >= parsed.expiresAt) {
      await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function persistToken(accessToken: string, expiresIn: number) {
  const payload: StoredToken = {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export async function clearPersistedToken() {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

// ─── Auth hook ──────────────────────────────────────────────────

export function useGoogleAuthRequest() {
  /**
   * The deep-link URL the proxy will redirect TO after Google consent.
   * WebBrowser.openAuthSessionAsync listens for this prefix to close the
   * in-app browser automatically.
   */
  const returnUrl = Linking.createURL("expo-auth-session");

  const promptAsync = useCallback(async (): Promise<AuthResult> => {
    // 1️⃣  Build Google OAuth URL — redirect_uri points to the proxy
    const authParams = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: PROXY_REDIRECT_URI,
      response_type: "token",
      scope: SCOPES.join(" "),
      include_granted_scopes: "true",
    });
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;

    // 2️⃣  Wrap with the Expo auth proxy
    const proxyParams = new URLSearchParams({ authUrl, returnUrl });
    const startUrl = `${PROXY_REDIRECT_URI}/start?${proxyParams.toString()}`;

    // 3️⃣  Open system browser — it auto-closes on redirect to returnUrl
    const result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl);

    if (result.type === "success" && result.url) {
      // The proxy converts fragment (#access_token=…) to query params
      const parsed = new URL(result.url);

      // Try query params first (proxy behaviour), then fall back to fragment
      let accessToken = parsed.searchParams.get("access_token");
      let expiresInStr = parsed.searchParams.get("expires_in");

      if (!accessToken && parsed.hash) {
        const fragment = new URLSearchParams(parsed.hash.slice(1));
        accessToken = fragment.get("access_token");
        expiresInStr = fragment.get("expires_in");
      }

      if (accessToken) {
        return {
          type: "success",
          accessToken,
          expiresIn: expiresInStr ? parseInt(expiresInStr, 10) : 3600,
        };
      }
    }

    return { type: (result.type ?? "cancel") as "cancel" | "dismiss" | "locked" };
  }, [returnUrl]);

  return { promptAsync };
}

// ─── Quick token validation ─────────────────────────────────────

export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${accessToken}`,
    );
    return res.ok;
  } catch {
    return false;
  }
}
