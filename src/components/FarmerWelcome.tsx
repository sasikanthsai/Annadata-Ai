import { useEffect, useState } from "react";

const AGRICULTURE_GIF =
  "https://ajinkyaindia.com/assets/img/home-two/Ajinkya-agriculture.gif";

export function FarmerWelcome() {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Speak the welcome message.
    const speakWelcome = () => {
      if (!("speechSynthesis" in window)) return;

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(
          "Namaste! Welcome to Annadata AI!",
        );

        utterance.lang = "en-IN";
        utterance.rate = 0.88;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Prefer an Indian English voice when available.
        const voices = window.speechSynthesis.getVoices();

        const indianVoice =
          voices.find(
            (voice) =>
              voice.lang.toLowerCase() === "en-in" ||
              voice.lang.toLowerCase().startsWith("en-in"),
          ) ??
          voices.find((voice) =>
            voice.lang.toLowerCase().startsWith("en"),
          );

        if (indianVoice) {
          utterance.voice = indianVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch {
        // Speech is optional.
        // Never break the application if speech is unavailable.
      }
    };

    // Some browsers load voices asynchronously.
    const handleVoicesChanged = () => {
      speakWelcome();

      window.speechSynthesis.removeEventListener(
        "voiceschanged",
        handleVoicesChanged,
      );
    };

    if ("speechSynthesis" in window) {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handleVoicesChanged,
      );
    }

    // Start the welcome voice shortly after the loader appears.
    const speechTimer = window.setTimeout(() => {
      speakWelcome();
    }, 600);

    /*
     * =======================================================
     * EXACT 4-SECOND LOADER
     * =======================================================
     *
     * 0.0 sec  → Loader appears
     * 0.6 sec  → Welcome voice starts
     * 3.3 sec  → Fade-out begins
     * 4.0 sec  → Loader completely disappears
     */

    const closeTimer = window.setTimeout(() => {
      setClosing(true);
    }, 3300);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }, 4000);

    return () => {
      window.clearTimeout(speechTimer);
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.removeEventListener(
          "voiceschanged",
          handleVoicesChanged,
        );

        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`annadata-welcome-loader ${
        closing ? "annadata-welcome-loader--closing" : ""
      }`}
      aria-label="Welcome to Annadata AI"
      role="status"
    >
      {/* =====================================================
          AGRICULTURE GIF BACKGROUND
          ===================================================== */}

      <img
        src={AGRICULTURE_GIF}
        alt=""
        className="annadata-welcome-loader__background"
        draggable={false}
      />

      {/* =====================================================
          READABILITY OVERLAY
          ===================================================== */}

      <div className="annadata-welcome-loader__overlay" />

      {/* =====================================================
          WELCOME CONTENT
          ===================================================== */}

      <div className="annadata-welcome-loader__content">
        <div className="annadata-welcome-loader__badge">
          🌾 SMART FARMING • AI POWERED
        </div>

        <h1 className="annadata-welcome-loader__title">
          Welcome to
          <span>Annadata AI</span>
        </h1>

        <p className="annadata-welcome-loader__subtitle">
          Your intelligent farming companion
        </p>

        <div
          className="annadata-welcome-loader__loading"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}