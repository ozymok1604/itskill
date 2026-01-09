import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { VSCodeColors, Fonts } from "@/src/constants/theme";

import * as AppleAuthentication from "expo-apple-authentication";
import { Button } from "@/src/components/Button";

import { Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  onAuthStateChanged,
  OAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from "firebase/auth";
import { auth, appleProvider } from "@/src/firebase";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setUser, setLoading } from "@/src/store/slices/authSlice";
import { fetchUser, syncUser } from "@/src/store/slices/userSlice";

import { LoginModal } from "@/src/components/LoginModal";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [showLogin, setShowLogin] = useState(false);

  const fullText = "ITSkill●";
  const [typedText, setTypedText] = useState("");

  const slideAnim = useRef(new Animated.Value(300)).current;

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch(setUser(user));
      dispatch(setLoading(false));
    });
    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, index + 1));
      index++;
      if (index === fullText.length) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleAppleNative = async () => {
    try {
      const appleResult = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!appleResult.identityToken) {
        throw new Error("No identity token from Apple");
      }

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: appleResult.identityToken,
      });

      const userCredential = await signInWithCredential(auth, credential);

      if (userCredential.user) {
        try {
          await dispatch(
            syncUser({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
            })
          ).unwrap();
          await dispatch(fetchUser(userCredential.user.uid)).unwrap();
        } catch (error) {
          console.error("Failed to sync/fetch user profile:", error);
        }
      }
    } catch (err: any) {
      if (err.code === "ERR_CANCELED") return;
      console.error("Apple sign in error:", err.message);
    }
  };

  const handleAppleWeb = async () => {
    console.log("Starting Apple Web Sign In...");
    try {
      const userCredential = await signInWithPopup(auth, appleProvider);
      console.log("Sign in successful:", userCredential.user?.email);
      
      if (userCredential.user) {
        try {
          await dispatch(
            syncUser({
              uid: userCredential.user.uid,
              email: userCredential.user.email,
            })
          ).unwrap();
          await dispatch(fetchUser(userCredential.user.uid)).unwrap();
        } catch (error) {
          console.error("Failed to sync/fetch user profile:", error);
        }
      }
    } catch (err: any) {
      console.error("Apple sign in error:", err.code, err.message);
      if (err.code !== "auth/popup-closed-by-user") {
        alert(`Apple Sign-In Error: ${err.message}`);
      }
    }
  };

  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.container}>
      <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />

      <View style={styles.titleWrapper}>
        <Text style={styles.title}>{typedText}</Text>
      </View>

      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Apple Sign-In only on native iOS */}
        {Platform.OS !== "web" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={16}
            style={{ width: "100%", height: 54 }}
            onPress={handleAppleNative}
          />
        )}

        <Button
          type="primary"
          title={t("welcome.signUp")}
          onPress={() => setShowLogin(true)}
        />

        <Button
          type="secondary"
          title={t("welcome.logIn")}
          onPress={() => setShowLogin(true)}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: VSCodeColors.background,
    justifyContent: "flex-start",
    paddingTop: 60,
  },

  titleWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 26,
  },

  title: {
    textAlign: "center",
    fontSize: 34,
    fontWeight: "700",
    color: VSCodeColors.textPrimary,
    fontFamily: Fonts?.mono || "monospace",
    letterSpacing: 0.5,
  },

  bottomSheet: {
    width: "100%",
    padding: 20,
    paddingBottom: 40,
    gap: 14,
    backgroundColor: VSCodeColors.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: VSCodeColors.border,
    borderBottomWidth: 0,
    position: "absolute",
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: VSCodeColors.background,
  },
  loadingText: {
    color: VSCodeColors.textSecondary,
    fontFamily: Fonts?.mono || "monospace",
    fontSize: 14,
    marginTop: 12,
  },
});
