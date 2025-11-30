import { useState, useEffect, useRef } from "react";
import { Send, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  videoSrc: string;
  currentCode: string; // NEW: Receive the current code
  onOverlayGenerated: (code: string) => void;
  onReset: () => void; // NEW: Receive reset function
}

const ChatInterface = ({ videoSrc, currentCode, onOverlayGenerated, onReset }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome! Describe your overlay or upload a video to start.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // NEW: Button Logic to clear everything
  const handleNewProject = () => {
    setMessages([
      {
        role: "assistant",
        content: "Context cleared. Let's start something new! What do you have in mind?",
      },
    ]);
    onReset();
    toast({ title: "Fresh Start", description: "Project context has been reset." });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-overlay", {
        body: {
          prompt: userMessage,
          previousCode: currentCode || null, // NEW: Sending the memory to backend
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.code) throw new Error("No code generated");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: currentCode ? "I've updated the design based on your request." : "I've created the overlay for you!",
        },
      ]);

      onOverlayGenerated(data.code);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to generate overlay. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I ran into an issue generating that." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* NEW: Toolbar for Reset */}
      <div className="p-2 border-b border-border/30 flex justify-end bg-background/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewProject}
          className="text-xs text-muted-foreground hover:text-primary gap-1.5 h-8"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New Project
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 text-sm shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/80 text-foreground border border-border/50"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/50 text-foreground rounded-lg px-4 py-2 border border-border/50">
                <div className="flex space-x-1.5 items-center h-5">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border/40 bg-background/30 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentCode ? "Type to edit (e.g. 'make text bigger')..." : "Describe your overlay..."}
            disabled={isLoading}
            className="flex-1 shadow-sm bg-background/80 focus-visible:ring-primary/20"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shadow-sm">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
