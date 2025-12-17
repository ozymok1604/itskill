import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Check, Globe } from "phosphor-react-native";

import i18n, { LANGUAGE_STORAGE_KEY, SupportedLanguage } from "@/src/i18n";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";

type LangOption = {
  value: SupportedLanguage;
  label: string;
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || "en"
  );

  const options: LangOption[] = useMemo(
    () => [
      { value: "en", label: t("settings.english") },
      { value: "ua", label: t("settings.ukrainian") },
    ],
    [t]
  );

  const handleSelect = useCallback(async (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={VSCodeColors.textPrimary} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.title}>{t("settings.title")}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={20} color={VSCodeColors.textPrimary} weight="bold" />
          <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        </View>

        <View style={styles.card}>
          {options.map((opt) => {
            const isSelected = currentLang === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => handleSelect(opt.value)}
                activeOpacity={0.75}
              >
                <Text style={styles.rowText}>{opt.label}</Text>
                {isSelected && (
                  <Check size={18} color={VSCodeColors.accent} weight="bold" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VSCodeColors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: VSCodeColors.border,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.3,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
  card: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: VSCodeColors.border,
  },
  rowSelected: {
    backgroundColor: VSCodeColors.surface,
  },
  rowText: {
    fontSize: 15,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.sans || "system",
    fontWeight: FontWeights.medium,
  },
});


