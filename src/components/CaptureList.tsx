import { StyleSheet, Text, View } from "react-native";
import type { CaptureRecord } from "../types/capture";
import { getSurfaceById, parseToothDisplayFromSegment } from "../constants/dental";
import { formatReadableDate } from "../utils/formatting";

type CaptureListProps = {
  captures: CaptureRecord[];
};

export function CaptureList({ captures }: CaptureListProps) {
  if (captures.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text selectable style={styles.emptyTitle}>
          Henüz çekim yapılmadı
        </Text>
        <Text selectable style={styles.emptyBody}>
          Çene ve diş seçimi yapın, ardından yüzey butonuna dokunarak kamerayı
          açın.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {captures.map((capture) => {
        const surface = getSurfaceById(capture.surfaceId);
        const toothDisplay = parseToothDisplayFromSegment(capture.tooth);

        return (
          <View key={capture.id} style={styles.item}>
            <View style={styles.itemHeader}>
              <Text selectable style={styles.itemTitle}>
                {toothDisplay} / {surface?.shortLabel ?? capture.surfaceId}
              </Text>
              <View style={styles.statusTag}>
                <Text selectable style={styles.statusTagText}>
                  Yerel kayıt
                </Text>
              </View>
            </View>
            <Text selectable style={styles.fileName}>
              {capture.fileName}
            </Text>
            <Text selectable style={styles.meta}>
              {formatReadableDate(capture.capturedAt)} / yükleme kuyruğunda
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  emptyState: {
    borderRadius: 22,
    backgroundColor: "#F4F8F9",
    padding: 18,
    gap: 6,
  },
  emptyTitle: {
    color: "#11313C",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyBody: {
    color: "#607883",
    fontSize: 14,
    lineHeight: 21,
  },
  item: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#D9E5E8",
    backgroundColor: "#F9FCFC",
    padding: 16,
    gap: 8,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  itemTitle: {
    flex: 1,
    color: "#11313C",
    fontSize: 16,
    fontWeight: "700",
  },
  statusTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#E6F7F1",
  },
  statusTagText: {
    color: "#0F6958",
    fontSize: 12,
    fontWeight: "700",
  },
  fileName: {
    color: "#314A54",
    fontSize: 13,
    lineHeight: 19,
  },
  meta: {
    color: "#688089",
    fontSize: 12,
    fontWeight: "600",
  },
});

