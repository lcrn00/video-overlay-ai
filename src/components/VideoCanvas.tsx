import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCanvasProps {
  videoSrc: string;
  overlayCode: string;
  onResetOverlay?: () => void;
}

const DEMO_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const VideoCanvas = ({ videoSrc, overlayCode, onResetOverlay }: VideoCanvasProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [overlayError, setOverlayError] = useState(false);
  const currentVideoSrc = videoSrc || DEMO_VIDEO;

  const isValidHTML = (html: string): boolean => {
    if (!html || html.trim().length === 0) return true;
    
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
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [currentVideoSrc]);

  useEffect(() => {
    if (overlayCode) {
      setOverlayError(!isValidHTML(overlayCode));
    } else {
      setOverlayError(false);
    }
  }, [overlayCode]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="relative w-full max-w-4xl">
      <div className="relative aspect-video bg-card rounded-lg overflow-hidden shadow-lg border border-border">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          loop
        >
          <source src={currentVideoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay Container */}
        {overlayCode && !overlayError && (
          <div 
            className="absolute inset-0 pointer-events-none"
            dangerouslySetInnerHTML={{ __html: overlayCode }}
          />
        )}

        {/* Overlay Error Message */}
        {overlayError && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md text-center shadow-lg">
              <p className="text-foreground font-medium mb-2">Overlay Error</p>
              <p className="text-sm text-muted-foreground mb-4">
                The generated overlay appears to be incomplete or malformed.
              </p>
              {onResetOverlay && (
                <Button onClick={onResetOverlay} variant="secondary">
                  Reset Overlay
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Play/Pause Button Overlay */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button
            onClick={togglePlay}
            size="icon"
            variant="secondary"
            className="rounded-full w-12 h-12 shadow-lg hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </Button>
          
          {overlayCode && onResetOverlay && (
            <Button
              onClick={onResetOverlay}
              variant="secondary"
              size="sm"
              className="shadow-lg"
            >
              Reset Overlay
            </Button>
          )}
        </div>
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