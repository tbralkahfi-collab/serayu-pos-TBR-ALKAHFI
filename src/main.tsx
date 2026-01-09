import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

// Minimal PWA wiring:
// 1) Register service worker (required for installability + offline cache)
// 2) Capture the install prompt so the "Install" button in Pengaturan works

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

registerSW({
  immediate: true,
});

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent browser mini-infobar and store the event for later triggering.
  e.preventDefault();
  (window as any).deferredPrompt = e as BeforeInstallPromptEvent;
});

window.addEventListener("appinstalled", () => {
  (window as any).deferredPrompt = null;
});

createRoot(document.getElementById("root")!).render(<App />);
