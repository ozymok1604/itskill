import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/src/firebase";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { VSCodeColors } from "@/src/constants/theme";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setUser, setLoading } from "@/src/store/slices/authSlice";
import {
  fetchUser,
  clearProfile,
  getPositions,
} from "@/src/store/slices/userSlice";

export default function Index() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isLoading, user } = useAppSelector(
    (state) => state.auth
  );
  const {
    profile,
    isLoading: isProfileLoading,
    error: userError,
  } = useAppSelector((state) => state.user);

  useEffect(() => {
    dispatch(getPositions());
  }, [dispatch]);

  const loadedProfileUidRef = useRef<string | null>(null);

  useEffect(() => {
    dispatch(setLoading(true));
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch(setUser(user));
      dispatch(setLoading(false));

      console.log(user, "user");

      if (user) {
        if (
          loadedProfileUidRef.current === user.uid &&
          profile?.uid === user.uid
        ) {
          console.log("Profile already loaded for user:", user.uid);
          return;
        }

        try {
          const result = await dispatch(fetchUser(user.uid)).unwrap();
          console.log("User profile fetched:", result);
          loadedProfileUidRef.current = user.uid;
        } catch (error) {
          console.log(
            "User not found in backend, will redirect to onboarding:",
            error
          );
          loadedProfileUidRef.current = null;
        }
      } else {
        dispatch(clearProfile());
        loadedProfileUidRef.current = null;
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  useEffect(() => {
    if (profile?.uid) {
      loadedProfileUidRef.current = profile.uid;
    }
  }, [profile?.uid]);

  console.log("Index render:", {
    isAuthenticated,
    isLoading,
    isProfileLoading,
    hasProfile: !!profile,
    profilePosition: profile?.position,
    profileFull: profile,
    userError,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={VSCodeColors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  if (isProfileLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={VSCodeColors.accent} />
      </View>
    );
  }

  if (!profile && userError) {
    console.log("Redirecting to onboarding: no profile and has error");
    return <Redirect href="/onboarding" />;
  }

  if (!profile && !userError) {
    console.log("Redirecting to onboarding: no profile and no error");
    return <Redirect href="/onboarding" />;
  }

  if (
    profile &&
    (profile.position === null ||
      profile.position === undefined ||
      profile.position === "")
  ) {
    console.log("Redirecting to onboarding: profile exists but no position", {
      position: profile.position,
    });
    return <Redirect href="/onboarding" />;
  }

  console.log("Redirecting to tabs: profile exists and has position");
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: VSCodeColors.background,
  },
});
