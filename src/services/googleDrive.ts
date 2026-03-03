import type { QueuedUpload } from "../types/capture";

export const GOOGLE_DRIVE_SYNC_ENABLED = false;

export type GoogleDriveUploadConfig = {
  accessToken: string;
  folderId: string;
};

export async function uploadToGoogleDrive(
  _file: QueuedUpload,
  _config: GoogleDriveUploadConfig,
) {
  throw new Error(
    "Google Drive integration is not configured in this scaffold yet.",
  );
}

