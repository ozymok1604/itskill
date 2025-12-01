import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
} from "react-native";

import { Input } from "@/src/components/Input";
import { Button } from "@/src/components/Button";
import { GoogleIcon } from "@/assets/icons/google";

import * as AppleAuthentication from "expo-apple-authentication";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  OAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import { auth } from "@/src/firebase";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { VSCodeColors, Fonts } from "@/src/constants/theme";
WebBrowser.maybeCompleteAuthSession();

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LoginModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const resetErrors = () => {
    setEmailError("");
    setPasswordError("");
  };

  // Validation
  const emailValid = email.includes("@") && email.includes(".");
  const passwordValid = password.length >= 6;
  const formValid = emailValid && passwordValid;

  // GOOGLE
  const [req, res, promptGoogle] = Google.useAuthRequest({
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    responseType: "id_token",
  });

  useEffect(() => {
    if (res?.type === "success") {
      const { id_token } = res.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(onClose)
        .catch((err) => Alert.alert(t("login.googleError"), err.message));
    }
  }, [res]);

  // EMAIL LOGIN
  // EMAIL LOGIN
  // EMAIL LOGIN
  const handleLogin = () => {
    if (!formValid) return;

    resetErrors();

    signInWithEmailAndPassword(auth, email, password)
      .then(onClose)
      .catch((err) => {
        if (
          err.code === "auth/invalid-credential" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/user-not-found"
        ) {
          setEmailError(t("login.incorrectCredentials"));
          setPasswordError(t("login.incorrectCredentials"));
        } else {
          Alert.alert(t("login.loginError"), err.message);
        }
      });
  };

  // EMAIL SIGNUP
  // EMAIL SIGNUP
  const handleSignup = () => {
    if (!formValid) return;

    resetErrors();

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        Alert.alert(t("login.success"), t("login.accountCreated"));
        onClose();
      })
      .catch((err) => {
        if (err.code === "auth/email-already-in-use") {
          setMode("login");
          setEmailError(t("login.emailAlreadyInUse"));
        } else {
          Alert.alert(t("login.signupError"), err.message);
        }
      });
  };

  // APPLE
  const handleApple = async () => {
    try {
      const result = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      if (!result.identityToken) throw new Error("Missing token");

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: result.identityToken,
      });

      await signInWithCredential(auth, credential);
      onClose();
    } catch (err: any) {
      if (err.code !== "ERR_CANCELED")
        Alert.alert(t("login.appleError"), err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.modal}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setMode("login")}
            style={[styles.tab, mode === "login" && styles.tabActive]}
          >
            <Text
              style={[styles.tabText, mode === "login" && styles.tabTextActive]}
            >
              {t("login.logIn")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("signup")}
            style={[styles.tab, mode === "signup" && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                mode === "signup" && styles.tabTextActive,
              ]}
            >
              {t("login.signUp")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Inputs */}
        <Input
          error={emailError}
          placeholder={t("login.email")}
          value={email}
          onChange={setEmail}
        />
        <Input
          error={passwordError}
          placeholder={t("login.password")}
          type="password"
          value={password}
          onChange={setPassword}
        />

        {/* Submit button */}
        <Button
          title={mode === "login" ? t("login.logIn") : t("login.createAccount")}
          onPress={mode === "login" ? handleLogin : handleSignup}
          disabled={!formValid}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.or}>{t("login.or")}</Text>
          <View style={styles.line} />
        </View>

        {/* GOOGLE */}
        <Button
          type="white"
          icon={<GoogleIcon size={18} />}
          title={t("login.continueWithGoogle")}
          onPress={() => promptGoogle()}
        />

        {/* APPLE */}
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={12}
          style={{ width: "100%", height: 50 }}
          onPress={handleApple}
        />
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
  },

  modal: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 28,
    paddingTop: 60,
    backgroundColor: VSCodeColors.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    borderBottomWidth: 0,
    gap: 20,
  },

  // CLOSE BUTTON
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  close: {
    fontSize: 22,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
  },

  // TABS
  tabs: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: VSCodeColors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    overflow: "hidden",
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "transparent",
  },

  tabActive: {
    backgroundColor: VSCodeColors.surface,
    borderBottomWidth: 0,
  },

  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.2,
  },

  tabTextActive: {
    color: VSCodeColors.textPrimary,
  },

  // DIVIDER
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: VSCodeColors.border,
  },

  or: {
    color: VSCodeColors.textMuted,
    fontWeight: "600",
    fontSize: 13,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.5,
  },
});
