import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { VSCodeColors, Fonts } from "@/src/constants/theme";

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.log("Logout error:", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("home.title")}</Text>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>{t("home.logOut")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VSCodeColors.background,
    paddingTop: 80,
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.5,
  },

  logoutBtn: {
    backgroundColor: VSCodeColors.buttonDanger,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: VSCodeColors.error,
  },

  logoutText: {
    color: VSCodeColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.3,
  },
});
