import * as FileSystem from "expo-file-system/legacy";
import { runtimeConfig } from "../config/runtimeConfig";
import type { QueuedUpload } from "../types/capture";

export const GOOGLE_DRIVE_SYNC_ENABLED = true;

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

/** Pre-configured shared folder — all uploads land here. */
const TARGET_FOLDER_ID = runtimeConfig.googleDriveFolderId;

// ─── Return the target folder ID ─────────────────────────────────

export async function ensureAppFolder(_accessToken: string): Promise<string> {
  return TARGET_FOLDER_ID;
}

// ─── Upload a single capture to Drive ─────────────────────────────

export type DriveUploadResult = {
  fileId: string;
  fileName: string;
  webViewLink?: string;
};

export async function uploadToGoogleDrive(
  file: QueuedUpload,
  accessToken: string,
  folderId: string,
): Promise<DriveUploadResult> {
  // Read the local file as base64
  const base64Data = await FileSystem.readAsStringAsync(file.localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const mimeType = detectMimeType(file.fileName);

  // Metadata for the file
  const metadata = {
    name: file.fileName,
    parents: [folderId],
    mimeType,
  };

  // Build multipart body
  const boundary = "cuspiscam_boundary_" + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody =
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    "Content-Transfer-Encoding: base64\r\n\r\n" +
    base64Data +
    closeDelimiter;

  const uploadRes = await fetch(
    `${UPLOAD_API}/files?uploadType=multipart&fields=id,name,webViewLink`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );

  if (!uploadRes.ok) {
    const errBody = await uploadRes.text();
    throw new Error(
      `Drive upload failed (${uploadRes.status}): ${errBody.slice(0, 200)}`,
    );
  }

  const result = (await uploadRes.json()) as {
    id: string;
    name: string;
    webViewLink?: string;
  };

  return {
    fileId: result.id,
    fileName: result.name,
    webViewLink: result.webViewLink,
  };
}

// ─── List files in the CuspisCam folder ───────────────────────────

export async function listDriveFiles(
  accessToken: string,
  folderId: string,
  pageSize = 30,
) {
  const query = `'${folderId}' in parents and trashed=false`;
  const res = await fetch(
    `${DRIVE_API}/files?q=${encodeURIComponent(query)}&pageSize=${pageSize}&fields=files(id,name,mimeType,size,createdTime,webViewLink,thumbnailLink)&orderBy=createdTime desc`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    throw new Error(`Drive list failed: ${res.status}`);
  }

  return (await res.json()) as {
    files: {
      id: string;
      name: string;
      mimeType: string;
      size?: string;
      createdTime?: string;
      webViewLink?: string;
      thumbnailLink?: string;
    }[];
  };
}

// ─── Storage quota ────────────────────────────────────────────────

export async function getDriveStorageInfo(accessToken: string) {
  const res = await fetch(
    `${DRIVE_API}/about?fields=storageQuota,user`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    throw new Error(`Drive about failed: ${res.status}`);
  }

  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────

function detectMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
