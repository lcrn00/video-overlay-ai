import { useState, useEffect, useRef } from "react";
import { Send, PlusCircle, Wand2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  videoSrc: string;
  currentCode: string;
  onOverlayGenerated: (code: string) => void;
  onReset: () => void;
}

const ChatInterface = ({ videoSrc, currentCode, onOverlayGenerated, onReset }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Welcome! I'm ready to create your overlay. Just describe what you want.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const mode = currentCode ? "edit" : "create";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewProject = () => {
    setMessages([
      {
        role: "assistant",
        content: "Context cleared. Starting fresh! What should we build?",
      },
    ]);
    onReset();
    toast({ title: "Fresh Start", description: "Switched back to Creator Mode." });
  };

  // === DIE PATCHING ENGINE ===
  const applyPatch = (original: string, patch: string): string => {
    // Prüfen, ob es überhaupt ein Patch ist
    if (!patch.includes("<<<<<<< SEARCH")) {
      return patch; // Kein Patch -> Es ist wohl neuer Code (Creator Mode)
    }

    let newCode = original;
    const regex = /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
    let match;
    let changesApplied = 0;

    while ((match = regex.exec(patch)) !== null) {
      const [_, searchBlock, replaceBlock] = match;

      // Wir versuchen den Block zu finden
      if (newCode.includes(searchBlock)) {
        newCode = newCode.replace(searchBlock, replaceBlock);
        changesApplied++;
      } else {
        // Fallback: Manchmal macht die KI Whitespace-Fehler. Wir versuchen es getrimmt.
        const trimmedCode = newCode.replace(/\s+/g, " ");
        const trimmedSearch = searchBlock.replace(/\s+/g, " ");

        if (trimmedCode.includes(trimmedSearch)) {
          // Hier müssten wir komplexer ersetzen, für jetzt warnen wir nur
          console.warn("Fuzzy match found but strict replace failed for:", searchBlock);
        } else {
          console.error("Could not find code block to replace:", searchBlock);
        }
      }
    }

    if (changesApplied === 0) {
      console.warn("Patch received but no changes applied. Structure mismatch?");
      // Im Zweifel geben wir das Original zurück oder den Patch als Fehler
      return original;
    }

    return newCode;
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
          previousCode: currentCode || null,
          mode: mode,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.code) throw new Error("No response generated");

      // Hier entscheiden wir: Ist es ein neuer Code oder ein Patch?
      const finalCode = mode === "edit" ? applyPatch(currentCode, data.code) : data.code;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            mode === "create"
              ? "I've created the overlay based on your description."
              : "I've applied your changes strictly.",
        },
      ]);

      onOverlayGenerated(finalCode);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to process request.",
        variant: "destructive",
      });
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I ran into an issue." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/40">
      <div className="px-4 py-3 border-b border-border/30 flex justify-between items-center bg-background/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Badge
            variant={mode === "create" ? "default" : "secondary"}
            className="transition-all duration-300 gap-1.5 px-3 py-1"
          >
            {mode === "create" ? (
              <>
                <Wand2 className="w-3.5 h-3.5" /> Creator Mode
              </>
            ) : (
              <>
                <PenTool className="w-3.5 h-3.5" /> Editor Mode
              </>
            )}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewProject}
          className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 h-7"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          New
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted/80 text-foreground border border-border/50 rounded-bl-none"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted/50 text-foreground rounded-2xl rounded-bl-none px-4 py-3 border border-border/50">
                <div className="flex space-x-1.5 items-center h-full">
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-100" />
                  <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-200" />
                  <span className="ml-2 text-xs text-muted-foreground font-medium">
                    {mode === "create" ? "Generating..." : "Patching Code..."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border/40 bg-background/60 backdrop-blur-md">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "create"
                ? "Describe your overlay (e.g. 'Comments popping up left')..."
                : "Strict edit (e.g. 'Change text color to blue')..."
            }
            disabled={isLoading}
            className="flex-1 shadow-sm bg-background/80 focus-visible:ring-primary/20 transition-all"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shadow-sm shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
