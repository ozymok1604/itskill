import "@/src/i18n";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { Provider } from "react-redux";
import Head from "expo-router/head";

import { useColorScheme } from "@/src/hooks/use-color-scheme";
import { store } from "@/src/store";

export const unstable_settings = {
  initialRouteName: "index",
  navigationPersistenceKey: null,
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
         <Head>
       <script
          dangerouslySetInnerHTML={{
            __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}; 
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){
    var r="https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r;
    ttq._t=ttq._t||{},ttq._t[e]=+new Date;
    ttq._o=ttq._o||{},ttq._o[e]=n||{};
    n=document.createElement("script");n.type="text/javascript";
    n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;
    e=document.getElementsByTagName("script")[0];
    e.parentNode.insertBefore(n,e)
  };
  ttq.load('D5GF48BC77U2KB72FEGG');
  ttq.page();
}(window, document, 'ttq');
            `,
          }}
        />
        </Head>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ freezeOnBlur: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="test" options={{ headerShown: false }} />
          <Stack.Screen name="test-results" options={{ headerShown: false }} />
          <Stack.Screen name="test-ai-voice" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    </Provider>
  );
}
