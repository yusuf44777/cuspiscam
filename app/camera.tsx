import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCameraFormat,
  PhotoFile,
  CameraProps,
} from "react-native-vision-camera";
import Reanimated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

// ─── Types ──────────────────────────────────────────────────────

type ExposureStep = { label: string; value: number };
type ISOStep = { label: string; value: number };
type WBPreset = { label: string; temp: number };
type SpeedStep = { label: string; value: number };

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

// ─── Preset values ──────────────────────────────────────────────

const EXPOSURE_STEPS: ExposureStep[] = [
  { label: "-2", value: -2 },
  { label: "-1.5", value: -1.5 },
  { label: "-1", value: -1 },
  { label: "-0.5", value: -0.5 },
  { label: "0", value: 0 },
  { label: "+0.5", value: 0.5 },
  { label: "+1", value: 1 },
  { label: "+2", value: 2 },
];

const ISO_STEPS: ISOStep[] = [
  { label: "Oto", value: -1 },
  { label: "50", value: 50 },
  { label: "100", value: 100 },
  { label: "200", value: 200 },
  { label: "400", value: 400 },
  { label: "800", value: 800 },
];

const WB_PRESETS: WBPreset[] = [
  { label: "Oto", temp: -1 },
  { label: "5000K", temp: 5000 },
  { label: "☀️ 5500", temp: 5500 },
  { label: "☁️ 6500", temp: 6500 },
  { label: "💡 3200", temp: 3200 },
  { label: "🔦 4000", temp: 4000 },
];

const SPEED_STEPS: SpeedStep[] = [
  { label: "Oto", value: -1 },
  { label: "1/60", value: 60 },
  { label: "1/125", value: 125 },
  { label: "1/250", value: 250 },
  { label: "1/500", value: 500 },
  { label: "1/1000", value: 1000 },
];

const ZOOM_LEVELS = [1, 1.5, 2, 3];

// ─── Screen ─────────────────────────────────────────────────────

export default function ProCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tooth: string; surface: string; label: string }>();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");

  // ── Best quality format: max photo resolution, ISO range including 50 ──
  const format = useCameraFormat(device, [
    { photoResolution: "max" },
    { iso: 50 },
    { photoHdr: true },
  ]);

  const cameraRef = useRef<Camera>(null);

  // ── Pro controls state ── (Defaults: ISO 50, 1/125s, EV -2, Manual Focus, WB 5000K)
  const [exposureIdx, setExposureIdx] = useState(0); // EV -2
  const [isoIdx, setIsoIdx] = useState(1); // ISO 50
  const [wbIdx, setWbIdx] = useState(1); // 5000K
  const [speedIdx, setSpeedIdx] = useState(2); // 1/125s
  const [zoomIdx, setZoomIdx] = useState(0); // 1x
  const [flash, setFlash] = useState<"off" | "on">("off");
  const [focusMode, setFocusMode] = useState<"manual" | "auto">("manual");
  const [isTaking, setIsTaking] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  const zoom = useSharedValue(1);

  // ── Permission ────────────────────────────
  useEffect(() => {
    if (!hasPermission) {
      void requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // ── Derived values ────────────────────────
  const currentISO = ISO_STEPS[isoIdx].value;
  const currentWB = WB_PRESETS[wbIdx].temp;
  const currentSpeed = SPEED_STEPS[speedIdx].value;
  const currentZoom = ZOOM_LEVELS[zoomIdx];

  // Clamp exposure to the device's supported range
  const rawExposure = EXPOSURE_STEPS[exposureIdx].value;
  const currentExposure = device
    ? Math.max(device.minExposure, Math.min(device.maxExposure, rawExposure))
    : rawExposure;

  // Check if format supports HDR
  const supportsHdr = format?.supportsPhotoHdr ?? false;

  // ── Native Camera2 manual values ──────────
  // Convert shutter speed fraction to nanoseconds: 1/125s = 8,000,000 ns
  const shutterSpeedNs = currentSpeed > 0
    ? Math.round(1_000_000_000 / currentSpeed)
    : -1;

  useEffect(() => {
    zoom.value = withTiming(currentZoom, { duration: 200 });
  }, [currentZoom, zoom]);

  const animatedProps = useAnimatedProps<CameraProps>(() => ({
    zoom: zoom.value,
  }));

  // ── Take photo ────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isTaking) return;
    setIsTaking(true);

    try {
      const photo: PhotoFile = await cameraRef.current.takePhoto({
        flash: flash,
        enableShutterSound: true,
      });

      // Navigate back with photo path
      router.back();
      // Small delay to let navigation complete, then pass data via store
      setTimeout(() => {
        const { useCaptureStore } = require("../src/store/useCaptureStore");
        useCaptureStore.getState().setProCameraResult({
          path: photo.path,
          width: photo.width,
          height: photo.height,
          tooth: params.tooth ?? "",
          surface: params.surface ?? "",
        });
      }, 100);
    } catch (e) {
      console.error("Photo capture failed:", e);
    } finally {
      setIsTaking(false);
    }
  }, [isTaking, flash, router, params]);

  // ── Focus on tap ──────────────────────────
  const handleFocusTap = useCallback(
    async (evt: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!cameraRef.current) return;
      const { locationX, locationY } = evt.nativeEvent;
      setFocusPoint({ x: locationX, y: locationY });
      try {
        await cameraRef.current.focus({ x: locationX, y: locationY });
      } catch {
        // some devices don't support focus
      }
      setTimeout(() => setFocusPoint(null), 1500);
    },
    [],
  );

  // ── Cycle helpers ─────────────────────────
  const cycleExposure = () =>
    setExposureIdx((i) => (i + 1) % EXPOSURE_STEPS.length);
  const cycleISO = () => setIsoIdx((i) => (i + 1) % ISO_STEPS.length);
  const cycleWB = () => setWbIdx((i) => (i + 1) % WB_PRESETS.length);
  const cycleSpeed = () => setSpeedIdx((i) => (i + 1) % SPEED_STEPS.length);
  const cycleZoom = () => setZoomIdx((i) => (i + 1) % ZOOM_LEVELS.length);
  const toggleFlash = () => setFlash((f) => (f === "off" ? "on" : "off"));
  const toggleFocus = () => setFocusMode((m) => (m === "manual" ? "auto" : "manual"));

  // ── Early returns ─────────────────────────
  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Kamera izni bekleniyor...</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>Kamera cihazı bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera preview */}
      <Pressable style={styles.preview} onPress={handleFocusTap as any}>
        <ReanimatedCamera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          device={device}
          format={format}
          isActive={true}
          photo={true}
          photoHdr={supportsHdr}
          photoQualityBalance="quality"
          exposure={currentExposure}
          animatedProps={animatedProps}
          enableZoomGesture={true}
          lowLightBoost={false}
          // @ts-ignore — native props added by withManualCameraControls plugin
          manualISO={currentISO}
          manualShutterSpeed={shutterSpeedNs}
          manualWhiteBalance={currentWB}
          manualFocusMode={focusMode}
        />

        {/* Focus indicator */}
        {focusPoint && (
          <View
            style={[
              styles.focusRing,
              { left: focusPoint.x - 30, top: focusPoint.y - 30 },
            ]}
          />
        )}

        {/* Top info bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>✕</Text>
          </Pressable>
          <View style={styles.topInfo}>
            <Text style={styles.topInfoText} numberOfLines={1}>
              {params.label ?? `${params.tooth} · ${params.surface}`}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>
      </Pressable>

      {/* Pro controls panel */}
      <View style={styles.controlsPanel}>
        {/* Row 1: ISO / SPEED / EV */}
        <View style={styles.controlRow}>
          <Pressable onPress={cycleISO} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>ISO</Text>
            <Text style={styles.controlValue}>
              {ISO_STEPS[isoIdx].label}
            </Text>
          </Pressable>

          <Pressable onPress={cycleSpeed} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>SPEED</Text>
            <Text style={styles.controlValue}>
              {SPEED_STEPS[speedIdx].label}
            </Text>
          </Pressable>

          <Pressable onPress={cycleExposure} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>EV</Text>
            <Text style={styles.controlValue}>
              {EXPOSURE_STEPS[exposureIdx].label}
            </Text>
          </Pressable>

          <Pressable onPress={toggleFocus} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>FOCUS</Text>
            <Text style={[styles.controlValue, focusMode === "manual" && styles.controlActive]}>
              {focusMode === "manual" ? "MF" : "AF"}
            </Text>
          </Pressable>

          <Pressable onPress={cycleWB} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>WB</Text>
            <Text style={styles.controlValue}>
              {WB_PRESETS[wbIdx].label}
            </Text>
          </Pressable>
        </View>

        {/* Row 2: ZOOM / FLASH */}
        <View style={styles.controlRow}>
          <Pressable onPress={cycleZoom} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>ZOOM</Text>
            <Text style={styles.controlValue}>{currentZoom}x</Text>
          </Pressable>

          <Pressable onPress={toggleFlash} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>FLAŞ</Text>
            <Text style={styles.controlValue}>
              {flash === "on" ? "⚡" : "○"}
            </Text>
          </Pressable>
        </View>

        {/* Row 2: Capture button */}
        <View style={styles.captureRow}>
          <Pressable
            onPress={handleCapture}
            disabled={isTaking}
            style={({ pressed }) => [
              styles.captureBtn,
              pressed && styles.captureBtnPressed,
              isTaking && styles.captureBtnDisabled,
            ]}
          >
            <View style={styles.captureInner} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  permText: {
    color: "#fff",
    fontSize: 16,
  },
  preview: {
    flex: 1,
  },
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 24,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  topInfo: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  topInfoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: "hidden",
  },
  focusRing: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  controlsPanel: {
    backgroundColor: "#111",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    paddingTop: 12,
    gap: 16,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 8,
  },
  controlBtn: {
    alignItems: "center",
    gap: 4,
    minWidth: 52,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  controlLabel: {
    color: "#8AD4E3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  controlValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  controlActive: {
    color: "#FFD700",
  },
  captureRow: {
    alignItems: "center",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  captureBtnPressed: {
    opacity: 0.8,
  },
  captureBtnDisabled: {
    opacity: 0.4,
  },
  captureInner: {
    flex: 1,
    alignSelf: "stretch",
    borderRadius: 999,
    backgroundColor: "#fff",
  },
});
