import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";
import { Gear, SignOut } from "phosphor-react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/src/firebase";
import { logout } from "@/src/store/slices/authSlice";
import { clearProfile } from "@/src/store/slices/userSlice";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { profile, positions } = useAppSelector((state) => state.user);

  console.log(profile, "profile");

  const positionName =
    positions.find((p) => p._id === profile?.position)?.name ||
    profile?.position ||
    "N/A";

  const subpositionName = profile?.subposition
    ? positions
        .find((p) => p._id === profile?.position)
        ?.subpositions.find((s) => s.id === profile.subposition)?.name
    : null;

  const levelName = profile?.level
    ? t(`onboarding.level.${profile.level}`)
    : "N/A";

  const progressPercentage = profile?.progress?.progressPercentage || 0;
  const answeredQuestions =
    profile?.questionsStats?.totalQuestionsAnswered || 0;
  const accuracyPercentage = profile?.questionsStats?.accuracyPercentage || 0;

  const handleSettings = () => {
    router.push("/settings");
  };

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
    <SafeAreaView edges={["top"]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t("drawer.email")}</Text>
            <Text style={styles.value}>{user?.email || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t("drawer.position")}</Text>
            <Text style={styles.value}>{positionName}</Text>
          </View>

          {subpositionName && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("drawer.subposition")}</Text>
              <Text style={styles.value}>{subpositionName}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t("drawer.level")}</Text>
            <Text style={styles.value}>{levelName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("drawer.progress")}</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progressPercentage}%</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>{t("drawer.answeredQuestions")}</Text>
            <Text style={styles.value}>{answeredQuestions}</Text>
          </View>

          {answeredQuestions > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>{t("drawer.accuracy")}</Text>
              <Text style={styles.value}>{accuracyPercentage.toFixed(1)}%</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleSettings}
          activeOpacity={0.7}
        >
          <Gear size={20} color={VSCodeColors.textPrimary} weight="bold" />
          <Text style={styles.settingsText}>{t("drawer.settings")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <SignOut size={20} color={VSCodeColors.textPrimary} weight="bold" />
          <Text style={styles.logoutText}>{t("drawer.logOut")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VSCodeColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: VSCodeColors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: VSCodeColors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: VSCodeColors.textMuted,
    fontFamily: Fonts?.mono || "monospace",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.sans || "system",
    fontWeight: FontWeights.medium,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: VSCodeColors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
    fontWeight: FontWeights.semibold,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: VSCodeColors.border,
    backgroundColor: VSCodeColors.background,
    gap: 12,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    gap: 10,
  },
  settingsText: {
    fontSize: 15,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: VSCodeColors.buttonDanger,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VSCodeColors.error,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.3,
  },
});

