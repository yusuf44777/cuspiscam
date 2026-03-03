import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  ARCHES,
  TOOTH_TYPES,
  type ArchId,
  type ToothTypeId,
} from "../constants/dental";

type ToothSelectorProps = {
  selectedArch: ArchId | null;
  selectedTooth: ToothTypeId | null;
  onSelectArch: (arch: ArchId) => void;
  onSelectTooth: (tooth: ToothTypeId) => void;
};

export function ToothSelector({
  selectedArch,
  selectedTooth,
  onSelectArch,
  onSelectTooth,
}: ToothSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const selectedToothDef = selectedTooth
    ? TOOTH_TYPES.find((t) => t.id === selectedTooth)
    : null;

  return (
    <View style={styles.wrapper}>
      {/* ── Çene seçimi ─────────────────────────── */}
      <View style={styles.archRow}>
        {ARCHES.map((arch) => {
          const isSelected = selectedArch === arch.id;

          return (
            <Pressable
              key={arch.id}
              onPress={() => {
                onSelectArch(arch.id);
                setDropdownOpen(true);
              }}
              style={({ pressed }) => [
                styles.archButton,
                isSelected && styles.archButtonSelected,
                pressed && styles.archButtonPressed,
              ]}
            >
              <Text
                selectable
                style={[
                  styles.archLabel,
                  isSelected && styles.archLabelSelected,
                ]}
              >
                {arch.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Diş türü açılır listesi ─────────────── */}
      {selectedArch ? (
        <View style={styles.dropdownWrapper}>
          <Pressable
            onPress={() => setDropdownOpen(!dropdownOpen)}
            style={({ pressed }) => [
              styles.dropdownTrigger,
              pressed && { opacity: 0.92 },
            ]}
          >
            <Text selectable style={styles.dropdownTriggerText}>
              {selectedToothDef
                ? selectedToothDef.label
                : "Diş türü seçin..."}
            </Text>
            <Text style={styles.dropdownArrow}>
              {dropdownOpen ? "▲" : "▼"}
            </Text>
          </Pressable>

          {dropdownOpen ? (
            <View style={styles.dropdownList}>
              {TOOTH_TYPES.map((tooth) => {
                const isSelected = selectedTooth === tooth.id;

                return (
                  <Pressable
                    key={tooth.id}
                    onPress={() => {
                      onSelectTooth(tooth.id);
                      setDropdownOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemSelected,
                      pressed && styles.dropdownItemPressed,
                    ]}
                  >
                    <Text
                      selectable
                      style={[
                        styles.dropdownItemText,
                        isSelected && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {tooth.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 14,
  },
  archRow: {
    flexDirection: "row",
    gap: 12,
  },
  archButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D2E0E5",
    backgroundColor: "#F7FBFC",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  archButtonSelected: {
    borderColor: "#0E788E",
    backgroundColor: "#0E788E",
  },
  archButtonPressed: {
    opacity: 0.92,
  },
  archLabel: {
    color: "#11313C",
    fontSize: 18,
    fontWeight: "700",
  },
  archLabelSelected: {
    color: "#FFFFFF",
  },
  dropdownWrapper: {
    gap: 0,
  },
  dropdownTrigger: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CEE0E5",
    backgroundColor: "#F9FCFC",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownTriggerText: {
    color: "#11313C",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  dropdownArrow: {
    color: "#607883",
    fontSize: 14,
    marginLeft: 8,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D9E5E8",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF3F5",
  },
  dropdownItemSelected: {
    backgroundColor: "#E8F5F7",
  },
  dropdownItemPressed: {
    backgroundColor: "#F0F7F9",
  },
  dropdownItemText: {
    color: "#11313C",
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownItemTextSelected: {
    color: "#0E788E",
    fontWeight: "700",
  },
});
