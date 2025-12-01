import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { VSCodeColors, Fonts } from "@/src/constants/theme";

import * as AppleAuthentication from "expo-apple-authentication";
import { GoogleIcon } from "@/assets/icons/google";
import { Button } from "@/src/components/Button";

import { useRouter, Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/src/firebase";

import { LoginModal } from "@/src/components/LoginModal";

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
} from "firebase/auth";

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // ---------------------------------------
  // GOOGLE SIGN-IN
  // ---------------------------------------
  const [request, response, promptGoogle] = Google.useAuthRequest({
    iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com",
    webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
    responseType: "id_token",
  });

  // ---------------------------------------
  // TYPEWRITER ANIMATION
  // ---------------------------------------
  const fullText = "SkillUp●";
  const [typedText, setTypedText] = useState("");

  // ---------------------------------------
  // BOTTOM SHEET ANIMATION
  // ---------------------------------------
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);

      signInWithCredential(auth, credential)
        .then(() => {
          Alert.alert(t("welcome.loggedIn"), t("welcome.googleLoginSuccess"));
        })
        .catch((err) => Alert.alert(t("welcome.googleError"), err.message));
    }
  }, [response]);

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

  // ---------------------------------------
  // APPLE SIGN-IN
  // ---------------------------------------
  const handleApple = async () => {
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

      await signInWithCredential(auth, credential);

      Alert.alert(t("welcome.loggedIn"), t("welcome.appleLoginSuccess"));
    } catch (err: any) {
      if (err.code === "ERR_CANCELED") return;
      Alert.alert(t("welcome.appleError"), err.message);
    }
  };

  // Перевірка автентифікації ПІСЛЯ всіх хуків
  if (isAuthenticated === true) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <LoginModal visible={showLogin} onClose={() => setShowLogin(false)} />

      <View style={styles.titleWrapper}>
        <Text style={styles.title}>{typedText}</Text>
      </View>

      {/* Bottom Sheet */}
      <Animated.View
        style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* Apple */}
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={16}
          style={{ width: "100%", height: 54 }}
          onPress={handleApple} // 🔥 Apple login
        />

        {/* Google */}
        <Button
          type="white"
          title={t("welcome.continueWithGoogle")}
          icon={<GoogleIcon size={20} />}
          onPress={() => promptGoogle()}
        />

        {/* Sign up */}
        <Button
          type="primary"
          title={t("welcome.signUp")}
          onPress={() => setShowLogin(true)}
        />

        {/* Log in */}
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
});
