import { Stack } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CaptureList } from "../src/components/CaptureList";
import { SectionCard } from "../src/components/SectionCard";
import { StatusBanner } from "../src/components/StatusBanner";
import { SurfaceSelector } from "../src/components/SurfaceSelector";
import { ToothGrid } from "../src/components/ToothGrid";
import type { SurfaceId } from "../src/constants/dental";
import { GOOGLE_DRIVE_SYNC_ENABLED } from "../src/services/googleDrive";
import { captureDentalPhoto } from "../src/services/captureService";
import {
  enqueueUpload,
  getPendingUploadCount,
} from "../src/services/uploadQueue";
import { useCaptureStore } from "../src/store/useCaptureStore";

export default function HomeScreen() {
  const patientIdInput = useCaptureStore((state) => state.patientIdInput);
  const generatedSessionId = useCaptureStore((state) => state.generatedSessionId);
  const selectedTooth = useCaptureStore((state) => state.selectedTooth);
  const recentCaptures = useCaptureStore((state) => state.recentCaptures);
  const pendingCount = useCaptureStore((state) => state.pendingCount);
  const isCapturing = useCaptureStore((state) => state.isCapturing);
  const banner = useCaptureStore((state) => state.banner);
  const setPatientIdInput = useCaptureStore((state) => state.setPatientIdInput);
  const selectTooth = useCaptureStore((state) => state.selectTooth);
  const setPendingCount = useCaptureStore((state) => state.setPendingCount);
  const beginCapture = useCaptureStore((state) => state.beginCapture);
  const finishCapture = useCaptureStore((state) => state.finishCapture);
  const showBanner = useCaptureStore((state) => state.showBanner);
  const clearBanner = useCaptureStore((state) => state.clearBanner);

  const activeSessionId = patientIdInput.trim() || generatedSessionId;

  useEffect(() => {
    void hydrateQueueCount();
  }, []);

  useEffect(() => {
    if (!banner) {
      return undefined;
    }

    const timer = setTimeout(() => {
      clearBanner();
    }, 4000);

    return () => clearTimeout(timer);
  }, [banner, clearBanner]);

  async function hydrateQueueCount() {
    const count = await getPendingUploadCount();
    setPendingCount(count);
  }

  async function handleSurfaceSelection(surfaceId: SurfaceId) {
    if (!selectedTooth || isCapturing) {
      return;
    }

    beginCapture();

    try {
      const result = await captureDentalPhoto({
        patientId: patientIdInput.trim() || undefined,
        sessionId: activeSessionId,
        tooth: selectedTooth,
        surfaceId,
      });

      if (!result) {
        showBanner({
          tone: "info",
          text: "Native camera capture was canceled.",
        });
        return;
      }

      await enqueueUpload(result);
      finishCapture(result);
      await hydrateQueueCount();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to open the camera or save the image.";

      showBanner({
        tone: "error",
        text: message,
      });
    }
  }

  function handleSyncPress() {
    showBanner({
      tone: "info",
      text: "Google Drive upload is scaffolded next. Captures are already queued locally.",
    });
  }

  const selectedSurfaceHint = selectedTooth
    ? `Tooth ${selectedTooth} selected. Tap a surface to launch the native camera app.`
    : "Choose a tooth first. Surface buttons stay disabled until a tooth is selected.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Clinical Capture" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text selectable style={styles.eyebrow}>
            STANDARDIZED DENTAL PHOTOGRAPHY
          </Text>
          <Text selectable style={styles.heroTitle}>
            Native camera workflow with deterministic file naming.
          </Text>
          <Text selectable style={styles.heroBody}>
            Select a session, tooth, and surface. Each confirmed image is copied to
            local app storage and staged for cloud archiving.
          </Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text selectable style={styles.heroStatLabel}>
                Active session
              </Text>
              <Text selectable style={styles.heroStatValue}>
                {activeSessionId}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text selectable style={styles.heroStatLabel}>
                Pending queue
              </Text>
              <Text selectable style={styles.heroStatValue}>
                {pendingCount}
              </Text>
            </View>
          </View>
        </View>

        <StatusBanner banner={banner} onDismiss={clearBanner} />

        <SectionCard
          title="Session ID"
          description="Use a patient or case ID as the filename prefix. Leave blank to keep the generated timestamp session."
        >
          <TextInput
            value={patientIdInput}
            onChangeText={setPatientIdInput}
            placeholder="Optional Patient ID or Case Number"
            placeholderTextColor="#8196A0"
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <View style={styles.sessionPreview}>
            <Text selectable style={styles.sessionPreviewLabel}>
              Current prefix
            </Text>
            <Text selectable style={styles.sessionPreviewValue}>
              {activeSessionId}
            </Text>
            <Text selectable style={styles.sessionPreviewHint}>
              Blank input falls back to {generatedSessionId}
            </Text>
          </View>
        </SectionCard>

        <SectionCard
          title="Tooth Selection"
          description="Adult dentition in FDI notation. Large targets are sized for gloved operation."
        >
          <ToothGrid selectedTooth={selectedTooth} onSelect={selectTooth} />
        </SectionCard>

        <SectionCard title="Surface Selection" description={selectedSurfaceHint}>
          <SurfaceSelector
            selectedTooth={selectedTooth}
            disabled={!selectedTooth || isCapturing}
            onSelect={handleSurfaceSelection}
          />
          {selectedTooth ? (
            <Text selectable style={styles.selectionSummary}>
              Selected tooth {selectedTooth}. Tap any surface button above to
              launch the camera.
            </Text>
          ) : null}
          {isCapturing ? (
            <View style={styles.captureBusyRow}>
              <ActivityIndicator color="#0E788E" />
              <Text selectable style={styles.captureBusyText}>
                Waiting for the native camera result...
              </Text>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Archive Queue"
          description="Every locally saved image is already staged for the Google Drive upload pass. Manual sync stays disabled until auth and multipart upload are wired."
        >
          <View style={styles.queueRow}>
            <View style={styles.queuePill}>
              <Text selectable style={styles.queuePillLabel}>
                Pending uploads
              </Text>
              <Text selectable style={styles.queuePillValue}>
                {pendingCount}
              </Text>
            </View>
            <Pressable
              onPress={handleSyncPress}
              disabled={!GOOGLE_DRIVE_SYNC_ENABLED}
              style={({ pressed }) => [
                styles.syncButton,
                !GOOGLE_DRIVE_SYNC_ENABLED && styles.syncButtonDisabled,
                pressed && GOOGLE_DRIVE_SYNC_ENABLED && styles.syncButtonPressed,
              ]}
            >
              <Text selectable style={styles.syncButtonText}>
                Sync pending uploads
              </Text>
            </Pressable>
          </View>
        </SectionCard>

        <SectionCard
          title="Recent Captures"
          description="Latest locally renamed files from the current session."
        >
          <CaptureList captures={recentCaptures} />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F8F9",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 18,
  },
  hero: {
    borderRadius: 30,
    backgroundColor: "#11313C",
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 12,
    boxShadow: "0 18px 42px rgba(17, 49, 60, 0.18)",
  },
  eyebrow: {
    color: "#94D8E5",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "Avenir Next",
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  heroBody: {
    color: "#D7E7EB",
    fontSize: 15,
    lineHeight: 23,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  heroStat: {
    minWidth: 140,
    flex: 1,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  heroStatLabel: {
    color: "#94D8E5",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  input: {
    minHeight: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CEE0E5",
    backgroundColor: "#F9FCFC",
    paddingHorizontal: 18,
    color: "#11313C",
    fontSize: 17,
    fontWeight: "600",
  },
  sessionPreview: {
    borderRadius: 22,
    backgroundColor: "#EFF6F7",
    padding: 16,
    gap: 6,
  },
  sessionPreviewLabel: {
    color: "#617983",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sessionPreviewValue: {
    color: "#11313C",
    fontFamily: "Avenir Next",
    fontSize: 20,
    fontWeight: "700",
  },
  sessionPreviewHint: {
    color: "#7B9099",
    fontSize: 13,
  },
  selectionSummary: {
    color: "#617983",
    fontSize: 13,
  },
  captureBusyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  captureBusyText: {
    color: "#11313C",
    fontSize: 14,
    fontWeight: "600",
  },
  queueRow: {
    gap: 14,
  },
  queuePill: {
    borderRadius: 22,
    backgroundColor: "#11313C",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  queuePillLabel: {
    color: "#C4E5EC",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  queuePillValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  syncButton: {
    minHeight: 62,
    borderRadius: 22,
    backgroundColor: "#0E788E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  syncButtonDisabled: {
    backgroundColor: "#B9C8CE",
  },
  syncButtonPressed: {
    opacity: 0.92,
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
