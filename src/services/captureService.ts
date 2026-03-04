import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import type { SurfaceId } from "../constants/dental";
import type { CaptureRecord } from "../types/capture";
import { buildCaptureFileName, sanitizeFileSegment } from "../utils/formatting";

type CaptureDentalPhotoParams = {
  patientId?: string;
  tooth: string;
  surfaceId: SurfaceId;
  source?: "camera" | "gallery";
};

const CAPTURE_DIRECTORY_NAME = "captures";

export async function captureDentalPhoto({
  patientId,
  tooth,
  surfaceId,
  source = "camera",
}: CaptureDentalPhotoParams): Promise<CaptureRecord | null> {
  let result: ImagePicker.ImagePickerResult;

  if (source === "gallery") {
    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPermission.granted) {
      throw new Error("Galeri izni gereklidir.");
    }
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
  } else {
    const cameraPermission =
      await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      throw new Error("Kamera izni gereklidir.");
    }
    result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
      exif: false,
    });
  }

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  const capturedAt = new Date().toISOString();
  const extension = detectExtension(asset.uri, asset.fileName);
  const fileName = buildCaptureFileName({
    tooth,
    surfaceId,
    capturedAt,
    extension,
  });
  const localUri = await persistCapturedAsset(asset.uri, fileName);

  return {
    id: createCaptureId(capturedAt, tooth, surfaceId),
    patientId: patientId ? sanitizeFileSegment(patientId) : undefined,
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
    throw new Error("Cihazda dosya depolama alanı kullanılamıyor.");
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

/**
 * Process a photo taken by the pro camera (react-native-vision-camera).
 * The photo file is already on disk at `filePath`; we just need to
 * copy it into the standard captures directory with the correct name.
 */
export async function processProCameraPhoto({
  filePath,
  tooth,
  surfaceId,
}: {
  filePath: string;
  tooth: string;
  surfaceId: SurfaceId;
}): Promise<CaptureRecord> {
  const capturedAt = new Date().toISOString();
  const extension = detectExtension(filePath);
  const fileName = buildCaptureFileName({
    tooth,
    surfaceId,
    capturedAt,
    extension,
  });

  // vision-camera returns a path without file:// prefix
  const sourceUri = filePath.startsWith("file://")
    ? filePath
    : `file://${filePath}`;

  const localUri = await persistCapturedAsset(sourceUri, fileName);

  return {
    id: createCaptureId(capturedAt, tooth, surfaceId),
    tooth,
    surfaceId,
    capturedAt,
    fileName,
    localUri,
  };
}

