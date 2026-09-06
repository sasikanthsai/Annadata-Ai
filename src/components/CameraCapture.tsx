import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCcw, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
};

export function CameraCapture({ open, onOpenChange, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [snap, setSnap] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!open) {
      stopStream();
      setSnap(null);
      setReady(false);
      return;
    }
    startStream(facing);
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facing]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function startStream(mode: "environment" | "user") {
    setStarting(true);
    setReady(false);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setReady(true);
      }
    } catch (e) {
      toast.error("Could not access camera. Please allow permission.");
      onOpenChange(false);
    } finally {
      setStarting(false);
    }
  }

  function capture() {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    setSnap(canvas.toDataURL("image/jpeg", 0.9));
  }

  async function confirm() {
    if (!snap) return;
    const res = await fetch(snap);
    const blob = await res.blob();
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Take a photo
          </DialogTitle>
        </DialogHeader>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black">
          {snap ? (
            <img src={snap} alt="capture" className="h-full w-full object-contain" />
          ) : (
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          )}
          {(starting || (!ready && !snap)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
            disabled={!!snap}
          >
            <RefreshCcw className="h-4 w-4 mr-1" /> Flip
          </Button>
          <div className="flex gap-2">
            {snap ? (
              <>
                <Button variant="outline" onClick={() => setSnap(null)}>
                  <X className="h-4 w-4 mr-1" /> Retake
                </Button>
                <Button onClick={confirm}>
                  <Check className="h-4 w-4 mr-1" /> Use photo
                </Button>
              </>
            ) : (
              <Button onClick={capture} disabled={!ready}>
                <Camera className="h-4 w-4 mr-1" /> Capture
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
