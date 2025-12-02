import { Tabs, Redirect } from "expo-router";
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { Drawer } from "react-native-drawer-layout";

import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { VSCodeColors } from "@/src/constants/theme";
import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { useAppSelector } from "@/src/store/hooks";
import { DrawerMenu } from "@/src/components/DrawerMenu";
import { DrawerProvider, useDrawer } from "@/src/contexts/DrawerContext";

function TabLayoutContent() {
  const { t } = useTranslation();
  const { isOpen, openDrawer, closeDrawer } = useDrawer();
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={VSCodeColors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Drawer
      open={isOpen}
      onOpen={openDrawer}
      onClose={closeDrawer}
      drawerType="slide"
      drawerPosition="left"
      drawerStyle={styles.drawer}
      overlayStyle={styles.overlay}
      renderDrawerContent={() => <DrawerMenu onClose={closeDrawer} />}
    >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: VSCodeColors.accent,
          tabBarInactiveTintColor: VSCodeColors.textMuted,
          tabBarStyle: {
            backgroundColor: VSCodeColors.panel,
            borderTopWidth: 1,
            borderTopColor: VSCodeColors.border,
            height: 80,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("tabs.home"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sections"
          options={{
            title: t("tabs.sections"),
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="paperplane.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    </Drawer>
  );
}

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={VSCodeColors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/welcome" />;
  }

  return (
    <DrawerProvider>
      <TabLayoutContent />
    </DrawerProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: VSCodeColors.background,
  },
  drawer: {
    width: 300,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
});
