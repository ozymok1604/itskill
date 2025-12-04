import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter, useLocalSearchParams } from "expo-router";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";
import { CheckCircle, XCircle, Trophy, Target } from "phosphor-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// Lottie конфеті (опціонально)
let LottieView: any = null;
let hasConfettiFile = false;
try {
  const lottie = require("lottie-react-native");
  LottieView = lottie.default || lottie;
  // Перевіряємо чи є файл конфеті
  try {
    require("@/assets/confetti.json");
    hasConfettiFile = true;
  } catch (e) {
    console.log("Confetti JSON file not found");
  }
} catch (e) {
  console.log("Lottie not available");
}

interface TestResultsParams {
  correctAnswers: string;
  totalQuestions: string;
  scorePercentage: string;
  timeUp?: string;
}

export default function TestResultsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const correctAnswers = parseInt((params.correctAnswers as string) || "10");
  const totalQuestions = parseInt((params.totalQuestions as string) || "10");
  const scorePercentage = parseInt((params.scorePercentage as string) || "100");
  const timeUp = params.timeUp === "true";
  
  // Показуємо конфеті тільки якщо результат >= 50% і час не вийшов
  const [showConfetti, setShowConfetti] = useState(scorePercentage >= 50 && !timeUp);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Анімація появи
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getMessage = () => {
    // Якщо час вийшов, показуємо спеціальне повідомлення
    if (timeUp) {
      return {
        title: t("testResults.timeUp") || "Час вийшов! ⏰",
        message: t("testResults.timeUpMessage") || "Час на проходження тесту закінчився. Спробуй ще раз і будь швидшим!",
        icon: XCircle,
        color: VSCodeColors.error,
      };
    }
    
    if (scorePercentage >= 90) {
      return {
        title: t("testResults.excellent") || "Відмінно! 🎉",
        message: t("testResults.excellentMessage") || "Ти майстер! Продовжуй в тому ж дусі!",
        icon: Trophy,
        color: VSCodeColors.success,
      };
    } else if (scorePercentage >= 70) {
      return {
        title: t("testResults.great") || "Чудово! 👏",
        message: t("testResults.greatMessage") || "Добре зроблено! Ти на правильному шляху!",
        icon: CheckCircle,
        color: VSCodeColors.accent,
      };
    } else if (scorePercentage >= 50) {
      return {
        title: t("testResults.good") || "Добре! 👍",
        message: t("testResults.goodMessage") || "Непогано, але є куди рости!",
        icon: Target,
        color: VSCodeColors.warning,
      };
    } else {
      return {
        title: t("testResults.keepGoing") || "Треба постаратися 💪",
        message: t("testResults.keepGoingMessage") || "Не здавайся! Повтори матеріал і спробуй ще раз!",
        icon: XCircle,
        color: VSCodeColors.error,
      };
    }
  };

  const message = getMessage();
  const Icon = message.icon;

  const handleBackToSections = () => {
    // Переходимо на екран секцій через replace, щоб не було проблем з навігацією
    router.replace("/(tabs)/sections");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.container}>
      {showConfetti && LottieView && hasConfettiFile && (
        <View style={styles.confettiContainer} pointerEvents="none">
          <LottieView
            source={require("@/assets/confetti.json")}
            autoPlay
            loop={true}
            style={styles.confetti}
          />
        </View>
      )}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: `${message.color}20` }]}>
            <Icon size={52} color={message.color} weight="fill" />
          </View>
        </View>

        <Text style={styles.title}>{message.title}</Text>
        <Text style={styles.message}>{message.message}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{correctAnswers}</Text>
            <Text style={styles.statLabel}>
              {t("testResults.correct") || "Правильних"}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalQuestions - correctAnswers}</Text>
            <Text style={styles.statLabel}>
              {t("testResults.incorrect") || "Неправильних"}
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: message.color }]}>
              {scorePercentage}%
            </Text>
            <Text style={styles.statLabel}>
              {t("testResults.score") || "Результат"}
            </Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${scorePercentage}%`,
                backgroundColor: message.color,
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: message.color }]}
          onPress={handleBackToSections}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {t("testResults.backToSections") || "Повернутися до секцій"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VSCodeColors.panel,
  },
  confettiContainer: {
    position: "absolute",
    height:'100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confetti: {
    width: "100%",
    height: "100%",
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.sans || "system",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    width: "100%",
    marginBottom: 32,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 10,
    color: VSCodeColors.textMuted,
    fontFamily: Fonts?.mono || "monospace",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: VSCodeColors.border,
    marginHorizontal: 16,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 32,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  button: {
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
});

