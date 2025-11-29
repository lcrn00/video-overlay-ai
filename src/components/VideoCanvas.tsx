import { useRef } from "react";
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
  const { toast } = useToast();
  const currentVideoSrc = videoSrc || DEMO_VIDEO;

  // Wir bauen den Rahmen für den Code Schnipsel selbst
  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: transparent !important; }
        </style>
      </head>
      <body>
        ${overlayCode || ""}
      </body>
    </html>
  `;

  const handleDownload = () => {
    if (!overlayCode) return;
    // Für den Download packen wir Video und Code zusammen in eine Datei
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<style>
  body, html { margin: 0; padding: 0; width: 100%; height: 100vh; overflow: hidden; }
  #video-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: -1; }
  #overlay-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; pointer-events: none; }
  #overlay-layer * { pointer-events: auto; }
</style>
</head>
<body>
  <video id="video-bg" src="${currentVideoSrc}" autoplay loop muted playsinline></video>
  <div id="overlay-layer">${overlayCode}</div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marketing-video.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "HTML overlay saved!" });
  };

  return (
    <div className="relative w-full max-w-4xl">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
        {/* Layer 1: Das React Video */}
        <video
          src={currentVideoSrc}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />

        {/* Layer 2: Das Overlay Iframe */}
        {overlayCode ? (
          <iframe
            className="absolute inset-0 w-full h-full border-0 z-10 pointer-events-none"
            srcDoc={srcDoc}
            title="Overlay Preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ background: "transparent" }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm border border-white/10">
              Warte auf Overlay...
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="absolute bottom-4 left-4 z-20 flex gap-2">
          {overlayCode && (
            <>
              <Button onClick={handleDownload} variant="secondary" size="sm" className="shadow-lg">
                <Download className="w-4 h-4 mr-2" />
                Export HTML
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
