import { useState, useEffect, useRef, FormEvent } from "react";
import { Send, RotateCcw } from "lucide-react";
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
  currentCode: string;
  onOverlayGenerated: (code: string) => void;
  onReset?: () => void; // <-- NEU: optionaler Reset-Prop
}

interface GenerateOverlayResponse {
  mode: "create" | "edit";
  code?: string;
  patch?: string;
  error?: string;
}

const ChatInterface = ({ videoSrc, currentCode, onOverlayGenerated, onReset }: ChatInterfaceProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Describe the animation or overlay you want to create. Once an overlay exists, I will only make precise edits (e.g. change price, adjust text, tweak colors).",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-overlay", {
        body: {
          prompt: trimmed,
          previousCode: currentCode && currentCode.trim().length > 0 ? currentCode : null,
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw new Error(error.message || "Error calling generate-overlay");
      }

      const res = data as GenerateOverlayResponse;

      if (res.error) {
        throw new Error(res.error);
      }

      let newCode = currentCode;

      if (res.mode === "create") {
        if (!res.code) {
          throw new Error("No code returned in create mode.");
        }
        newCode = res.code;
      } else if (res.mode === "edit") {
        if (!res.patch) {
          throw new Error("No patch returned in edit mode.");
        }
        newCode = applyPatch(currentCode, res.patch);
      } else {
        throw new Error("Unknown response mode from generate-overlay.");
      }

      onOverlayGenerated(newCode);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            res.mode === "create"
              ? "I've created your overlay based on your description."
              : "I've updated the existing overlay according to your request.",
        },
      ]);
    } catch (err: any) {
      console.error("Error in ChatInterface:", err);
      toast({
        title: "Error",
        description: err?.message || "Something went wrong while generating the overlay.",
        variant: "destructive",
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I ran into an error. Please try again or rephrase your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAll = () => {
    // Overlay zurücksetzen (falls vom Parent übergeben)
    if (onReset) {
      onReset();
    }
    // Chat zurücksetzen
    setMessages([
      {
        role: "assistant",
        content: "Overlay and chat have been reset. Describe a new ad overlay you want to generate.",
      },
    ]);
  };

  return (
    <div className="flex flex-col h-full bg-background/70 border border-border/60 rounded-2xl shadow-lg backdrop-blur-md">
      <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-sm">AI Overlay Chat</h2>
          <p className="text-xs text-muted-foreground">
            {currentCode
              ? "Edit the existing overlay with precise instructions."
              : "Describe a new ad overlay you want to generate."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {videoSrc && (
            <span className="text-[10px] rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5">
              Video loaded
            </span>
          )}
          {onReset && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleResetAll}
              title="Reset overlay & chat"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef as any}>
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-xl px-3 py-2 text-xs bg-muted text-foreground opacity-80">
                Generating…
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="border-t border-border/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              currentCode
                ? 'e.g. "Change the price from 199€ to 189€"'
                : 'e.g. "Create a glassmorphism credit card with a 4,999$ balance"'
            }
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

/**
 * Applies a JSON patch (from the LLM) to the existing HTML overlay string.
 * The patch must follow the GenerateOverlayResponse "operations" format.
 */
function applyPatch(currentHtml: string, patchJson: string): string {
  if (!currentHtml || !patchJson) return currentHtml;

  try {
    const patch = JSON.parse(patchJson) as {
      operations?: Array<{
        type: string;
        selector: string;
        value?: string;
        name?: string;
        property?: string;
        className?: string;
      }>;
    };

    if (!patch.operations || !Array.isArray(patch.operations)) {
      console.warn("No operations in patch JSON");
      return currentHtml;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHtml, "text/html");

    for (const op of patch.operations) {
      if (!op.selector) continue;
      const el = doc.querySelector(op.selector) as HTMLElement | null;
      if (!el) continue;

      switch (op.type) {
        case "setText":
          if (typeof op.value === "string") {
            el.textContent = op.value;
          }
          break;
        case "setAttr":
          if (op.name && typeof op.value === "string") {
            el.setAttribute(op.name, op.value);
          }
          break;
        case "setStyle":
          if (op.property && typeof op.value === "string") {
            el.style.setProperty(op.property, op.value);
          }
          break;
        case "addClass":
          if (op.className) {
            el.classList.add(op.className);
          }
          break;
        case "removeClass":
          if (op.className) {
            el.classList.remove(op.className);
          }
          break;
        default:
          console.warn("Unknown patch operation type:", op.type);
      }
    }

    return doc.body.innerHTML || currentHtml;
  } catch (err) {
    console.error("Failed to apply patch:", err);
    return currentHtml;
  }
}

export default ChatInterface;
