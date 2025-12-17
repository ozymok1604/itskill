import { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchUser } from "@/src/store/slices/userSlice";
import { auth } from "@/src/firebase";
import { clearTest, startStreaming, addQuestion, completeStreaming, setStreamingError } from "@/src/store/slices/testSlice";
import { apiService } from "@/src/services/api";
import { 
  Trophy, 
  Target, 
  ChartLineUp, 
  Clock, 
  CheckCircle,
  ArrowRight,
  BookOpen
} from "phosphor-react-native";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { profile } = useAppSelector((state) => state.user);

  // Завантажуємо профіль користувача при монтуванні
  useEffect(() => {
    if (auth.currentUser?.uid) {
      console.log("Fetching user profile on home mount");
      dispatch(fetchUser(auth.currentUser.uid));
    }
  }, [dispatch]);

  const stats = profile?.questionsStats;
  const progress = profile?.progress;
  const sections = profile?.sections || [];
  const testHistory = profile?.testHistory || [];

  // Останні 3 тести
  const recentTests = testHistory.slice(-3).reverse();

  // Секції з прогресом (сортуємо за прогресом, показуємо топ 3)
  const topSections = [...sections]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  // Рекомендації - секції з найменшим прогресом
  const recommendedSections = [...sections]
    .filter(s => s.progress < 10)
    .sort((a, b) => a.progress - b.progress)
    .slice(0, 3);

  const startTestForSection = async (sectionId: string, currentProgress: number = 0) => {
    if (!profile) {
      router.push("/(tabs)/sections");
      return;
    }

    try {
      const testNumber = Math.min((currentProgress || 0) + 1, 10);
      console.log(`📊 Starting test ${testNumber} for section ${sectionId} from home (progress: ${currentProgress})`);

      // Переходимо на екран тесту одразу (питання будуть догружатися)
      router.push("/test");

      const streamWithRetry = async (attempt: number) => {
        // Очищаємо попередній тест та стартуємо стрім заново
        dispatch(clearTest());
        dispatch(startStreaming({
          testNumber,
          section: sectionId,
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
              section: sectionId,
              testNumber,
              language: i18n.language || "en",
            },
            (question) => {
              dispatch(addQuestion(question));
            },
            () => {
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
      console.error("Failed to create test from home:", error);
      dispatch(setStreamingError(error instanceof Error ? error.message : "Failed to create test"));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("home.title")}</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Статистика */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${VSCodeColors.accent}20` }]}>
              <Target size={24} color={VSCodeColors.accent} weight="fill" />
            </View>
            <Text style={styles.statValue}>{stats?.totalQuestionsAnswered || 0}</Text>
            <Text style={styles.statLabel}>{t("home.questionsAnswered")}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${VSCodeColors.success}20` }]}>
              <CheckCircle size={24} color={VSCodeColors.success} weight="fill" />
            </View>
            <Text style={styles.statValue}>{stats?.accuracyPercentage || 0}%</Text>
            <Text style={styles.statLabel}>{t("home.accuracy")}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${VSCodeColors.warning}20` }]}>
              <Trophy size={24} color={VSCodeColors.warning} weight="fill" />
            </View>
            <Text style={styles.statValue}>{progress?.testsTaken || 0}</Text>
            <Text style={styles.statLabel}>{t("home.testsCompleted")}</Text>
          </View>
        </View>

        {/* Прогрес */}
        {progress && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <ChartLineUp size={20} color={VSCodeColors.textPrimary} weight="bold" />
              <Text style={styles.sectionTitle}>{t("home.overallProgress")}</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress.progressPercentage || 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {progress.progressPercentage || 0}%
              </Text>
            </View>
          </View>
        )}

        {/* Рекомендації */}
        {recommendedSections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("home.recommended")}</Text>
            {recommendedSections.map((section) => (
              <TouchableOpacity
                key={section.sectionId}
                style={styles.sectionItem}
                onPress={() => startTestForSection(section.sectionId, section.progress)}
                activeOpacity={0.7}
              >
                <View style={styles.sectionItemContent}>
                  <BookOpen size={20} color={VSCodeColors.accent} weight="fill" />
                  <View style={styles.sectionItemText}>
                    <Text style={styles.sectionItemTitle}>{section.title}</Text>
                    <Text style={styles.sectionItemSubtitle}>
                      {t("home.progress")}: {section.progress}/10
                    </Text>
                  </View>
                </View>
                <ArrowRight size={20} color={VSCodeColors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Топ секції */}
        {topSections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("home.topSections")}</Text>
            {topSections.map((section) => (
              <View key={section.sectionId} style={styles.sectionItem}>
                <View style={styles.sectionItemContent}>
                  <Trophy size={20} color={VSCodeColors.warning} weight="fill" />
                  <View style={styles.sectionItemText}>
                    <Text style={styles.sectionItemTitle}>{section.title}</Text>
                    <Text style={styles.sectionItemSubtitle}>
                      {t("home.progress")}: {section.progress}/10
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Останні тести */}
        {recentTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("home.recentTests")}</Text>
            {recentTests.map((test, index) => (
              <View key={index} style={styles.testItem}>
                <View style={styles.testItemContent}>
                  <Clock size={16} color={VSCodeColors.textMuted} />
                  <Text style={styles.testItemText}>
                    {new Date(test.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.testItemScore}>
                  <Text style={[
                    styles.testItemScoreText,
                    { color: test.score >= 70 ? VSCodeColors.success : test.score >= 50 ? VSCodeColors.warning : VSCodeColors.error }
                  ]}>
                    {test.score}%
                  </Text>
                  <Text style={styles.testItemSubtext}>
                    {test.correctAnswers}/{test.totalQuestions}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

       
        

        {/* Швидкий доступ */}
        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => {
            const nextSection = [...sections].sort((a, b) => (a.progress || 0) - (b.progress || 0))[0];
            if (nextSection?.sectionId) {
              startTestForSection(nextSection.sectionId, nextSection.progress || 0);
              return;
            }
            router.push("/(tabs)/sections");
          }}
          activeOpacity={0.8}
        >
          <View style={styles.quickActionContent}>
            <View style={[styles.quickActionIcon, { backgroundColor: VSCodeColors.accent }]}>
              <Target size={24} color={VSCodeColors.textPrimary} weight="fill" />
            </View>
            <View style={styles.quickActionText}>
              <Text style={styles.quickActionTitle}>{t("home.startTest")}</Text>
              <Text style={styles.quickActionSubtitle}>{t("home.startTestSubtitle")}</Text>
            </View>
          </View>
          <ArrowRight size={24} color={VSCodeColors.accent} />
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: VSCodeColors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.5,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: VSCodeColors.panel,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    alignItems: "center",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: VSCodeColors.textMuted,
    fontFamily: Fonts?.mono || "monospace",
    textAlign: "center",
  },
  progressCard: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: VSCodeColors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    minWidth: 45,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    marginBottom: 12,
  },
  sectionItem: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sectionItemText: {
    flex: 1,
  },
  sectionItemTitle: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.sans || "system",
    marginBottom: 4,
  },
  sectionItemSubtitle: {
    fontSize: 12,
    color: VSCodeColors.textMuted,
    fontFamily: Fonts?.mono || "monospace",
  },
  testItem: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  testItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  testItemText: {
    fontSize: 14,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
  },
  testItemScore: {
    alignItems: "flex-end",
  },
  testItemScoreText: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    fontFamily: Fonts?.mono || "monospace",
  },
  testItemSubtext: {
    fontSize: 12,
    color: VSCodeColors.textMuted,
    fontFamily: Fonts?.mono || "monospace",
  },
  quickAction: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: VSCodeColors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  quickActionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.sans || "system",
  },
});
