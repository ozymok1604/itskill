import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { VSCodeColors, Fonts } from "@/src/constants/theme";
import { useAppSelector } from "@/src/store/hooks";
import { List } from "phosphor-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { TouchableOpacity } from "react-native";

export default function HomeScreen() {
  const { t } = useTranslation();
  const { openDrawer } = useDrawer();
  const { user } = useAppSelector((state) => state.auth);
  const { profile } = useAppSelector((state) => state.user);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={openDrawer}
          style={styles.menuButton}
          activeOpacity={0.7}
        >
          <List size={24} color={VSCodeColors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("home.title")}</Text>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VSCodeColors.background,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: VSCodeColors.surface,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.5,
    flex: 1,
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
});
