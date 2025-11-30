import { useState } from "react";
import VideoUpload from "@/components/VideoUpload";
import ChatInterface from "@/components/ChatInterface";
import VideoCanvas from "@/components/VideoCanvas";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sparkles, LayoutTemplate, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [overlayCode, setOverlayCode] = useState<string>("");

  // Diese Funktion setzt alles zurück für ein neues Projekt
  const handleResetAll = () => {
    setOverlayCode("");
    // Optional: setVideoSrc(""); falls auch das Video gelöscht werden soll
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background/50 backdrop-blur-3xl">
      {/* 1. Header */}
      <header className="flex-none border-b border-border/40 bg-background/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-lg shadow-primary/20">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">Market-AI-ing</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium border border-border/50">
              Beta
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <Github className="w-4 h-4" />
              GitHub
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* LEFT SIDEBAR: Tools */}
          <ResizablePanel
            defaultSize={30}
            minSize={20}
            maxSize={40}
            className="bg-card/50 border-r border-border/40 flex flex-col"
          >
            <div className="flex-1 flex flex-col h-full">
              {/* Upload Section */}
              <div className="p-6 border-b border-border/40 bg-background/30">
                <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Source
                </h2>
                <VideoUpload onVideoUpload={setVideoSrc} />
              </div>

              {/* Chat Section */}
              <div className="flex-1 flex flex-col min-h-0 bg-background/20">
                <div className="p-4 pb-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Editor</h2>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    videoSrc={videoSrc}
                    currentCode={overlayCode} // WICHTIG: Wir geben den aktuellen Code weiter
                    onOverlayGenerated={setOverlayCode}
                    onReset={handleResetAll} // WICHTIG: Die Reset-Funktion
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>

          {/* DRAG HANDLE */}
          <ResizableHandle withHandle className="bg-border/40 hover:bg-primary/20 transition-colors" />

          {/* RIGHT CANVAS: The Stage */}
          <ResizablePanel defaultSize={70}>
            <div className="h-full w-full bg-muted/20 flex flex-col items-center justify-center p-8 relative">
              {/* Background Decoration */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: "radial-gradient(circle at 1px 1px, black 1px, transparent 0)",
                  backgroundSize: "40px 40px",
                }}
              ></div>

              <div className="relative z-10 w-full max-w-5xl flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <h2 className="text-lg font-medium text-foreground/80">Live Preview</h2>
                  {videoSrc && (
                    <span className="text-xs text-muted-foreground animate-pulse flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      Ready
                    </span>
                  )}
                </div>

                {/* The Canvas Component */}
                <div className="shadow-2xl shadow-black/10 rounded-xl overflow-hidden border border-border/60 ring-1 ring-white/20 bg-card">
                  <VideoCanvas
                    videoSrc={videoSrc}
                    overlayCode={overlayCode}
                    onResetOverlay={() => setOverlayCode("")}
                  />
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Changes in the chat appear here in real-time. Export when you're ready.
                </p>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
