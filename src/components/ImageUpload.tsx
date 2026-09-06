import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Loader2, ImagePlus } from "lucide-react";
import { predictDisease, type PredictionResult } from "@/lib/predictions.functions";
import { logActivity } from "@/lib/activity.functions";
import { getOrCreateActivitySessionId } from "@/lib/activity-client";
import { useI18n } from "@/lib/i18n";
import { CameraCapture } from "@/components/CameraCapture";
import { toast } from "sonner";

const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUpload({ onResult }: { onResult: (r: PredictionResult) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const predict = useServerFn(predictDisease);
  const log = useServerFn(logActivity);
  const { t, lang } = useI18n();

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  }

  async function handleFile(file: File) {
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      toast.error("Please use a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image too large (max 5 MB).");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("crop-images")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const result = await predict({
        data: { imageBase64: dataUrl, mimeType: file.type, storagePath: path, language: lang },
      });
      log({
        data: {
          event_type: "diagnosis",
          path: window.location.pathname,
          query: result.disease_name,
          session_id: getOrCreateActivitySessionId(),
          user_id: user.id,
          metadata: { crop: result.crop, confidence: result.confidence, is_healthy: result.is_healthy },
        },
      }).catch(() => {});
      onResult(result);
      toast.success("Diagnosis complete!");
    } catch (e) {
      toast.error((e as Error).message || "Diagnosis failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display"><Camera className="h-5 w-5 text-primary" /> {t("scanCrop")}</CardTitle>
        <CardDescription>{t("uploadHelp")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onClick={() => !busy && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`relative rounded-xl border-2 border-dashed border-border bg-muted/40 hover:bg-muted/70 transition-smooth cursor-pointer min-h-[260px] flex flex-col items-center justify-center text-center p-6 ${
            busy ? "pointer-events-none opacity-90" : ""
          }`}
        >
          {preview ? (
            <img src={preview} alt="preview" className="max-h-[260px] rounded-lg object-contain" />
          ) : (
            <>
              <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                <ImagePlus className="h-6 w-6" />
              </div>
              <p className="font-medium text-foreground">{t("tapToUpload")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("uploadFormats")}</p>
            </>
          )}
          {busy && (
            <div className="absolute inset-0 bg-background/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-sm font-medium">{t("analyzing")}</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => { setPreview(null); inputRef.current?.click(); }}
          >
            <Upload className="mr-2 h-4 w-4" /> {t("scanAnother")}
          </Button>
          <Button
            variant="default"
            disabled={busy}
            onClick={() => setCamOpen(true)}
          >
            <Camera className="mr-2 h-4 w-4" /> {t("takePhoto")}
          </Button>
        </div>
        <CameraCapture
          open={camOpen}
          onOpenChange={setCamOpen}
          onCapture={(file) => { setPreview(null); handleFile(file); }}
        />
      </CardContent>
    </Card>
  );
}
