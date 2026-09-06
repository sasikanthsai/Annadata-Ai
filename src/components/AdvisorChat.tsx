import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Bot,
  User,
} from "lucide-react";
import { askAdvisor } from "@/lib/advisor.functions";
import { logActivity } from "@/lib/activity.functions";
import {
  getCurrentActivityUserId,
  getOrCreateActivitySessionId,
} from "@/lib/activity-client";
import { useI18n, type Lang } from "@/lib/i18n";
import { toast } from "sonner";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

const LOCALE: Record<Lang, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
};

export function AdvisorChat({
  village,
  crop,
}: {
  village?: string | null;
  crop?: string | null;
}) {
  const { t, lang } = useI18n();

  const ask = useServerFn(askAdvisor);
  const log = useServerFn(logActivity);

  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Namaste 🌱 I'm your AI agronomist. Ask me about pests, fertilizers, irrigation, or anything you've seen on your crop today.",
    },
  ]);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  const recRef = useRef<{
    stop: () => void;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  /*
   * Keep the latest language available to speech callbacks.
   */
  const langRef = useRef<Lang>(lang);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  /*
   * Stop microphone and speech when leaving the page.
   */
  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        // Ignore microphone cleanup errors.
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /*
   * Scroll chat to the newest message.
   */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, speakingIdx]);

  /*
   * Find the best browser voice for the requested language.
   *
   * Some browsers do not expose "te-IN" exactly.
   * We therefore first try the exact locale and then
   * fall back to the base language such as "te".
   */
  function findVoice(locale: string): SpeechSynthesisVoice | null {
    if (
      typeof window === "undefined" ||
      !window.speechSynthesis
    ) {
      return null;
    }

    const voices = window.speechSynthesis.getVoices();

    if (!voices.length) {
      return null;
    }

    const exact = voices.find(
      (voice) => voice.lang.toLowerCase() === locale.toLowerCase(),
    );

    if (exact) {
      return exact;
    }

    const base = locale.split("-")[0].toLowerCase();

    const baseMatch = voices.find(
      (voice) => voice.lang.toLowerCase().split("-")[0] === base,
    );

    return baseMatch ?? null;
  }

  /*
   * Browser TTS.
   *
   * Chrome can sometimes have no voices immediately after
   * page load. We wait briefly and try again.
   */
  function speak(text: string, idx: number) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      toast.error("Voice playback is not supported in this browser.");
      return;
    }

    if (!text.trim()) {
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingIdx(idx);

    const locale = LOCALE[langRef.current];

    const startSpeech = () => {
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = locale;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voice = findVoice(locale);

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        setSpeakingIdx(null);
      };

      utterance.onerror = (event) => {
        console.error("[Advisor TTS]", event);
        setSpeakingIdx(null);
        toast.error("Unable to play the answer. Please try again.");
      };

      window.speechSynthesis.speak(utterance);
    };

    /*
     * Give Chrome time to populate its voice list.
     */
    if (window.speechSynthesis.getVoices().length === 0) {
      setTimeout(startSpeech, 250);
    } else {
      startSpeech();
    }
  }

  /*
   * Automatically speak the newest Gemini response.
   *
   * We keep this OFF by default so the user's browser does
   * not unexpectedly speak when they open the page.
   *
   * The speaker button remains the reliable manual control.
   */
  const mut = useMutation({
    mutationFn: async (next: Msg[]) =>
      ask({
        data: {
          messages: next,
          language: lang,
          village: village ?? null,
          crop: crop ?? null,
        },
      }),

    onSuccess: (r) => {
      setMessages((prev) => {
        const nextMessages = [
          ...prev,
          {
            role: "assistant" as const,
            content: r.reply,
          },
        ];

        return nextMessages;
      });
    },

    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  /*
   * Send a typed message.
   */
  function send() {
    const text = input.trim();

    if (!text || mut.isPending) {
      return;
    }

    /*
     * Stop any active speech before starting a new request.
     */
    if (
      typeof window !== "undefined" &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
    }

    const next: Msg[] = [
      ...messages,
      {
        role: "user",
        content: text,
      },
    ];

    setMessages(next);
    setInput("");

    getCurrentActivityUserId()
      .then((userId) =>
        log({
          data: {
            event_type: "advisor_chat",
            path: window.location.pathname,
            query: text,
            session_id: getOrCreateActivitySessionId(),
            user_id: userId,
            metadata: {
              crop: crop ?? null,
              village: village ?? null,
            },
          },
        }),
      )
      .catch(() => {});

    mut.mutate(next);
  }

  /*
   * Start/stop browser speech recognition.
   */
  function toggleMic() {
    if (typeof window === "undefined") {
      return;
    }

    const browserWindow = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };

    const SR =
      browserWindow.SpeechRecognition ??
      browserWindow.webkitSpeechRecognition;

    if (!SR) {
      toast.error(
        "Voice input is not supported in this browser. Please use Google Chrome.",
      );
      return;
    }

    if (listening) {
      try {
        recRef.current?.stop();
      } catch {
        // Ignore stop errors.
      }

      recRef.current = null;
      setListening(false);
      return;
    }

    /*
     * Do not create multiple recognition sessions.
     */
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        // Ignore.
      }

      recRef.current = null;
    }

    const rec = new SR();

    rec.lang = LOCALE[lang];
    rec.interimResults = false;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
    };

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();

      if (!transcript) {
        return;
      }

      /*
       * Put recognized speech into the input box.
       */
      setInput((current) =>
        current ? `${current} ${transcript}` : transcript,
      );
    };

    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };

    rec.onerror = (event) => {
      console.error("[Advisor Speech Recognition]", event);

      recRef.current = null;
      setListening(false);

      if (event.error === "not-allowed") {
        toast.error(
          "Microphone permission was denied. Allow microphone access and try again.",
        );
      } else if (event.error === "no-speech") {
        toast.error("I couldn't hear anything. Please try speaking again.");
      } else {
        toast.error("Voice input failed. Please try again.");
      }
    };

    recRef.current = rec;

    try {
      rec.start();
    } catch (error) {
      console.error("[Advisor Speech Recognition]", error);
      recRef.current = null;
      setListening(false);
      toast.error("Could not start the microphone.");
    }
  }

  return (
    <Card className="border-border/60 shadow-soft flex flex-col h-[calc(100vh-12rem)] min-h-[480px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 font-display">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          AI Crop Advisor
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 overflow-hidden p-4">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 pr-1"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                m.role === "user" ? "justify-end" : ""
              }`}
            >
              {m.role === "assistant" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}

                {m.role === "assistant" && (
                  <button
                    type="button"
                    onClick={() => speak(m.content, i)}
                    className="mt-2 flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-smooth"
                    aria-label={
                      speakingIdx === i
                        ? "Stop speaking"
                        : "Listen to answer"
                    }
                  >
                    {speakingIdx === i ? (
                      <>
                        <VolumeX className="h-3 w-3" />
                        {t("stop")}
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3 w-3" />
                        {t("listen")}
                      </>
                    )}
                  </button>
                )}
              </div>

              {m.role === "user" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {mut.isPending && (
            <div className="flex gap-2 items-center text-muted-foreground text-sm">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>

              <Loader2 className="h-4 w-4 animate-spin" />

              Thinking…
            </div>
          )}
        </div>

        <div className="flex items-end gap-2 border-t pt-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("askAnything")}
            rows={2}
            className="resize-none"
          />

          <Button
            type="button"
            variant={listening ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleMic}
            title={listening ? "Stop listening" : t("speak")}
            aria-label={
              listening
                ? "Stop microphone"
                : "Start microphone"
            }
          >
            {listening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          <Button
            type="button"
            onClick={send}
            disabled={mut.isPending || !input.trim()}
            size="icon"
            title="Send"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/*
 * Minimal browser SpeechRecognition shape.
 *
 * The Web Speech API is not consistently included in
 * TypeScript's standard DOM definitions, so we define the
 * pieces used by this component.
 */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;

  onstart?: () => void;

  onresult?: (event: {
    results: ArrayLike<
      ArrayLike<{
        transcript: string;
      }>
    >;
  }) => void;

  onend?: () => void;

  onerror?: (event: {
    error?: string;
  }) => void;

  start: () => void;
  stop: () => void;
};