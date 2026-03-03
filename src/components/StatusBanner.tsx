import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BannerState } from "../store/useCaptureStore";

type StatusBannerProps = {
  banner: BannerState;
  onDismiss: () => void;
};

const TONE_STYLES = {
  success: {
    backgroundColor: "#E6F7F1",
    borderColor: "#9AD4BE",
    textColor: "#0F5E50",
    accentColor: "#0F7A67",
  },
  error: {
    backgroundColor: "#FFF1F0",
    borderColor: "#F1B2AA",
    textColor: "#A03227",
    accentColor: "#B53C32",
  },
  info: {
    backgroundColor: "#EDF7FB",
    borderColor: "#B8DBE8",
    textColor: "#0C5B72",
    accentColor: "#0E788E",
  },
} as const;

export function StatusBanner({ banner, onDismiss }: StatusBannerProps) {
  if (!banner) {
    return null;
  }

  const palette = TONE_STYLES[banner.tone];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: palette.accentColor }]} />
      <Text selectable style={[styles.text, { color: palette.textColor }]}>
        {banner.text}
      </Text>
      <Pressable onPress={onDismiss} style={styles.dismissButton}>
        <Text selectable style={[styles.dismissText, { color: palette.textColor }]}>
          Close
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    borderRadius: 22,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  accent: {
    width: 10,
    alignSelf: "stretch",
    borderRadius: 99,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  dismissButton: {
    minHeight: 36,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dismissText: {
    fontSize: 13,
    fontWeight: "700",
  },
});

