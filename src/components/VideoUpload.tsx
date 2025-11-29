import { useCallback } from "react";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoUploadProps {
  onVideoUpload: (src: string) => void;
}

const VideoUpload = ({ onVideoUpload }: VideoUploadProps) => {
  const { toast } = useToast();

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, WebM, etc.)",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    onVideoUpload(url);
    toast({
      title: "Video uploaded",
      description: "Your video is ready for editing",
    });
  }, [onVideoUpload, toast]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file (MP4, WebM, etc.)",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    onVideoUpload(url);
    toast({
      title: "Video uploaded",
      description: "Your video is ready for editing",
    });
  }, [onVideoUpload, toast]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="relative group"
    >
      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
        id="video-upload"
      />
      <label
        htmlFor="video-upload"
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-muted/50"
      >
        <Upload className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Upload your video</p>
        <p className="text-xs text-muted-foreground">or drag and drop</p>
      </label>
    </div>
  );
};

export default VideoUpload;