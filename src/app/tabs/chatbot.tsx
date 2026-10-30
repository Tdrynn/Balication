import { Platform, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

const COLORS = {
  background: "#0B1020",
  card: "#151B30",
  border: "#262E4A",
  text: "#F4F6FF",
  muted: "#8A93B5",
  accent: "#7C8CFF",
  accentSoft: "rgba(124, 140, 255, 0.16)",
};

const PLATFORM_NAME =
  Platform.OS === "ios"
    ? "iOS"
    : Platform.OS === "android"
      ? "Android"
      : "Web";

const INFO = [
  { label: "Nama", value: "Tude" },
  { label: "Project", value: "PBL5D2" },
  { label: "Platform", value: `${PLATFORM_NAME} ${Platform.Version}` },
];

export default function ChatBotScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>T</Text>
        </View>

        <Text style={styles.title}>Halaman Profil</Text>
        <Text style={styles.subtitle}>
          Ini halaman baru. Ubah teks ini lalu simpan untuk menguji reload.
        </Text>

        <View style={styles.card}>
          {INFO.map((item, index) => (
            <View
              key={item.label}
              style={[styles.row, index > 0 && styles.rowBorder]}
            >
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.accent,
    fontSize: 30,
    fontWeight: "800",
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  label: {
    color: COLORS.muted,
    fontSize: 15,
  },
  value: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
});
