import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoCanvasProps {
  videoSrc: string;
  overlayCode: string;
}

const DEMO_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const VideoCanvas = ({ videoSrc, overlayCode }: VideoCanvasProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentVideoSrc = videoSrc || DEMO_VIDEO;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [currentVideoSrc]);

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
        {overlayCode && (
          <div 
            className="absolute inset-0 pointer-events-none"
            dangerouslySetInnerHTML={{ __html: overlayCode }}
          />
        )}

        {/* Play/Pause Button Overlay */}
        <div className="absolute bottom-4 left-4">
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