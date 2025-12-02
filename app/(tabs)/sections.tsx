import { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { getSections } from "@/src/store/slices/sectionsSlice";
import { List } from "phosphor-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { ProgressScale } from "@/src/components/ProgressScale";

interface Section {
  sectionId: string;
  title: string;
  description: string;
  order: number;
  progress: number;
}

export default function SectionsScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { openDrawer } = useDrawer();
  const { profile } = useAppSelector((state) => state.user);
  const { sections, isLoading, error } = useAppSelector(
    (state) => state.sections
  );

  console.log(sections[0]);

  useEffect(() => {
    if (profile?.subposition) {
      dispatch(getSections(profile.subposition));
    }
  }, [dispatch, profile?.subposition]);

  const renderSection = ({ item, index }: { item: Section; index: number }) => {
    const accentColors = [
      VSCodeColors.accent,
      VSCodeColors.success,
      "#D2A8FF",
      VSCodeColors.warning,
      VSCodeColors.error,
    ];
    const accentColor = accentColors[index % accentColors.length];
    const hasProgress = item.progress > 0;

    return (
      <TouchableOpacity
        style={[
          styles.sectionCard,
          hasProgress && styles.sectionCardWithProgress,
        ]}
        activeOpacity={0.8}
        onPress={() => {
          console.log("Navigate to section:", item.sectionId);
        }}
      >
        <View style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <View
                style={[styles.orderBadge, { backgroundColor: accentColor }]}
              >
                <Text style={styles.orderText}>{index + 1}</Text>
              </View>
              <Text style={styles.sectionTitle} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
            {hasProgress && (
              <View
                style={[styles.progressBadge, { borderColor: accentColor }]}
              >
                <Text style={[styles.progressText, { color: accentColor }]}>
                  {item.progress}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionDescription} numberOfLines={3}>
            {item.description}
          </Text>

          <View style={styles.progressFooter}>
            <ProgressScale
              current={item.progress}
              max={10}
              color={accentColor}
              showLabel={true}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
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
          <Text style={styles.title}>{t("sections.title")}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t("sections.loading")}</Text>
        </View>
      </View>
    );
  }

  if (error) {
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
          <Text style={styles.title}>{t("sections.title")}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!profile?.subposition) {
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
          <Text style={styles.title}>{t("sections.title")}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("sections.noSubposition")}</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.title}>{t("sections.title")}</Text>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("sections.empty")}</Text>
        </View>
      ) : (
        <FlatList
          data={[...sections].sort((a, b) => a.order - b.order)}
          keyExtractor={(item) => item.sectionId}
          renderItem={renderSection}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    marginBottom: 32,
    gap: 12,
  },
  menuButton: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: VSCodeColors.surface,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },
  title: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.5,
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  sectionCard: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionCardWithProgress: {
    borderLeftWidth: 3,
    borderLeftColor: VSCodeColors.accent,
  },
  cardContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  orderBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  orderText: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    flex: 1,
    lineHeight: 24,
  },
  progressBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    backgroundColor: VSCodeColors.surface,
    flexShrink: 0,
  },
  progressText: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    fontFamily: Fonts?.mono || "monospace",
  },
  sectionDescription: {
    fontSize: 15,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.sans || "system",
    lineHeight: 22,
    marginBottom: 16,
  },
  progressFooter: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: VSCodeColors.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: VSCodeColors.error,
    fontFamily: Fonts?.sans || "system",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: VSCodeColors.textMuted,
    fontFamily: Fonts?.sans || "system",
    fontSize: 14,
    textAlign: "center",
  },
});
