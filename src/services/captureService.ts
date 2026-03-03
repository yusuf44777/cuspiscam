import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import type { SurfaceId } from "../constants/dental";
import type { CaptureRecord } from "../types/capture";
import { buildCaptureFileName, sanitizeFileSegment } from "../utils/formatting";

type CaptureDentalPhotoParams = {
  patientId?: string;
  sessionId: string;
  tooth: string;
  surfaceId: SurfaceId;
};

const CAPTURE_DIRECTORY_NAME = "captures";

export async function captureDentalPhoto({
  patientId,
  sessionId,
  tooth,
  surfaceId,
}: CaptureDentalPhotoParams): Promise<CaptureRecord | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Camera permission is required to open the native camera app.");
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
    allowsEditing: false,
    exif: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const capturedAt = new Date().toISOString();
  const extension = detectExtension(asset.uri, asset.fileName);
  const fileName = buildCaptureFileName({
    sessionId,
    tooth,
    surfaceId,
    capturedAt,
    extension,
  });
  const localUri = await persistCapturedAsset(asset.uri, fileName);

  return {
    id: createCaptureId(capturedAt, tooth, surfaceId),
    patientId: patientId ? sanitizeFileSegment(patientId) : undefined,
    sessionId: sanitizeFileSegment(sessionId),
    tooth,
    surfaceId,
    capturedAt,
    fileName,
    localUri,
  };
}

async function persistCapturedAsset(sourceUri: string, fileName: string) {
  const directoryUri = await ensureCaptureDirectory();
  const destinationUri = `${directoryUri}/${fileName}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
}

async function ensureCaptureDirectory() {
  if (!FileSystem.documentDirectory) {
    throw new Error("Document storage is unavailable on this device.");
  }

  const directoryUri = `${FileSystem.documentDirectory}${CAPTURE_DIRECTORY_NAME}`;
  const directoryInfo = await FileSystem.getInfoAsync(directoryUri);

  if (!directoryInfo.exists) {
    await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });
  }

  return directoryUri;
}

function detectExtension(uri: string, fileName?: string | null) {
  const source = fileName ?? uri;
  const match = source.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);

  if (!match) {
    return "jpg";
  }

  return sanitizeFileSegment(match[1].toLowerCase()) || "jpg";
}

function createCaptureId(capturedAt: string, tooth: string, surfaceId: SurfaceId) {
  const compactTime = capturedAt.replace(/[^0-9]/g, "");
  return `${compactTime}-${tooth}-${surfaceId}`;
}

