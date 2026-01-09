import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { VSCodeColors, Fonts } from "@/src/constants/theme";

type ButtonVariant = "primary" | "secondary" | "white" | "dark";

type Props = {
  title: string;
  onPress: () => void;
  type?: ButtonVariant;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
};

export const Button = ({
  title,
  onPress,
  type = "primary",
  icon,
  fullWidth = true,
  style,
  disabled = false,
}: Props) => {
  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
      style={[
        styles.base,
        fullWidth && { width: "100%" },

        type === "primary" && styles.primary,
        type === "secondary" && styles.secondary,
        type === "white" && styles.white,
        type === "dark" && styles.dark,

        disabled && styles.disabled,

        style,
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text
          style={[
            styles.text,
            type === "white" && styles.textDark,
            type === "dark" && styles.textWhite,
            disabled && styles.textDisabled,
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  text: {
    color: VSCodeColors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.3,
  },

  textDark: {
    color: VSCodeColors.textPrimary,
  },

  textDisabled: {
    opacity: 0.5,
    color: VSCodeColors.textMuted,
  },

  primary: {
    backgroundColor: VSCodeColors.buttonPrimary,
    borderColor: VSCodeColors.buttonPrimary,
  },

  secondary: {
    backgroundColor: VSCodeColors.buttonSecondary,
    borderColor: VSCodeColors.border,
  },

  white: {
    backgroundColor: VSCodeColors.surface,
    borderColor: VSCodeColors.border,
  },

  dark: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },

  textWhite: {
    color: "#FFFFFF",
  },

  disabled: {
    opacity: 0.5,
    backgroundColor: VSCodeColors.surface,
    borderColor: VSCodeColors.borderMuted,
  },
});
