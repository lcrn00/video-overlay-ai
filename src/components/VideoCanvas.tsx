import { useEffect, useRef, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VideoCanvasProps {
  videoSrc: string;
  overlayCode: string;
  onResetOverlay?: () => void;
}

const DEMO_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const VideoCanvas = ({ videoSrc, overlayCode, onResetOverlay }: VideoCanvasProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [overlayError, setOverlayError] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Neuer State für Lade-Anzeige
  const { toast } = useToast();
  const currentVideoSrc = videoSrc || DEMO_VIDEO;

  // Diese Prüfung lassen wir drin, schadet nicht, ist aber im neuen Flow weniger kritisch
  const isValidHTML = (html: string): boolean => {
    if (!html || html.trim().length === 0) return true;
    if (!html.includes("<!DOCTYPE html>") && !html.includes("<html")) return false;
    return true;
  };

  useEffect(() => {
    if (overlayCode && iframeRef.current) {
      // Clean Overlay Logic
      let modifiedCode = overlayCode;
      if (!overlayCode.includes("background: transparent")) {
        modifiedCode = overlayCode.replace(
          /<body([^>]*)>/i,
          '<body$1 style="background: transparent !important; margin: 0; padding: 0; overflow: hidden;">',
        );
      }

      const iframeDoc = iframeRef.current.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(modifiedCode);
        iframeDoc.close();
      }
    }
  }, [overlayCode]);

  // Die NEUE Export-Funktion
  const handleDownload = async () => {
    if (!overlayCode) return;

    setIsExporting(true);
    toast({ title: "Preparing Export...", description: "Embedding video into HTML. This might take a moment." });

    try {
      // 1. Video in Base64 konvertieren (damit es offline funktioniert)
      let videoBase64 = currentVideoSrc;

      // Wir versuchen das Video herunterzuladen und zu konvertieren
      try {
        const response = await fetch(currentVideoSrc);
        const blob = await response.blob();

        // Helper: Blob zu Base64
        videoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("Konnte Video nicht einbetten, nutze Original-URL", e);
      }

      // 2. Den Overlay-Body extrahieren (ohne <html> tags, nur der Inhalt)
      const overlayBodyContent = overlayCode
        .replace(/<!DOCTYPE html>.*?<body[^>]*>/is, "")
        .replace(/<\/body>.*?<\/html>/is, "");

      // 3. Das finale HTML zusammenbauen ("Das Produkt")
      const completeHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Marketing Video Export</title>
  <style>
    /* Reset */
    body, html { margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; background: #000; }
    
    /* Container System */
    .video-wrapper { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    
    /* Layer 1: Das Video */
    .video-layer { 
      position: absolute; 
      top: 0; left: 0; 
      width: 100%; height: 100%; 
      object-fit: cover; 
      z-index: 1; 
    }
    
    /* Layer 2: Das Overlay */
    .overlay-layer { 
      position: absolute; 
      top: 0; left: 0; 
      width: 100%; height: 100%; 
      z-index: 10; 
      pointer-events: none; /* Klicks gehen durch */
    }
    
    /* Interaktive Elemente im Overlay wieder klickbar machen */
    .overlay-layer * { pointer-events: auto; }
  </style>
</head>
<body>
  <div class="video-wrapper">
    <video class="video-layer" autoplay loop muted playsinline>
      <source src="${videoBase64}" type="video/mp4">
    </video>
    
    <div class="overlay-layer">
      ${overlayBodyContent}
    </div>
  </div>
</body>
</html>`;

      // 4. Download starten
      const blob = new Blob([completeHTML], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "marketing-video-product.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Success!", description: "Video & Overlay exported as single HTML file." });
    } catch (error) {
      console.error("Export failed", error);
      toast({ title: "Export failed", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative w-full max-w-4xl">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
        {/* VIEWPORT: Hier zeigen wir Video + Overlay an */}
        {overlayCode ? (
          <>
            {/* Layer 1: React Video Player */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src={currentVideoSrc}
              autoPlay
              loop
              muted
              playsInline
            />
            {/* Layer 2: Iframe Overlay */}
            <iframe
              ref={iframeRef}
              className="absolute inset-0 w-full h-full border-0 pointer-events-none"
              style={{ zIndex: 10, background: "transparent" }}
              title="Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm border border-white/10">
              Waiting for generated code...
            </div>
          </div>
        )}

        {/* CONTROLS */}
        <div className="absolute bottom-4 left-4 flex gap-2 z-20">
          {overlayCode && (
            <>
              <Button
                onClick={handleDownload}
                disabled={isExporting}
                variant="secondary"
                size="sm"
                className="shadow-lg backdrop-blur-md bg-white/90 hover:bg-white"
              >
                {isExporting ? (
                  <span className="animate-pulse">Packaging Video...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Product
                  </>
                )}
              </Button>

              {onResetOverlay && (
                <Button onClick={onResetOverlay} variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCanvas;
