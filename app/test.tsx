import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";
import { ArrowLeft, CheckCircle, XCircle } from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppSelector, useAppDispatch } from "@/src/store/hooks";
import { Question, clearTest } from "@/src/store/slices/testSlice";
import { apiService } from "@/src/services/api";
import { fetchUser } from "@/src/store/slices/userSlice";
import { getSections } from "@/src/store/slices/sectionsSlice";
import { auth } from "@/src/firebase";

export default function TestScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { test, isLoading, isStreaming, error } = useAppSelector((state) => state.test);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(30); // 30 секунд для тестування
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerBlinkAnim = useRef(new Animated.Value(1)).current;

  const questions = test?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  
  // Діагностичне логування
  useEffect(() => {
    console.log(`📊 Test state: ${questions.length} questions, current index: ${currentQuestionIndex}`);
    console.log(`📋 Question IDs:`, questions.map(q => q.id));
  }, [questions.length, currentQuestionIndex]);
  // Завжди показуємо 10 питань (очікувана кількість)
  const totalQuestions = 10;
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0;
  const isLastQuestion = !isStreaming && currentQuestionIndex === questions.length - 1 && questions.length === totalQuestions;
  const hasAnswered = selectedAnswer !== null;

  // Використовуємо ref для відстеження чи тест вже ініціалізований
  const testInitializedRef = useRef(false);
  const previousTestIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Отримуємо унікальний ID тесту (комбінація section + testNumber)
    const currentTestId = test ? `${test.section}-${test.testNumber}` : null;
    
    // Якщо це новий тест (ID змінився), скидаємо все
    if (currentTestId && currentTestId !== previousTestIdRef.current) {
      previousTestIdRef.current = currentTestId;
      testInitializedRef.current = false;
      // Скидаємо стейт тільки для нового тесту
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setAnswers({});
    }

    // Ініціалізуємо тільки один раз при появі першого питання
    if (test && test.questions.length > 0 && !testInitializedRef.current) {
      testInitializedRef.current = true;
      // Не скидаємо стейт тут, бо він вже може бути встановлений
    }
  }, [test?.section, test?.testNumber]); // Залежність тільки від ID тесту, не від кількості питань

  // Скидаємо ref коли тест очищається
  useEffect(() => {
    if (!test) {
      testInitializedRef.current = false;
      previousTestIdRef.current = null;
    }
  }, [test]);

  // Таймер для тесту
  useEffect(() => {
    if (!test || isTimeUp) return;

    // Скидаємо таймер при новому тесті
    setTimeLeft(30);
    setIsTimeUp(false);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [test?.section, test?.testNumber, isTimeUp]);

  // Анімація мигання таймера коли час закінчується
  useEffect(() => {
    if (timeLeft <= 5 && timeLeft > 0) {
      // Мигаємо червоним
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerBlinkAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(timerBlinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (timeLeft === 0) {
      // Постійно червоний коли час вийшов
      timerBlinkAnim.setValue(1);
    } else {
      // Зупиняємо анімацію
      timerBlinkAnim.setValue(1);
    }
  }, [timeLeft]);

  // Автоматичний перехід на результати коли час вийшов
  useEffect(() => {
    if (isTimeUp && test && auth.currentUser && !isLoading) {
      // Невелика затримка перед переходом, щоб користувач побачив що час вийшов
      const timer = setTimeout(() => {
        handleFinish();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTimeUp, test, auth.currentUser, isLoading]);

  const handleAnswerSelect = (optionId: string) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(optionId);
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      handleFinish();
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    const nextQuestion = questions[nextIndex];
    setCurrentQuestionIndex(nextIndex);
    // Відновлюємо відповідь зі збережених, якщо вона є
    setSelectedAnswer(nextQuestion ? answers[nextQuestion.id] || null : null);
    setShowExplanation(nextQuestion ? !!answers[nextQuestion.id] : false);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex === 0) return;
    
    const prevIndex = currentQuestionIndex - 1;
    const prevQuestion = questions[prevIndex];
    setCurrentQuestionIndex(prevIndex);
    setSelectedAnswer(prevQuestion ? answers[prevQuestion.id] || null : null);
    setShowExplanation(prevQuestion ? !!answers[prevQuestion.id] : false);
  };

  const handleFinish = async () => {
    if (!test || !auth.currentUser) {
      dispatch(clearTest());
      router.back();
      return;
    }

    // Підраховуємо правильні відповіді (виносимо перед try, щоб були доступні поза блоком)
    let correctCount = 0;
    const questions = test.questions || [];
    
    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0 
      ? Math.round((correctCount / totalQuestions) * 100) 
      : 0;

    console.log(`📊 Test results: ${correctCount}/${totalQuestions} (${scorePercentage}%)`);

    try {
      // Відправляємо результати на бекенд
      await apiService.submitTestResult(auth.currentUser.uid, {
        sectionId: test.section,
        correctAnswers: correctCount,
        totalQuestions: totalQuestions,
        position: test.position,
        subposition: test.subposition,
        level: test.level,
        testNumber: test.testNumber,
      });

      // Оновлюємо профіль користувача
      const updatedProfileResponse = await dispatch(fetchUser(auth.currentUser.uid)).unwrap();
      const updatedProfile = updatedProfileResponse?.user || updatedProfileResponse;
      
      // Оновлюємо секції, щоб відобразити новий прогрес
      if (updatedProfile?.subposition && updatedProfile?.uid) {
        await dispatch(getSections({ 
          subpositionId: updatedProfile.subposition, 
          uid: updatedProfile.uid 
        }));
      }

      console.log("✅ Test results submitted successfully");
    } catch (error) {
      console.error("❌ Failed to submit test results:", error);
      // Продовжуємо навіть якщо не вдалося зберегти результати
    }

    // Переходимо на екран результатів (завжди, навіть якщо була помилка)
    console.log("🔄 Navigating to test results screen...");
    console.log("📊 Results:", { correctCount, totalQuestions, scorePercentage });
    
    // Використовуємо replace замість push, щоб не можна було повернутися назад
    router.replace({
      pathname: "/test-results",
      params: {
        correctAnswers: correctCount.toString(),
        totalQuestions: totalQuestions.toString(),
        scorePercentage: scorePercentage.toString(),
        timeUp: isTimeUp ? "true" : "false", // Передаємо інформацію про те, що час вийшов
      },
    });
    
    // Очищаємо тест після невеликої затримки, щоб перехід встиг відбутися
    setTimeout(() => {
      dispatch(clearTest());
    }, 100);
  };

  const isCorrect = currentQuestion ? selectedAnswer === currentQuestion.correctAnswer : false;
  const showResult = hasAnswered && showExplanation;

  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={VSCodeColors.accent} />
          <Text style={styles.loadingText}>{t("test.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !test || !currentQuestion) {
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
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || t("test.error")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.headerInfo}>
          <Text style={styles.questionNumber}>
            {t("test.question")} {currentQuestionIndex + 1}/{totalQuestions}
            {isStreaming && questions.length < 10 && ` (${questions.length}/10)`}
          </Text>
          <View style={styles.timerContainer}>
            <Animated.Text
              style={[
                styles.timer,
                timeLeft <= 5 && timeLeft > 0 && styles.timerWarning,
                isTimeUp && styles.timerDanger,
                {
                  opacity: timerBlinkAnim,
                },
              ]}
            >
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </Animated.Text>
          </View>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!currentQuestion && isStreaming ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={VSCodeColors.accent} />
            <Text style={styles.loadingText}>
              {questions.length > 0 
                ? `Генеруємо питання ${questions.length + 1}/10...`
                : "Генеруємо перше питання..."}
            </Text>
            <Text style={[styles.loadingText, { fontSize: 12, marginTop: 8 }]}>
              Завантажено: {questions.length}/10
            </Text>
          </View>
        ) : currentQuestion ? (
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {currentQuestion.code && (
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{currentQuestion.code}</Text>
            </View>
          )}

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswer === option.id;
              const isCorrectOption = option.id === currentQuestion.correctAnswer;
              const showCorrect = showResult && isCorrectOption;
              const showIncorrect = showResult && isSelected && !isCorrectOption;

              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                    showCorrect && styles.optionCardCorrect,
                    showIncorrect && styles.optionCardIncorrect,
                  ]}
                  onPress={() => handleAnswerSelect(option.id)}
                  activeOpacity={0.7}
                  disabled={hasAnswered}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionLabel}>
                      <Text style={styles.optionLabelText}>{option.id}</Text>
                    </View>
                    <Text style={styles.optionText} numberOfLines={3}>{option.text}</Text>
                  </View>
                  <View style={styles.optionIconContainer}>
                    {showCorrect && (
                      <CheckCircle
                        size={20}
                        color={VSCodeColors.success}
                        weight="fill"
                      />
                    )}
                    {showIncorrect && (
                      <XCircle
                        size={20}
                        color={VSCodeColors.error}
                        weight="fill"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {showResult && currentQuestion.explanation && (
            <View
              style={[
                styles.explanationContainer,
                isCorrect
                  ? styles.explanationContainerCorrect
                  : styles.explanationContainerIncorrect,
              ]}
            >
              <Text
                style={[
                  styles.explanationTitle,
                  isCorrect
                    ? styles.explanationTitleCorrect
                    : styles.explanationTitleIncorrect,
                ]}
              >
                {isCorrect ? t("test.correct") : t("test.incorrect")}
              </Text>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentQuestionIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navButtonText,
              currentQuestionIndex === 0 && styles.navButtonTextDisabled,
            ]}
          >
            {t("test.previous")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.navButtonPrimary,
            !hasAnswered && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!hasAnswered}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.navButtonText,
              styles.navButtonTextPrimary,
              !hasAnswered && styles.navButtonTextDisabled,
            ]}
          >
            {isLastQuestion ? t("test.finish") : t("test.next")}
          </Text>
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
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
  timerContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },
  timer: {
    fontSize: 14,
    fontWeight: FontWeights.medium,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
  },
  timerWarning: {
    color: VSCodeColors.warning,
  },
  timerDanger: {
    color: VSCodeColors.error,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: VSCodeColors.accent,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionContainer: {
    gap: 24,
  },
  questionText: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.sans || "system",
    lineHeight: 28,
  },
  codeBlock: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },
  codeText: {
    fontSize: 14,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: VSCodeColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 60,
  },
  optionCardSelected: {
    borderColor: VSCodeColors.accent,
    backgroundColor: VSCodeColors.surface,
  },
  optionCardCorrect: {
    borderColor: VSCodeColors.success,
    backgroundColor: `${VSCodeColors.success}15`,
  },
  optionCardIncorrect: {
    borderColor: VSCodeColors.error,
    backgroundColor: `${VSCodeColors.error}15`,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: VSCodeColors.surface,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  optionLabelText: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
  optionText: {
    fontSize: 16,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.sans || "system",
    flex: 1,
    lineHeight: 22,
    marginRight: 8, // Відступ перед іконкою
  },
  optionIconContainer: {
    width: 24, // Фіксована ширина для іконки, щоб не зміщувався текст
    alignItems: "center",
    justifyContent: "center",
  },
  explanationContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  explanationContainerCorrect: {
    backgroundColor: `${VSCodeColors.success}15`,
    borderColor: VSCodeColors.success,
  },
  explanationContainerIncorrect: {
    backgroundColor: `${VSCodeColors.error}15`,
    borderColor: VSCodeColors.error,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    marginBottom: 8,
    fontFamily: Fonts?.mono || "monospace",
  },
  explanationTitleCorrect: {
    color: VSCodeColors.success,
  },
  explanationTitleIncorrect: {
    color: VSCodeColors.error,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts?.sans || "system",
    color: VSCodeColors.textPrimary,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: VSCodeColors.border,
    backgroundColor: VSCodeColors.background,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: VSCodeColors.surface,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navButtonPrimary: {
    backgroundColor: VSCodeColors.accent,
    borderColor: VSCodeColors.accent,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
  navButtonTextPrimary: {
    color: VSCodeColors.textPrimary,
  },
  navButtonTextDisabled: {
    color: VSCodeColors.textMuted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.sans || "system",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: VSCodeColors.error,
    fontFamily: Fonts?.sans || "system",
    textAlign: "center",
  },
});

