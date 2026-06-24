import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, Bot, User, MessageCircle } from "lucide-react";
import { ChatMessage } from "../types";

interface SymbolChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => void;
  isSending: boolean;
  dreamAnalysisContext: string;
}

const CONVERSATION_SUGGESTIONS = [
  "What does water represent in analytical psychology?",
  "What was the significance of the mysterious shadow figure?",
  "Why did the feeling of flying turn into falling?",
  "How can I integrate this lesson into my waking life?"
];

export default function SymbolChat({
  chatHistory,
  onSendMessage,
  isSending,
  dreamAnalysisContext,
}: SymbolChatProps) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom of chat thread when a new message is appended
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isSending) return;
    onSendMessage(suggestion);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col h-[520px]" id="symbol-chat-box">
      {/* Chat header */}
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-900/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Jungian Analytical Scholar</h4>
          <p className="text-[11px] text-slate-500">Unconscious symbol dialogue assistant</p>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800" id="chat-messages-container" ref={scrollRef}>
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-3">
            <MessageCircle className="w-10 h-10 text-indigo-500/40" />
            <div className="max-w-xs">
              <p className="text-sm font-medium text-slate-300">Dive deeper into the symbol matrix</p>
              <p className="text-xs text-slate-500 mt-1">
                Ask other questions about elements, characters, colors, or transitions you remember.
              </p>
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-1 gap-2 mt-4 w-full max-w-sm">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400/70 text-left px-1">Suggested prompts:</span>
              {CONVERSATION_SUGGESTIONS.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  id={`suggestion-${idx}`}
                  onClick={() => handleSuggestionClick(sug)}
                  className="w-full text-left text-xs bg-slate-950/65 hover:bg-slate-950 hover:text-indigo-300 transition text-slate-300 border border-slate-850 p-2.5 rounded-xl cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chatHistory.map((msg) => {
              const isBot = msg.role === "model";
              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`flex gap-3 max-w-[85%] ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs border ${
                    isBot 
                      ? "bg-slate-950 border-slate-800 text-indigo-400" 
                      : "bg-indigo-950/80 border-indigo-900 text-indigo-300"
                  }`}>
                    {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Body */}
                  <div className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                    isBot 
                      ? "bg-slate-950 text-slate-300 border border-slate-850" 
                      : "bg-indigo-600 text-white font-medium"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex gap-3 max-w-[80%] mr-auto" id="chat-typing-loader">
                <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-400">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Synthesizing psychological dynamics...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input container */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2" id="chat-input-form">
        <input
          type="text"
          id="chat-user-message-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isSending ? "Wait until analysis finishes..." : "Ask about a symbol... e.g. What did the key mean?"}
          disabled={isSending}
          className="flex-1 bg-slate-950 text-slate-200 border border-slate-850 rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition placeholder:text-slate-600"
        />
        <button
          type="submit"
          id="chat-submit-btn"
          disabled={!inputText.trim() || isSending}
          className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition flex items-center justify-center shadow"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
