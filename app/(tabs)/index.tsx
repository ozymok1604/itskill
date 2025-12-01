import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { VSCodeColors, Fonts } from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { logout } from "@/src/store/slices/authSlice";
import { clearProfile } from "@/src/store/slices/userSlice";

export default function HomeScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { profile } = useAppSelector((state) => state.user);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      dispatch(clearProfile());
    } catch (err: any) {
      console.log("Logout error:", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("home.title")}</Text>

      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userText}>
            {t("home.loggedInAs")}: {user.email || "N/A"}
          </Text>
          {profile && (
            <Text style={styles.userText}>
              {t("home.name")}: {profile.name || "N/A"}
            </Text>
          )}
        </View>
      )}

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

  userInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },

  userText: {
    fontSize: 14,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
    marginBottom: 4,
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
