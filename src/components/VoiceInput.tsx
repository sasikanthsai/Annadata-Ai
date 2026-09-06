import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type Props = {
  onTranscript: (text: string) => void;
  append?: boolean;
  className?: string;
  size?: "sm" | "icon";
  title?: string;
};

const LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
};

export function VoiceInput({ onTranscript, append = false, className, size = "icon", title }: Props) {
  const { lang } = useI18n();
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  useEffect(() => () => { try { recRef.current?.stop(); } catch {} }, []);

  function start() {
    const SR: any = (globalThis as any).SpeechRecognition || (globalThis as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input not supported on this browser. Try Chrome.");
      return;
    }
    try {
      const rec = new SR();
      rec.lang = LANG_MAP[lang] ?? "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      rec.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript ?? "";
        if (text) onTranscript(append ? " " + text : text);
      };
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function stop() {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }

  return (
    <Button
      type="button"
      size={size}
      variant={listening ? "destructive" : "outline"}
      onClick={listening ? stop : start}
      className={className}
      title={title ?? "Speak"}
      aria-label={title ?? "Speak"}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
