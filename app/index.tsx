import { Stack } from "expo-router";
import { useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CaptureList } from "../src/components/CaptureList";
import { SectionCard } from "../src/components/SectionCard";
import { StatusBanner } from "../src/components/StatusBanner";
import { SurfaceSelector } from "../src/components/SurfaceSelector";
import { ToothSelector } from "../src/components/ToothSelector";
import {
  type SurfaceId,
  type ArchId,
  type ToothTypeId,
  buildToothFileSegment,
  getToothDisplayLabel,
} from "../src/constants/dental";
import {
  useGoogleAuthRequest,
  getPersistedToken,
  persistToken,
  clearPersistedToken,
} from "../src/services/googleAuth";
import { captureDentalPhoto } from "../src/services/captureService";
import {
  enqueueUpload,
  getPendingUploadCount,
  syncPendingUploads,
} from "../src/services/uploadQueue";
import { useCaptureStore } from "../src/store/useCaptureStore";

export default function HomeScreen() {
  const generatedSessionId = useCaptureStore((state) => state.generatedSessionId);
  const selectedArch = useCaptureStore((state) => state.selectedArch);
  const selectedTooth = useCaptureStore((state) => state.selectedTooth);
  const recentCaptures = useCaptureStore((state) => state.recentCaptures);
  const pendingCount = useCaptureStore((state) => state.pendingCount);
  const isCapturing = useCaptureStore((state) => state.isCapturing);
  const banner = useCaptureStore((state) => state.banner);
  const setArch = useCaptureStore((state) => state.setArch);
  const selectTooth = useCaptureStore((state) => state.selectTooth);
  const setPendingCount = useCaptureStore((state) => state.setPendingCount);
  const beginCapture = useCaptureStore((state) => state.beginCapture);
  const finishCapture = useCaptureStore((state) => state.finishCapture);
  const showBanner = useCaptureStore((state) => state.showBanner);
  const clearBanner = useCaptureStore((state) => state.clearBanner);

  // ── Google Auth state ──────────────────────
  const accessToken = useCaptureStore((state) => state.accessToken);
  const isSyncing = useCaptureStore((state) => state.isSyncing);
  const syncProgress = useCaptureStore((state) => state.syncProgress);
  const setAccessToken = useCaptureStore((state) => state.setAccessToken);
  const setIsSyncing = useCaptureStore((state) => state.setIsSyncing);
  const setSyncProgress = useCaptureStore((state) => state.setSyncProgress);
  const signOut = useCaptureStore((state) => state.signOut);

  const { promptAsync } = useGoogleAuthRequest();

  const toothReady = selectedArch !== null && selectedTooth !== null;
  const toothLabel =
    selectedArch && selectedTooth
      ? getToothDisplayLabel(selectedArch, selectedTooth)
      : null;

  // ── Restore persisted token on mount ───────
  useEffect(() => {
    void (async () => {
      const stored = await getPersistedToken();
      if (stored) {
        setAccessToken(stored.accessToken);
      }
    })();
  }, []);

  // ── Handle Google login ─────────────────────
  const handleGoogleLogin = useCallback(async () => {
    const result = await promptAsync();
    if (result.type === "success") {
      setAccessToken(result.accessToken);
      void persistToken(result.accessToken, result.expiresIn);
      showBanner({
        tone: "success",
        text: "Google Drive'a başarıyla giriş yapıldı.",
      });
    }
  }, [promptAsync, setAccessToken, showBanner]);

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
    if (!selectedArch || !selectedTooth || isCapturing) {
      return;
    }

    beginCapture();

    const toothFileSegment = buildToothFileSegment(selectedArch, selectedTooth);

    try {
      const result = await captureDentalPhoto({
        sessionId: generatedSessionId,
        tooth: toothFileSegment,
        surfaceId,
      });

      if (!result) {
        showBanner({
          tone: "info",
          text: "Kamera çekimi iptal edildi.",
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
          : "Kamera açılamadı veya görüntü kaydedilemedi.";

      showBanner({
        tone: "error",
        text: message,
      });
    }
  }

  function handleSyncPress() {
    if (!accessToken) {
      // Not signed in → trigger Google login
      void handleGoogleLogin();
      return;
    }

    if (isSyncing) return;

    void (async () => {
      setIsSyncing(true);
      setSyncProgress(null);

      try {
        const result = await syncPendingUploads(accessToken, (progress) => {
          setSyncProgress(progress);
        });

        await hydrateQueueCount();

        if (result.uploaded > 0 && result.failed === 0) {
          showBanner({
            tone: "success",
            text: `${result.uploaded} dosya Google Drive'a yüklendi.`,
          });
        } else if (result.uploaded > 0 && result.failed > 0) {
          showBanner({
            tone: "info",
            text: `${result.uploaded} yüklendi, ${result.failed} başarısız. Daha sonra tekrar deneyin.`,
          });
        } else if (result.failed > 0) {
          showBanner({
            tone: "error",
            text: `${result.failed} dosyanın yüklemesi başarısız. ${result.errors[0] ?? ""}`,
          });
        } else {
          showBanner({
            tone: "info",
            text: "Yüklenecek dosya bulunmuyor.",
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Senkronizasyon başarısız.";
        showBanner({ tone: "error", text: message });
      } finally {
        setIsSyncing(false);
        setSyncProgress(null);
      }
    })();
  }

  async function handleSignOut() {
    await clearPersistedToken();
    signOut();
  }

  const selectedSurfaceHint = toothReady
    ? `${toothLabel} seçildi. Yüzey butonuna dokunarak kamerayı açın.`
    : "Önce çene ve diş seçimi yapın. Yüzey butonları diş seçilmeden aktif olmaz.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Klinik Çekim" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text selectable style={styles.eyebrow}>
            STANDARDİZE DİŞ HEKİMLİĞİ FOTOĞRAFÇILIĞI
          </Text>
          <Text selectable style={styles.heroTitle}>
            Kamera iş akışı ve otomatik dosya isimlendirme.
          </Text>
          <Text selectable style={styles.heroBody}>
            Çene, diş ve yüzey seçin. Onaylanan her görüntü yerel depolamaya
            kaydedilir ve bulut arşivleme için kuyruğa alınır.
          </Text>
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text selectable style={styles.heroStatLabel}>
                Bekleyen yükleme
              </Text>
              <Text selectable style={styles.heroStatValue}>
                {pendingCount}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text selectable style={styles.heroStatLabel}>
                Oturum
              </Text>
              <Text selectable style={styles.heroStatValue}>
                {generatedSessionId}
              </Text>
            </View>
          </View>
        </View>

        <StatusBanner banner={banner} onDismiss={clearBanner} />

        <SectionCard
          title="Diş Seçimi"
          description="Çene seçin, ardından açılır listeden diş türünü belirleyin."
        >
          <ToothSelector
            selectedArch={selectedArch}
            selectedTooth={selectedTooth}
            onSelectArch={setArch}
            onSelectTooth={selectTooth}
          />
        </SectionCard>

        <SectionCard title="Yüzey Seçimi" description={selectedSurfaceHint}>
          <SurfaceSelector
            toothLabel={toothLabel}
            disabled={!toothReady || isCapturing}
            onSelect={handleSurfaceSelection}
          />
          {toothReady ? (
            <Text selectable style={styles.selectionSummary}>
              {toothLabel} seçildi. Yukarıdaki yüzey butonlarından birine
              dokunarak kamerayı açın.
            </Text>
          ) : null}
          {isCapturing ? (
            <View style={styles.captureBusyRow}>
              <ActivityIndicator color="#0E788E" />
              <Text selectable style={styles.captureBusyText}>
                Kamera sonucu bekleniyor...
              </Text>
            </View>
          ) : null}
        </SectionCard>

        <SectionCard
          title="Arşiv Kuyruğu"
          description={
            accessToken
              ? "Google Drive'a bağlı. Bekleyen çekimleri yüklemek için senkronize edin."
              : "Bulut arşivleme için Google Drive'a giriş yapın."
          }
        >
          <View style={styles.queueRow}>
            <View style={styles.queuePill}>
              <Text selectable style={styles.queuePillLabel}>
                Bekleyen yükleme
              </Text>
              <Text selectable style={styles.queuePillValue}>
                {pendingCount}
              </Text>
            </View>

            {isSyncing && syncProgress ? (
              <View style={styles.syncProgressRow}>
                <ActivityIndicator color="#0E788E" />
                <Text selectable style={styles.syncProgressText}>
                  Yükleniyor {syncProgress.completed + syncProgress.failed + 1}/
                  {syncProgress.total}
                  {syncProgress.current ? ` — ${syncProgress.current}` : ""}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSyncPress}
              disabled={isSyncing}
              style={({ pressed }) => [
                styles.syncButton,
                isSyncing && styles.syncButtonDisabled,
                pressed && !isSyncing && styles.syncButtonPressed,
              ]}
            >
              <Text selectable style={styles.syncButtonText}>
                {!accessToken
                  ? "Google Drive'a Giriş Yap"
                  : isSyncing
                    ? "Senkronize ediliyor..."
                    : "Bekleyenleri senkronize et"}
              </Text>
            </Pressable>

            {accessToken ? (
              <Pressable
                onPress={handleSignOut}
                style={({ pressed }) => [
                  styles.signOutButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text selectable style={styles.signOutButtonText}>
                  Google Drive oturumunu kapat
                </Text>
              </Pressable>
            ) : null}
          </View>
        </SectionCard>

        <SectionCard
          title="Son Çekimler"
          description="Bu oturumda yerel olarak kaydedilen son dosyalar."
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
  syncProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  syncProgressText: {
    color: "#11313C",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  signOutButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  signOutButtonText: {
    color: "#A03227",
    fontSize: 14,
    fontWeight: "600",
  },
});
