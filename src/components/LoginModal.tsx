import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";

import { Input } from "@/src/components/Input";
import { Button } from "@/src/components/Button";
import { GoogleIcon } from "@/assets/icons/google";

import * as AppleAuthentication from "expo-apple-authentication";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "@/src/store/hooks";
import { syncUser, fetchUser } from "@/src/store/slices/userSlice";

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
  const dispatch = useAppDispatch();
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
        .then(async (userCredential) => {
          if (userCredential.user) {
            try {
              await dispatch(fetchUser(userCredential.user.uid)).unwrap();
            } catch (error) {
              console.error("Failed to fetch user profile:", error);
            }
          }
          onClose();
        })
        .catch((err) => console.error("Google sign in error:", err.message));
    }
  }, [res, dispatch]);

  const handleLogin = async () => {
    if (!formValid) return;

    resetErrors();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        try {
          await dispatch(fetchUser(userCredential.user.uid)).unwrap();
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
      
      onClose();
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setEmailError(t("login.incorrectCredentials"));
        setPasswordError(t("login.incorrectCredentials"));
      } else {
        console.error("Login error:", err.message);
        setEmailError(err.message);
      }
    }
  };

  const handleSignup = async () => {
    if (!formValid) return;

    resetErrors();

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      console.log("User created:", cred.user.uid);

      const syncedUser = await dispatch(
        syncUser({
          uid: cred.user.uid,
          email: cred.user.email,
        })
      ).unwrap();

      console.log("User synced:", syncedUser);
      console.log("Synced user position:", syncedUser?.user?.position || syncedUser?.position);

      // Оновлюємо профіль після синхронізації, щоб отримати всі дані
      try {
        await dispatch(fetchUser(cred.user.uid)).unwrap();
        console.log("User profile fetched after sync");
      } catch (error) {
        console.error("Failed to fetch user profile after sync:", error);
      }

      onClose();
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setMode("login");
        setEmailError(t("login.emailAlreadyInUse"));
      } else {
        console.error("Signup error:", err.message);
        setEmailError(err.message);
      }
    }
  };

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

      const userCredential = await signInWithCredential(auth, credential);
      
      if (userCredential.user) {
        try {
          // Спочатку синхронізуємо користувача (створюємо якщо не існує)
          await dispatch(
            syncUser({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
            })
          ).unwrap();
          
          // Потім завантажуємо повний профіль
          await dispatch(fetchUser(userCredential.user.uid)).unwrap();
        } catch (error) {
          console.error("Failed to sync/fetch user profile:", error);
        }
      }
      
      onClose();
    } catch (err: any) {
      if (err.code !== "ERR_CANCELED") {
        console.error("Apple sign in error:", err.message);
      }
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.root}>
        <Pressable
          style={styles.overlay}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={styles.kav}
        >
      <View style={styles.modal}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalContent}
            >
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setMode("login")}
            style={[styles.tab, mode === "login" && styles.tabActive]}
          >
            <Text
                    style={[
                      styles.tabText,
                      mode === "login" && styles.tabTextActive,
                    ]}
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

        <Button
                title={
                  mode === "login" ? t("login.logIn") : t("login.createAccount")
                }
          onPress={mode === "login" ? handleLogin : handleSignup}
          disabled={!formValid}
        />

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.or}>{t("login.or")}</Text>
          <View style={styles.line} />
        </View>

        <Button
          type="white"
          icon={<GoogleIcon size={18} />}
          title={t("login.continueWithGoogle")}
          onPress={() => promptGoogle()}
        />

        <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
          cornerRadius={12}
          style={{ width: "100%", height: 50 }}
          onPress={handleApple}
        />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  kav: {
    width: "100%",
    justifyContent: "flex-end",
  },

  modal: {
    width: "100%",
    padding: 28,
    paddingTop: 60,
    backgroundColor: VSCodeColors.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    borderBottomWidth: 0,
  },
  modalContent: {
    paddingBottom: 24,
    gap: 20,
  },

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
