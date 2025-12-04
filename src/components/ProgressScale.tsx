import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";

interface ProgressScaleProps {
  current: number;
  max: number;
  color?: string;
  showLabel?: boolean;
}

export function ProgressScale({
  current,
  max,
  color = VSCodeColors.accent,
  showLabel = true,
}: ProgressScaleProps) {
  const { t } = useTranslation();
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>
            {current} / {max} {t("sections.testsPassed")}
          </Text>
        </View>
      )}
      <View style={styles.scaleContainer}>
        <View style={styles.scaleTrack}>
          <View
            style={[
              styles.scaleFill,
              { width: `${percentage}%`, backgroundColor: color },
            ]}
          />
        </View>
        <View style={styles.markersContainer}>
          {Array.from({ length: max }).map((_, index) => {
            const isCompleted = index < current;
            return (
              <View
                key={index}
                style={[
                  styles.marker,
                  isCompleted && { backgroundColor: color },
                  index === current - 1 && styles.markerActive,
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelContainer: {
    marginBottom: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
  scaleContainer: {
    position: "relative",
  },
  scaleTrack: {
    height: 8,
    backgroundColor: VSCodeColors.surface,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  scaleFill: {
    height: "100%",
    borderRadius: 4,
  },
  markersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  marker: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: VSCodeColors.border,
  },
  markerActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

