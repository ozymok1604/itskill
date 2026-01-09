import { useEffect } from "react";
import { Platform } from "react-native";

const TIKTOK_PIXEL_ID = "D5GF48BC77U2KB72FEGG";

declare global {
  interface Window {
    ttq?: any;
    TiktokAnalyticsObject?: string;
  }
}

export function TikTokPixel() {
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined") return;

    // щоб не інжектити двічі
    if (window.ttq && window.ttq._installed) return;

    // 1) ставимо stub ttq
    (function (w: any, d: Document, t: string) {
      w.TiktokAnalyticsObject = t;
      const ttq = (w[t] = w[t] || []);
      ttq.methods = [
        "page",
        "track",
        "identify",
        "instances",
        "debug",
        "on",
        "off",
        "once",
        "ready",
        "alias",
        "group",
        "enableCookie",
        "disableCookie",
        "holdConsent",
        "revokeConsent",
        "grantConsent",
      ];
      ttq.setAndDefer = function (t: any, e: string) {
        t[e] = function () {
          t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
        };
      };
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);

      ttq._installed = true;

      // 2) підвантажуємо зовнішній скрипт
      const s = d.createElement("script");
      s.type = "text/javascript";
      s.async = true;
      s.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${TIKTOK_PIXEL_ID}&lib=${t}`;

      const first = d.getElementsByTagName("script")[0];
      first?.parentNode?.insertBefore(s, first);
    })(window, document, "ttq");

    // 3) базовий pageview
    window.ttq?.page();
  }, []);

  return null;
}
