import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Allow Expo's auth popup to close automatically
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  "90944402860-bdfg85etkj4de1vmp457p4nd3jplbo84.apps.googleusercontent.com";

const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

const TOKEN_STORAGE_KEY = "@cuspiscam/google-token";

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
    // expired?
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
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "cuspiscam",
    path: "redirect",
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    },
    DISCOVERY,
  );

  return { request, response, promptAsync };
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
