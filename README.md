# CuspisCam

Clinical dental photography workflow built with Expo and React Native.

CuspisCam standardizes dental image capture by letting the user choose a tooth context and surface, launch the device's native camera, rename the resulting image deterministically, and queue it for Google Drive upload.

## Current Status

This repository is an active MVP.

Implemented today:
- Native camera launch with `expo-image-picker`
- Local file rename and persistence with `expo-file-system`
- Tooth workflow based on arch + tooth type selection
- Surface-based capture flow
- Optional gallery import per surface
- Offline upload queue with `AsyncStorage`
- Google OAuth login
- Manual sync to a predefined Google Drive folder

Still planned or incomplete:
- Patient or session ID input as a filename prefix
- Background sync instead of manual sync only
- More robust upload retry policies and token refresh handling
- Broader QA across device vendors and camera apps

## Tech Stack

- Expo SDK 54
- Expo Router
- React Native
- Zustand
- `expo-image-picker`
- `expo-file-system`
- `expo-auth-session`
- `expo-web-browser`
- Google Drive REST API v3

## File Naming

Captured images are stored locally with filenames in this format:

```text
Tooth-{Arch}-{ToothType}_Surface-{Surface}_{YYYYMMDD-HHMMSS}.jpg
```

Example:

```text
Tooth-Max-Canine_Surface-BF_20260304-104522.jpg
```

## Project Structure

```text
app/                       Expo Router screens
src/components/            UI building blocks
src/config/                Runtime and environment-backed config
src/constants/             Dental domain constants
src/services/              Capture, auth, Drive upload, queue logic
src/store/                 Zustand app state
src/types/                 Shared TypeScript types
DENTAL_GLOSSARY.md         Dental naming reference used by the project
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a local `.env` file from `.env.example`.

```bash
cp .env.example .env
```

Set these values:

- `EXPO_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth client ID for the app
- `EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID`: Target Drive folder ID for uploads
- `EXPO_PUBLIC_EXPO_OWNER`: Expo account owner
- `EXPO_PUBLIC_EXPO_SLUG`: Expo app slug

Notes:
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is not a secret, but it should still be configurable per environment.
- This repository currently includes working defaults for the original project setup, and the environment variables override them when present.

### 3. Start the app

```bash
npx expo start
```

If Metro cache causes stale behavior:

```bash
npx expo start -c
```

## Google Drive Setup

To use uploads on your own Google Cloud project:

1. Create or select a Google Cloud project.
2. Enable the Google Drive API.
3. Configure the OAuth consent screen.
4. Create an OAuth client ID that matches your Expo workflow.
5. Put the client ID into `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
6. Share or create a Drive folder and set its ID in `EXPO_PUBLIC_GOOGLE_DRIVE_FOLDER_ID`.
7. Make sure the signed-in Google account has write access to that folder.

The current upload implementation uses Google Drive multipart upload and sends files to the configured folder as direct children.

## EAS

This repository includes a basic [`eas.json`](./eas.json) with:

- `development`: internal development client build
- `preview`: internal test build
- `production`: production build profile

Example commands:

```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

## Useful Scripts

```bash
npm run start
npm run android
npm run ios
npm run typecheck
```

## Notes

- This app intentionally uses the native OS camera flow via `expo-image-picker` instead of `expo-camera`.
- OAuth and Drive upload behavior can differ between Expo Go and development builds. For reliable end-to-end testing, prefer a development build.
- The app is intended for image capture workflow support, not diagnostic decision-making.

## Related Document

- [Dental Glossary](./DENTAL_GLOSSARY.md)
