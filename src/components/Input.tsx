import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Eye, EyeSlash } from "phosphor-react-native";
import { VSCodeColors, Fonts } from "@/src/constants/theme";

type Props = {
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "password";
  label?: string;
};

export const Input = ({
  label,
  value,
  onChange,
  placeholder,
  type,
  error,
}: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <View style={styles.container}>
      {/* LABEL */}
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* INPUT FIELD */}
      <View
        style={[
          styles.inputWrapper,
          error && { borderColor: VSCodeColors.error, backgroundColor: VSCodeColors.surface },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={VSCodeColors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        {/* TOGGLE ICON */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.iconWrapper}
          >
            {showPassword ? (
              <EyeSlash size={22} color={VSCodeColors.textSecondary} weight="bold" />
            ) : (
              <Eye size={22} color={VSCodeColors.textSecondary} weight="bold" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ERROR TEXT */}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.2,
  },
  inputWrapper: {
    width: "100%",
    backgroundColor: VSCodeColors.surface,
    borderColor: VSCodeColors.border,
    borderWidth: 1,
    borderRadius: 8,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
  iconWrapper: {
    paddingHorizontal: 4,
  },
  error: {
    marginTop: 2,
    fontSize: 13,
    color: VSCodeColors.error,
    fontFamily: Fonts?.mono || "monospace",
  },
});
