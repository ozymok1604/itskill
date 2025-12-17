import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Redirect, useRouter } from "expo-router";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { getSections } from "@/src/store/slices/sectionsSlice";
import { fetchUser } from "@/src/store/slices/userSlice";
import { auth } from "@/src/firebase";
import { clearTest, startStreaming, addQuestion, completeStreaming, setStreamingError } from "@/src/store/slices/testSlice";
import { apiService } from "@/src/services/api";
import { ProgressScale } from "@/src/components/ProgressScale";
import { Button } from "@/src/components/Button";
import { ActivityIndicator } from "react-native";

interface Section {
  _id: string;
  title: string;
  description: string;
  order: number;
  progress: number;
}

export default function SectionsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.user);
  const { sections, isLoading, error } = useAppSelector(
    (state) => state.sections
  );
  const { isLoading: isTestLoading } = useAppSelector((state) => state.test);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const translateYAnims = useRef<Record<string, Animated.Value>>({});
  const borderWidthAnims = useRef<Record<string, Animated.Value>>({});
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const [showButton, setShowButton] = useState(false);


  

  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
  console.log(selectedSectionId, "selectedSectionId");
  
  // Завантажуємо профіль користувача при монтуванні
  useEffect(() => {
    if (auth.currentUser?.uid) {
      console.log("Fetching user profile on sections mount");
      dispatch(fetchUser(auth.currentUser.uid));
    }
  }, [dispatch]);

  useEffect(() => {
    // Завантажуємо секції тільки якщо є subposition та uid
    // Це означає, що користувач вже пройшов onboarding
    if (profile?.subposition && profile?.uid) {
      console.log("Loading sections for subposition:", profile.subposition, "uid:", profile.uid);
      // Передаємо uid для отримання прогресу користувача
      dispatch(getSections({ subpositionId: profile.subposition, uid: profile.uid }));
    } else {
      console.log("Sections not loaded - missing subposition or uid:", {
        hasSubposition: !!profile?.subposition,
        hasUid: !!profile?.uid,
        profile: profile,
      });
    }
  }, [dispatch, profile?.subposition, profile?.uid, profile?.sections]); // Додаємо profile?.sections для оновлення після зміни прогресу

  useEffect(() => {
    console.log("selectedSectionId changed:", selectedSectionId);
    if (selectedSectionId) {
      setShowButton(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(buttonOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowButton(false);
      });
    }
  }, [selectedSectionId]);

  const handleSectionPress = (_id: string) => {
    if (!translateYAnims.current[_id]) {
      translateYAnims.current[_id] = new Animated.Value(0);
      borderWidthAnims.current[_id] = new Animated.Value(1);
    }

    if (selectedSectionId === _id) {
      setSelectedSectionId(null);
      Animated.parallel([
        Animated.spring(translateYAnims.current[_id], {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.spring(borderWidthAnims.current[_id], {
          toValue: 1,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    } else {
      if (selectedSectionId) {
        const prevId = selectedSectionId;
        if (translateYAnims.current[prevId]) {
          Animated.parallel([
            Animated.spring(translateYAnims.current[prevId], {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 7,
            }),
            Animated.spring(borderWidthAnims.current[prevId], {
              toValue: 1,
              useNativeDriver: false,
              tension: 50,
              friction: 7,
            }),
          ]).start();
        }
      }
      setSelectedSectionId(_id);
      Animated.parallel([
        Animated.spring(translateYAnims.current[_id], {
          toValue: -4,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.spring(borderWidthAnims.current[_id], {
          toValue: 2,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        }),
      ]).start();
    }
  };

  const handleStartTest = async () => {
    if (!selectedSectionId || !profile) return;

    const selectedSection = sections.find((s) => s._id === selectedSectionId);
    if (!selectedSection) return;

    try {
      // Визначаємо номер тесту на основі прогресу секції
      // Якщо користувач пройшов 1 тест, наступний буде 2, і т.д.
      // Максимум 10 тестів на секцію
      const currentProgress = selectedSection.progress || 0;
      const testNumber = Math.min(currentProgress + 1, 10);
      
      console.log(`📊 Starting test ${testNumber} for section ${selectedSectionId} (progress: ${currentProgress})`);

      // Переходимо на екран тесту одразу (питання будуть догружатися)
      router.push("/test");

      const streamWithRetry = async (attempt: number) => {
        // Очищаємо попередній тест та стартуємо стрім заново
        dispatch(clearTest());
      dispatch(startStreaming({
        testNumber,
        section: selectedSectionId,
        position: profile.position || "",
        subposition: profile.subposition || "",
        level: profile.level || "",
      }));

        try {
      await apiService.createTestStream(
        {
          position: profile.position || "",
          subposition: profile.subposition || "",
          level: profile.level || "",
          section: selectedSectionId,
          testNumber,
              language: i18n.language || "en", // Передаємо поточну мову з апки
        },
        (question) => {
          // Додаємо питання по мірі надходження
          dispatch(addQuestion(question));
        },
        () => {
          // Завершення генерації
          dispatch(completeStreaming());
        },
            (err) => {
              // SSE parse error will be handled via promise rejection/catch to allow retry
              if (err === "SSE_PARSE_ERROR") return;
              dispatch(setStreamingError(err));
            }
          );
        } catch (e: any) {
          const msg = e?.message || String(e);
          if (msg === "SSE_PARSE_ERROR" && attempt < 2) {
            console.log(`🔁 SSE parse error, regenerating test (attempt ${attempt + 2}/3)`);
            return streamWithRetry(attempt + 1);
        }
          dispatch(setStreamingError(msg || "Failed to create test"));
        }
      };

      await streamWithRetry(0);
    } catch (error) {
      console.error("Failed to create test:", error);
      dispatch(setStreamingError(error instanceof Error ? error.message : "Failed to create test"));
    }
  };


  

  const renderSection = ({ item, index }: { item: Section; index: number }) => {
    const accentColors = [
      VSCodeColors.accent,
      VSCodeColors.success,
      "#D2A8FF",
      VSCodeColors.warning,
      VSCodeColors.error,
    ];

    console.log(item, "item");
    const accentColor = accentColors[index % accentColors.length];
    const hasProgress = item.progress > 0;
    const isSelected = selectedSectionId === item._id;

    if (!translateYAnims.current[item._id]) {
      translateYAnims.current[item._id] = new Animated.Value(0);
      borderWidthAnims.current[item._id] = new Animated.Value(1);
    }

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ translateY: translateYAnims.current[item._id] }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.sectionCard,
            hasProgress && styles.sectionCardWithProgress,
            isSelected && styles.sectionCardSelected,
            {
              borderWidth: borderWidthAnims.current[item._id],
              borderColor: isSelected ? accentColor : VSCodeColors.border,
            },
          ]}
        >
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.8}
            onPress={() => handleSectionPress(item._id)}
            style={styles.cardTouchable}
          >
            <View style={styles.cardContent}>
              <View style={styles.sectionHeader}>
                <View style={styles.titleContainer}>
                  <View
                    style={[
                      styles.orderBadge,
                      { backgroundColor: accentColor },
                    ]}
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
        </Animated.View>
      </Animated.View>
    );
  };

  // Показуємо лоадер тільки якщо ще немає секцій (перша завантаження)
  // Якщо секції вже є - не показуємо лоадер при оновленні (щоб не було мигання)
  if (isLoading && sections.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
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
        <Text style={styles.title}>{t("sections.title")}</Text>
      </View>

      {sections?.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t("sections.empty")}</Text>
        </View>
      ) : (
        <>
          <View style={styles.listWrapper}>
            <FlatList
              data={[...sections].sort((a, b) => a.order - b.order)}
              keyExtractor={(item) => item._id}
              renderItem={renderSection}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
          {showButton && (
            <Animated.View
              style={[styles.testButtonContainer, { opacity: buttonOpacity }]}
            >
              <Button
                title={t("sections.startTest")}
                onPress={handleStartTest}
                type="primary"
                disabled={isTestLoading}
              />
              {isTestLoading && (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator
                    size="small"
                    color={VSCodeColors.accent}
                    style={styles.loader}
                  />
                </View>
              )}
            </Animated.View>
          )}
        </>
      )}
    </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.5,
    flex: 1,
  },
  listWrapper: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingTop: 0,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  sectionCard: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionCardSelected: {
    borderWidth: 2,
    borderColor: VSCodeColors.accent,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 8,
  },
  cardTouchable: {
    flex: 1,
  },
  sectionCardWithProgress: {
    borderLeftWidth: 3,
    borderLeftColor: VSCodeColors.accent,
  },
  testButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    backgroundColor: VSCodeColors.background,
    borderTopWidth: 1,
    borderTopColor: VSCodeColors.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
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
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 10,
  },
  loader: {
    marginTop: 10,
  },
});
