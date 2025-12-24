import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  getPositions,
  updateUserProfile,
  syncUser,
  fetchUser,
} from "@/src/store/slices/userSlice";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import {
  VSCodeColors as Colors,
  Fonts,
  FontWeights,
} from "../src/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Button } from "@/src/components/Button";
import { ArrowLeft } from "phosphor-react-native";
import { auth } from "@/src/firebase";

const accentColors = [
  Colors.accent, // blue
  Colors.success, // green
  "#D2A8FF", // purple
  Colors.warning, // orange
  Colors.error, // red
  Colors.textPrimary, // white-ish
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();

  
  useEffect(() => {
    dispatch(getPositions());
  }, [dispatch]);

  const { positions, isLoadingPositions, isLoading } = useAppSelector(
    (state) => state.user
  );
  const { profile } = useAppSelector((state) => state.user);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedSubposition, setSelectedSubposition] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [step, setStep] = useState<"position" | "subposition" | "level">(
    "position"
  );

  const selectedPositionData = positions.find(
    (p) => p._id === selectedPosition
  );
  const subpositions = selectedPositionData?.subpositions || [];

  const levels = [
    { id: "trainee", name: t("onboarding.level.trainee") },
    { id: "junior", name: t("onboarding.level.junior") },
    { id: "middle", name: t("onboarding.level.middle") },
    { id: "senior", name: t("onboarding.level.senior") },
  ];

  const handlePositionSelect = (positionId: string) => {
    setSelectedPosition(positionId);
    setSelectedSubposition("");
  };

  const handleNext = () => {
    if (step === "position") {
      if (subpositions.length > 0) {
        setStep("subposition");
      } else {
        setStep("level");
      }
    } else if (step === "subposition") {
      setStep("level");
    } else {
      handleFinish();
    }
  };

  

  const handleFinish = async () => {
    const uid = auth.currentUser?.uid || profile?.uid;
    const email = auth.currentUser?.email ?? null;
    if (!uid) {
      console.error("User UID not found");
      return;
    }

    try {
      // Ensure backend user exists (idempotent)
      try {
        await dispatch(syncUser({ uid, email })).unwrap();
      } catch (e) {
        // If sync fails (e.g. missing email for a brand-new Apple user), we still try to proceed,
        // but updateUserProfile may fail if backend doesn't know this uid yet.
        console.log("syncUser failed (continuing):", e);
      }

      const updateData: {
        position: string;
        subposition?: string;
        level: string;
      } = {
        position: selectedPosition,
        level: selectedLevel,
      };

      if (selectedSubposition) {
        updateData.subposition = selectedSubposition;
      }

      await dispatch(
        updateUserProfile({
          uid,
          data: updateData,
        })
      ).unwrap();

      // Refresh profile state after onboarding
      dispatch(fetchUser(uid));
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Failed to update user profile:", error);
    }
  };

  const handleBack = () => {
    if (step === "subposition") {
      setStep("position");
      setSelectedSubposition("");
    } else if (step === "level") {
      if (subpositions.length > 0) {
        setStep("subposition");
      } else {
        setStep("position");
      }
      setSelectedLevel("");
    }
  };

  const renderCard = ({
    item,
    index,
    isActive,
    onPress,
  }: {
    item: { _id?: string; id?: string; name: string };
    index: number;
    isActive: boolean;
    onPress: () => void;
  }) => {
    const accent = accentColors[index % accentColors.length];

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.positionCard,
          isActive && styles.positionCardActive,
          { borderColor: isActive ? accent : Colors.border },
        ]}
      >
        <Text style={[styles.positionId, { color: accent }]}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <View style={styles.header}>
        {(step === "subposition" || step === "level") && (
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.accent} weight="bold" />
            <Text style={styles.backButtonText}>{t("onboarding.back")}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>
          {step === "position"
            ? t("onboarding.title")
            : step === "subposition"
            ? t("onboarding.subtitleSelect")
            : t("onboarding.level.title")}
        </Text>
        <Text style={styles.subtitle}>
          {step === "position"
            ? t("onboarding.subtitle")
            : step === "subposition"
            ? t("onboarding.subtitleDescription")
            : t("onboarding.level.subtitle")}
        </Text>
      </View>

      {isLoadingPositions ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading positions...</Text>
        </View>
      ) : step === "position" ? (
        positions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No positions available</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={positions}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              renderItem={({ item, index }) =>
                renderCard({
                  item,
                  index,
                  isActive: selectedPosition === item._id,
                  onPress: () => handlePositionSelect(item._id),
                })
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />

            {selectedPosition && (
              <View style={styles.footer}>
                <Button
                  title={t("onboarding.next")}
                  onPress={handleNext}
                  type="primary"
                  disabled={!selectedPosition}
                />
              </View>
            )}
          </>
        )
      ) : step === "subposition" ? (
        subpositions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No subpositions available</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={subpositions}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.row}
              renderItem={({ item, index }) =>
                renderCard({
                  item,
                  index,
                  isActive: selectedSubposition === item.id,
                  onPress: () => setSelectedSubposition(item.id),
                })
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />

            {selectedSubposition && (
              <View style={styles.footer}>
                <Button
                  title={t("onboarding.next")}
                  onPress={handleNext}
                  type="primary"
                  disabled={!selectedSubposition}
                />
              </View>
            )}
          </>
        )
      ) : (
        <>
          <FlatList
            data={levels}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            renderItem={({ item, index }) =>
              renderCard({
                item,
                index,
                isActive: selectedLevel === item.id,
                onPress: () => setSelectedLevel(item.id),
              })
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />

          {selectedLevel && (
            <View style={styles.footer}>
              <Button
                title={t("onboarding.finish")}
                onPress={handleFinish}
                type="primary"
                disabled={!selectedLevel || isLoading}
              />
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  backButtonText: {
    color: Colors.accent,
    fontFamily: Fonts?.mono || "monospace",
    fontSize: 16,
    fontWeight: FontWeights.semibold,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    fontWeight: FontWeights.bold,
    fontSize: 28,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontFamily: Fonts?.sans || "system",
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  positionCard: {
    width: "48%",
    minHeight: 140,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.panel,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  positionCardActive: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  positionId: {
    fontFamily: Fonts?.mono || "monospace",
    fontWeight: FontWeights.semibold,
    fontSize: 13,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
    opacity: 0.9,
  },
  positionName: {
    fontFamily: Fonts?.sans || "system",
    fontWeight: FontWeights.medium,
    fontSize: 15,
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: Fonts?.sans || "system",
    fontSize: 14,
  },
});

export { OnboardingScreen };
