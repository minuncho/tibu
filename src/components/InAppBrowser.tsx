"use client";

import { useEffect, useState } from "react";

// Browsers embedded in chat and social apps (KakaoTalk, Instagram, ...) usually cannot
// save images, and Google sign-in may be refused there. This sends the visitor to their
// real browser where that is possible, and otherwise shows how to get there.

type InApp = { name: "kakao" | "line" | "other"; android: boolean };

function detect(): InApp | null {
  const ua = navigator.userAgent;
  const android = /Android/i.test(ua);
  if (/KAKAOTALK/i.test(ua)) return { name: "kakao", android };
  if (/\bLine\//i.test(ua)) return { name: "line", android };
  // The Naver app is left out on purpose: it is a full browser where sign-in and saving work.
  if (/Instagram|FBAN|FBAV|FB_IAB|DaumApps|everytimeApp|Twitter|Snapchat/i.test(ua)) {
    return { name: "other", android };
  }
  return null;
}

// Returns false when there is no way to switch browsers from code (iOS, apart from KakaoTalk and Line).
function openExternal(app: InApp) {
  const url = location.href;
  if (app.name === "kakao") {
    location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
    return true;
  }
  if (app.name === "line") {
    const next = new URL(url);
    next.searchParams.set("openExternalBrowser", "1");
    location.href = next.toString();
    return true;
  }
  if (app.android) {
    location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;end`;
    return true;
  }
  return false;
}

const TRIED_KEY = "triedExternalBrowser";

export function InAppBrowser() {
  const [app, setApp] = useState<InApp | null>(null);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const found = detect();
    if (!found) return;
    setApp(found);
    // KakaoTalk can hand the page over by itself; try once, and keep the bar as a fallback.
    if (found.name === "kakao" && !sessionStorage.getItem(TRIED_KEY)) {
      sessionStorage.setItem(TRIED_KEY, "1");
      openExternal(found);
    }
  }, []);

  if (!app) return null;
  return (
    <div className="inapp">
      <span>
        {hint
          ? "Tap the ⋯ or share button, then choose “Open in browser”."
          : "Open in your browser to sign in and save images."}
      </span>
      {!hint && (
        <button onClick={() => !openExternal(app) && setHint(true)}>Open</button>
      )}
    </div>
  );
}
