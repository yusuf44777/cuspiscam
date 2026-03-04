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
type FocusMode = "auto" | "locked";

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

// ─── Preset values ──────────────────────────────────────────────

const EXPOSURE_STEPS: ExposureStep[] = [
  { label: "-2", value: -2 },
  { label: "-1", value: -1 },
  { label: "0", value: 0 },
  { label: "+1", value: 1 },
  { label: "+2", value: 2 },
];

const ISO_STEPS: ISOStep[] = [
  { label: "Oto", value: -1 },
  { label: "100", value: 100 },
  { label: "200", value: 200 },
  { label: "400", value: 400 },
  { label: "800", value: 800 },
];

const WB_PRESETS: WBPreset[] = [
  { label: "Oto", temp: -1 },
  { label: "☀️", temp: 5500 },
  { label: "☁️", temp: 6500 },
  { label: "💡", temp: 3200 },
  { label: "🔦", temp: 4000 },
];

const ZOOM_LEVELS = [1, 1.5, 2, 3];

// ─── Screen ─────────────────────────────────────────────────────

export default function ProCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tooth: string; surface: string; label: string }>();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");

  const cameraRef = useRef<Camera>(null);

  // ── Pro controls state ────────────────────
  const [exposureIdx, setExposureIdx] = useState(2); // default 0
  const [isoIdx, setIsoIdx] = useState(0); // default Auto
  const [wbIdx, setWbIdx] = useState(0); // default Auto
  const [zoomIdx, setZoomIdx] = useState(0); // default 1x
  const [flash, setFlash] = useState<"off" | "on">("off");
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
  const currentExposure = EXPOSURE_STEPS[exposureIdx].value;
  const currentISO = ISO_STEPS[isoIdx].value;
  const currentWB = WB_PRESETS[wbIdx].temp;
  const currentZoom = ZOOM_LEVELS[zoomIdx];

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
  const cycleZoom = () => setZoomIdx((i) => (i + 1) % ZOOM_LEVELS.length);
  const toggleFlash = () => setFlash((f) => (f === "off" ? "on" : "off"));

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
          isActive={true}
          photo={true}
          exposure={currentExposure}
          animatedProps={animatedProps}
          enableZoomGesture={true}
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
        {/* Row 1: EV / ISO / WB */}
        <View style={styles.controlRow}>
          <Pressable onPress={cycleExposure} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>EV</Text>
            <Text style={styles.controlValue}>
              {EXPOSURE_STEPS[exposureIdx].label}
            </Text>
          </Pressable>

          <Pressable onPress={cycleISO} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>ISO</Text>
            <Text style={styles.controlValue}>
              {ISO_STEPS[isoIdx].label}
            </Text>
          </Pressable>

          <Pressable onPress={cycleWB} style={styles.controlBtn}>
            <Text style={styles.controlLabel}>WB</Text>
            <Text style={styles.controlValue}>
              {WB_PRESETS[wbIdx].label}
            </Text>
          </Pressable>

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
