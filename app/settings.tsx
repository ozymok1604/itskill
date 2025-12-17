import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Check, Globe, Trash, Warning, Eye, EyeSlash } from "phosphor-react-native";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  OAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import i18n, { LANGUAGE_STORAGE_KEY, SupportedLanguage } from "@/src/i18n";
import { VSCodeColors, Fonts, FontWeights } from "@/src/constants/theme";
import { auth } from "@/src/firebase";
import { apiService } from "@/src/services/api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { clearProfile } from "@/src/store/slices/userSlice";
import { logout } from "@/src/store/slices/authSlice";

WebBrowser.maybeCompleteAuthSession();

type LangOption = {
  value: SupportedLanguage;
  label: string;
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  // Get auth state from Redux
  const { user: reduxUser, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || "en"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReauthing, setIsReauthing] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);

  // Listen to Firebase auth state changes
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Google Auth for re-authentication
  const [, googleResponse, promptGoogle] = Google.useAuthRequest({
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    responseType: "id_token",
  });

  const options: LangOption[] = useMemo(
    () => [
      { value: "en", label: t("settings.english") },
      { value: "ua", label: t("settings.ukrainian") },
    ],
    [t]
  );

  // Get the auth provider of current user
  const getAuthProvider = useCallback(() => {
    const user = firebaseUser;
    if (!user) return "password"; // Default to password if user not loaded yet
    
    const providerData = user.providerData;
    if (providerData.length === 0) return "password";
    
    const providerId = providerData[0].providerId;
    if (providerId === "google.com") return "google";
    if (providerId === "apple.com") return "apple";
    return "password";
  }, [firebaseUser]);

  const handleSelect = useCallback(async (lang: SupportedLanguage) => {
    setCurrentLang(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  }, []);

  // Re-authenticate with password
  const handleReauthWithPassword = useCallback(async () => {
    const user = firebaseUser;
    if (!user || !user.email) return;

    if (!password.trim()) {
      setPasswordError(t("settings.passwordRequired"));
      return;
    }

    setIsReauthing(true);
    setPasswordError("");

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Re-auth successful, now delete
      setShowReauthModal(false);
      setPassword("");
      await performDelete();
    } catch (error: any) {
      console.error("Reauth failed:", error);
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setPasswordError(t("settings.wrongPassword"));
      } else {
        setPasswordError(error.message || t("settings.reauthFailed"));
      }
    } finally {
      setIsReauthing(false);
    }
  }, [password, t, firebaseUser, performDelete]);

  // Re-authenticate with Apple
  const handleReauthWithApple = useCallback(async () => {
    setIsReauthing(true);
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

      if (firebaseUser) {
        await reauthenticateWithCredential(firebaseUser, credential);
        setShowReauthModal(false);
        await performDelete();
      }
    } catch (error: any) {
      if (error.code !== "ERR_CANCELED") {
        Alert.alert(t("settings.error"), error.message || t("settings.reauthFailed"));
      }
    } finally {
      setIsReauthing(false);
    }
  }, [t, firebaseUser, performDelete]);

  // Re-authenticate with Google
  const handleReauthWithGoogle = useCallback(async () => {
    try {
      await promptGoogle();
    } catch (error: any) {
      Alert.alert(t("settings.error"), error.message || t("settings.reauthFailed"));
    }
  }, [promptGoogle, t]);

  // Handle Google re-auth response
  React.useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token } = googleResponse.params;
      const credential = GoogleAuthProvider.credential(id_token);
      
      if (firebaseUser) {
        setIsReauthing(true);
        reauthenticateWithCredential(firebaseUser, credential)
          .then(() => {
            setShowReauthModal(false);
            performDelete();
          })
          .catch((error) => {
            Alert.alert(t("settings.error"), error.message || t("settings.reauthFailed"));
          })
          .finally(() => {
            setIsReauthing(false);
          });
      }
    }
  }, [googleResponse, t, firebaseUser, performDelete]);

  // Perform the actual deletion
  const performDelete = useCallback(async () => {
    // Get fresh user reference for deletion
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t("settings.error"), t("settings.notLoggedIn"));
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Delete user data from backend (MongoDB)
      await apiService.deleteUser(user.uid);

      // 2. Delete user from Firebase Auth
      await user.delete();

      // 3. Clear local state
      dispatch(clearProfile());
      dispatch(logout());

      // 4. Close modal and navigate to welcome screen
      setShowDeleteModal(false);
      router.replace("/welcome");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      Alert.alert(
        t("settings.error"),
        error.message || t("settings.deleteError")
      );
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, router, t]);

  const handleDeleteAccount = useCallback(async () => {
    // Use firebaseUser state which is kept in sync via onAuthStateChanged
    if (!firebaseUser) {
      Alert.alert(t("settings.error"), t("settings.notLoggedIn"));
      return;
    }

    setIsDeleting(true);

    try {
      // Try to delete directly first
      await apiService.deleteUser(firebaseUser.uid);
      await firebaseUser.delete();

      dispatch(clearProfile());
      dispatch(logout());
      setShowDeleteModal(false);
      router.replace("/welcome");
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      
      // If Firebase requires reauthentication
      if (error.code === "auth/requires-recent-login") {
        setShowDeleteModal(false);
        setShowReauthModal(true);
      } else {
        Alert.alert(
          t("settings.error"),
          error.message || t("settings.deleteError")
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, router, t, firebaseUser]);

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
        <Text style={styles.title}>{t("settings.title")}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Globe size={20} color={VSCodeColors.textPrimary} weight="bold" />
          <Text style={styles.sectionTitle}>{t("settings.language")}</Text>
        </View>

        <View style={styles.card}>
          {options.map((opt) => {
            const isSelected = currentLang === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.row, isSelected && styles.rowSelected]}
                onPress={() => handleSelect(opt.value)}
                activeOpacity={0.75}
              >
                <Text style={styles.rowText}>{opt.label}</Text>
                {isSelected && (
                  <Check size={18} color={VSCodeColors.accent} weight="bold" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Delete Account Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Trash size={20} color={VSCodeColors.error} weight="bold" />
          <Text style={[styles.sectionTitle, { color: VSCodeColors.error }]}>
            {t("settings.dangerZone")}
          </Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.deleteRow}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.deleteRowText}>
              {t("settings.deleteAccount")}
            </Text>
            <Trash size={18} color={VSCodeColors.error} weight="bold" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => !isDeleting && setShowDeleteModal(false)}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Warning size={48} color={VSCodeColors.error} weight="fill" />
            </View>

            <Text style={styles.modalTitle}>
              {t("settings.deleteAccountTitle")}
            </Text>

            <Text style={styles.modalMessage}>
              {t("settings.deleteAccountMessage")}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelButtonText}>
                  {t("settings.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                activeOpacity={0.75}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>
                    {t("settings.confirmDelete")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Re-authentication Modal */}
      <Modal
        visible={showReauthModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!isReauthing) {
            setShowReauthModal(false);
            setPassword("");
            setPasswordError("");
          }
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!isReauthing) {
              Keyboard.dismiss();
              setShowReauthModal(false);
              setPassword("");
              setPasswordError("");
            }
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${VSCodeColors.warning}20` }]}>
              <Warning size={48} color={VSCodeColors.warning} weight="fill" />
            </View>

            <Text style={styles.modalTitle}>
              {t("settings.reauthRequired")}
            </Text>

            <Text style={styles.modalMessage}>
              {t("settings.reauthDescription")}
            </Text>

            {/* Password auth */}
            {getAuthProvider() === "password" && (
              <View style={styles.passwordContainer}>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder={t("settings.enterPassword")}
                    placeholderTextColor={VSCodeColors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError("");
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeSlash size={20} color={VSCodeColors.textSecondary} />
                    ) : (
                      <Eye size={20} color={VSCodeColors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowReauthModal(false);
                  setPassword("");
                  setPasswordError("");
                }}
                disabled={isReauthing}
                activeOpacity={0.75}
              >
                <Text style={styles.cancelButtonText}>
                  {t("settings.cancel")}
                </Text>
              </TouchableOpacity>

              {getAuthProvider() === "password" && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmDeleteButton]}
                  onPress={handleReauthWithPassword}
                  disabled={isReauthing || !password.trim()}
                  activeOpacity={0.75}
                >
                  {isReauthing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmDeleteButtonText}>
                      {t("settings.confirmDelete")}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {getAuthProvider() === "google" && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.googleButton]}
                  onPress={handleReauthWithGoogle}
                  disabled={isReauthing}
                  activeOpacity={0.75}
                >
                  {isReauthing ? (
                    <ActivityIndicator size="small" color={VSCodeColors.textPrimary} />
                  ) : (
                    <Text style={styles.googleButtonText}>
                      {t("settings.continueWithGoogle")}
                    </Text>
                  )}
                </TouchableOpacity>
              )}

              {getAuthProvider() === "apple" && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.appleButton]}
                  onPress={handleReauthWithApple}
                  disabled={isReauthing}
                  activeOpacity={0.75}
                >
                  {isReauthing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.appleButtonText}>
                      {t("settings.continueWithApple")}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  title: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.3,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
  },
  card: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: VSCodeColors.border,
  },
  rowSelected: {
    backgroundColor: VSCodeColors.surface,
  },
  rowText: {
    fontSize: 15,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.sans || "system",
    fontWeight: FontWeights.medium,
  },
  deleteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  deleteRowText: {
    fontSize: 15,
    color: VSCodeColors.error,
    fontFamily: Fonts?.sans || "system",
    fontWeight: FontWeights.medium,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: VSCodeColors.panel,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${VSCodeColors.error}20`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    textAlign: "center",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.sans || "system",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: VSCodeColors.surface,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: FontWeights.semibold,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.sans || "system",
  },
  confirmDeleteButton: {
    backgroundColor: VSCodeColors.error,
  },
  confirmDeleteButtonText: {
    fontSize: 15,
    fontWeight: FontWeights.semibold,
    color: "#fff",
    fontFamily: Fonts?.sans || "system",
  },
  passwordContainer: {
    width: "100%",
    marginBottom: 16,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: VSCodeColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.sans || "system",
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    color: VSCodeColors.error,
    fontSize: 13,
    fontFamily: Fonts?.sans || "system",
    marginTop: 8,
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: VSCodeColors.border,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: FontWeights.semibold,
    color: "#333",
    fontFamily: Fonts?.sans || "system",
  },
  appleButton: {
    backgroundColor: "#000",
  },
  appleButtonText: {
    fontSize: 15,
    fontWeight: FontWeights.semibold,
    color: "#fff",
    fontFamily: Fonts?.sans || "system",
  },
});


