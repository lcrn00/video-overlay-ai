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
  const [overlayError, setOverlayError] = useState(false);
  const { toast } = useToast();
  const currentVideoSrc = videoSrc || DEMO_VIDEO;

  const isValidHTML = (html: string): boolean => {
    if (!html || html.trim().length === 0) return true;
    
    // Check if it's a complete HTML document
    if (!html.includes('<!DOCTYPE html>') && !html.includes('<html')) {
      return false;
    }
    
    // Check for common signs of truncated HTML
    const openTags = (html.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (html.match(/<\/[^>]+>/g) || []).length;
    const selfClosingTags = (html.match(/<[^>]+\/>/g) || []).length;
    
    // Allow some tolerance for self-closing tags
    const expectedCloseTags = openTags - selfClosingTags;
    
    // If difference is too large, likely truncated
    if (Math.abs(expectedCloseTags - closeTags) > 3) {
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    if (overlayCode) {
      const isValid = isValidHTML(overlayCode);
      setOverlayError(!isValid);
      
      if (isValid && iframeRef.current) {
        // Write the complete HTML to the iframe
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(overlayCode);
          iframeDoc.close();
        }
      }
    } else {
      setOverlayError(false);
    }
  }, [overlayCode]);

  const handleDownload = () => {
    if (!overlayCode) {
      toast({
        title: "No content",
        description: "Generate an overlay first before downloading.",
        variant: "destructive",
      });
      return;
    }

    const blob = new Blob([overlayCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marketing-video.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "HTML file saved successfully!",
    });
  };

  return (
    <div className="relative w-full max-w-4xl">
      <div className="relative aspect-video bg-card rounded-lg overflow-hidden shadow-lg border border-border">
        {!overlayCode ? (
          // Show placeholder when no overlay is generated
          <div className="flex items-center justify-center h-full bg-muted/50">
            <div className="text-center p-8">
              <p className="text-foreground font-medium mb-2">No overlay generated yet</p>
              <p className="text-sm text-muted-foreground">
                Use the chat to describe the marketing overlay you want to create
              </p>
            </div>
          </div>
        ) : overlayError ? (
          // Show error message
          <div className="flex items-center justify-center h-full bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md text-center shadow-lg">
              <p className="text-foreground font-medium mb-2">Overlay Error</p>
              <p className="text-sm text-muted-foreground mb-4">
                The generated HTML appears to be incomplete or malformed.
              </p>
              {onResetOverlay && (
                <Button onClick={onResetOverlay} variant="secondary">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Overlay
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Show the generated HTML in an iframe
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Marketing Video Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {/* Action Buttons */}
        {overlayCode && !overlayError && (
          <div className="absolute bottom-4 left-4 flex gap-2">
            <Button
              onClick={handleDownload}
              variant="secondary"
              size="sm"
              className="shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download HTML
            </Button>
            
            {onResetOverlay && (
              <Button
                onClick={onResetOverlay}
                variant="secondary"
                size="sm"
                className="shadow-lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        )}
      </div>

      {!videoSrc && (
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Using demo video. Upload your own to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoCanvas;