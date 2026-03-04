import Constants from "expo-constants";

const DEFAULT_GOOGLE_CLIENT_ID =
  "90944402860-bdfg85etkj4de1vmp457p4nd3jplbo84.apps.googleusercontent.com";
const DEFAULT_DRIVE_FOLDER_ID = "1M4bPV0gFeyhkbt6l6iwNJCKJUCK1Jeim";

const expoOwner =
  Constants.expoConfig?.owner ??
  process.env.EXPO_PUBLIC_EXPO_OWNER ??
  "cuspiscam";
const expoSlug =
  Constants.expoConfig?.slug ??
  process.env.EXPO_PUBLIC_EXPO_SLUG ??
  "cuspiscam";

export const runtimeConfig = {
  expoOwner,
  expoSlug,
  googleClientId:
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? DEFAULT_GOOGLE_CLIENT_ID,
  googleDriveFolderId:
    process.env.EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID ??
    DEFAULT_DRIVE_FOLDER_ID,
  proxyRedirectUri: `https://auth.expo.io/@${expoOwner}/${expoSlug}`,
};

