import { useState, useEffect, useRef } from "react";
import { Send, Trash2, PlusCircle } from "lucide-react";
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
  currentCode?: string; // Neu: Der aktuelle Code
  onOverlayGenerated: (code: string) => void;
  onReset?: () => void; // Neu: Reset Funktion
}

const ChatInterface = ({ videoSrc, currentCode, onOverlayGenerated, onReset }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome! Describe the overlay you want to create (e.g. 'a floating credit card').",
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

  // Funktion für den "Neues Projekt" Button
  const handleNewProject = () => {
    setMessages([
      {
        role: "assistant",
        content: "Started a new project. What should we build?",
      },
    ]);
    if (onReset) onReset();
    toast({ title: "New Project", description: "Context cleared." });
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
          previousCode: currentCode || null, // WICHTIG: Wir senden den alten Code mit!
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.code) throw new Error("No overlay code generated");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I updated the overlay based on your request!",
        },
      ]);

      onOverlayGenerated(data.code);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to generate overlay.",
        variant: "destructive",
      });
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header mit Reset Button */}
      <div className="p-2 border-b border-border/30 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewProject}
          className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1"
        >
          <PlusCircle className="w-3 h-3" />
          New Project
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-lg px-4 py-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentCode ? "Describe changes (e.g., 'make text bigger')..." : "Describe your overlay..."}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
