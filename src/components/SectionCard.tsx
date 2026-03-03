import { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

type SectionCardProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text selectable style={styles.title}>
          {title}
        </Text>
        <Text selectable style={styles.description}>
          {description}
        </Text>
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 18,
    boxShadow: "0 14px 34px rgba(17, 49, 60, 0.08)",
    borderWidth: 1,
    borderColor: "#E1EBEE",
  },
  header: {
    gap: 6,
  },
  title: {
    color: "#11313C",
    fontFamily: "Avenir Next",
    fontSize: 22,
    fontWeight: "700",
  },
  description: {
    color: "#607883",
    fontSize: 14,
    lineHeight: 21,
  },
  content: {
    gap: 14,
  },
});

