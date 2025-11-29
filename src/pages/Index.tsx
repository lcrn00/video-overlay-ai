import { useState } from "react";
import VideoUpload from "@/components/VideoUpload";
import ChatInterface from "@/components/ChatInterface";
import VideoCanvas from "@/components/VideoCanvas";

const Index = () => {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [overlayCode, setOverlayCode] = useState<string>("");

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground tracking-tight">Market-AI-ing</h1>
              <p className="text-sm text-muted-foreground mt-1">Turn simple videos into market-ready assets</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Control Center */}
        <div className="w-96 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <VideoUpload onVideoUpload={setVideoSrc} />
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatInterface 
              videoSrc={videoSrc}
              onOverlayGenerated={setOverlayCode} 
            />
          </div>
        </div>

        {/* Right Panel - Live Canvas */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 p-8">
          <VideoCanvas videoSrc={videoSrc} overlayCode={overlayCode} />
        </div>
      </div>
    </div>
  );
};

export default Index;