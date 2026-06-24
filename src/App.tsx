import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Trash2, 
  Plus, 
  Calendar, 
  BookOpen, 
  Eye, 
  MessageSquare, 
  Database, 
  Download, 
  Upload, 
  Info, 
  ChevronRight, 
  AlertTriangle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Dream, ChatMessage } from "./types";
import { SAMPLE_DREAM } from "./data";
import AudioRecorder from "./components/AudioRecorder";
import ImageConfigure from "./components/ImageConfigure";
import AnalysisDetail from "./components/AnalysisDetail";
import SymbolChat from "./components/SymbolChat";

export default function App() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selectedDreamId, setSelectedDreamId] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Image generation size and ratio states
  const [sizeSelection, setSizeSelection] = useState<"1K" | "2K" | "4K">("1K");
  const [aspectRatioSelection, setAspectRatioSelection] = useState<"1:1" | "16:9" | "4:3" | "3:4">("1:1");
  
  // Processing state variables
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Active viewing tab inside dream layout
  const [activeTab, setActiveTab] = useState<"analysis" | "chat">("analysis");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Initialize and load dreams from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("dream_journal_collection");
      if (stored) {
        const parsed = JSON.parse(stored) as Dream[];
        setDreams(parsed);
        if (parsed.length > 0) {
          setSelectedDreamId(parsed[0].id);
        }
      } else {
        // First boot: populate with sample dream so the UI is breathtakingly complete
        const initial = [SAMPLE_DREAM];
        localStorage.setItem("dream_journal_collection", JSON.stringify(initial));
        setDreams(initial);
        setSelectedDreamId(SAMPLE_DREAM.id);
      }
    } catch (err) {
      console.error("Failed to load local storage:", err);
    }
  }, []);

  // Update localStorage whenever dreams array changes
  const saveToStorage = (updatedList: Dream[]) => {
    localStorage.setItem("dream_journal_collection", JSON.stringify(updatedList));
    setDreams(updatedList);
  };

  const activeDream = dreams.find((d) => d.id === selectedDreamId) || null;

  // Handle new dream submit from AudioRecorder
  const handleDreamSubmit = async (manualText: string, audioBase64?: string) => {
    setIsProcessing(true);
    setErrorStatus(null);
    
    let currentRawNarrative = manualText;

    try {
      // Step 1: Transcribe audio if any was captured
      if (audioBase64) {
        setProcessingStage("transcribing speech patterns...");
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audio: audioBase64, mimeType: "audio/webm" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed speech transcription.");
        currentRawNarrative = data.transcription;
      }

      if (!currentRawNarrative || !currentRawNarrative.trim()) {
        throw new Error("Dream text narrative cannot be vacant. Please speak or type your vision.");
      }

      // Step 2: Extract archetypes and symbols
      setProcessingStage("unearthing classical symbolic archetypes...");
      const interpretRes = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dreamText: currentRawNarrative }),
      });
      const interpretData = await interpretRes.json();
      if (!interpretRes.ok) throw new Error(interpretData.error || "Psychological analysis collapsed.");

      // Step 3: Call surreal master synthesizer with user selected quality (1K, 2K, 4K)
      setProcessingStage(`drawing visual translation scene (${sizeSelection})...`);
      const imageRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${interpretData.title}. Theme: ${interpretData.emotionalTheme}`,
          size: sizeSelection,
          aspectRatio: aspectRatioSelection,
        }),
      });
      const imageData = await imageRes.json();
      if (!imageRes.ok) throw new Error(imageData.error || "Visual generation failed.");

      // Step 4: Construct final Dream record and state save
      const finalDream: Dream = {
        id: "dream-" + Date.now().toString(),
        date: new Date().toISOString(),
        title: interpretData.title || "Untold Reflection",
        transcription: currentRawNarrative,
        imageUrl: imageData.imageUrl,
        imageSize: sizeSelection,
        imageAspectRatio: aspectRatioSelection,
        analysis: interpretData,
        chatHistory: [
          {
            id: `chat-${Date.now()}-0`,
            role: "model",
            text: `Welcome to your dream analytical sanctuary. I have indexed your report: "${interpretData.title}". The dominant theme involves: "${interpretData.emotionalTheme}". Which symbol or lingering detail would you like to explore deeper?`
          }
        ]
      };

      const updated = [finalDream, ...dreams];
      saveToStorage(updated);
      setSelectedDreamId(finalDream.id);
      setIsCreating(false);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err?.message || "An unidentified error block occurred in the unconscious portal.");
    } finally {
      setIsProcessing(false);
      setProcessingStage("");
    }
  };

  // Handle conversational dialogue with therapist model
  const handleChatSendMessage = async (text: string) => {
    if (!activeDream || !activeDream.analysis || isSendingChat) return;

    const userMsg: ChatMessage = {
      id: "chat-user-" + Date.now(),
      role: "user",
      text,
    };

    const currentHistory = [...activeDream.chatHistory, userMsg];

    // Optimistically update list state
    const intermediateDreams = dreams.map((d) => 
      d.id === activeDream.id ? { ...d, chatHistory: currentHistory } : d
    );
    setDreams(intermediateDreams);
    setIsSendingChat(true);

    try {
      const contextBundle = `
      Dream Title: ${activeDream.analysis.title}
      Narrative: ${activeDream.transcription}
      Theme: ${activeDream.analysis.emotionalTheme}
      Analysis Summary: ${activeDream.analysis.analysis}
      Indicated Symbols: ${activeDream.analysis.symbols.map(s => `${s.name}: ${s.meaning}`).join(" | ")}
      Indicated Archetypes: ${activeDream.analysis.archetypes.map(a => `${a.name}: ${a.explanation}`).join(" | ")}
      `;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentHistory.map(m => ({ role: m.role, text: m.text })),
          dreamContext: contextBundle
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Symbol guide lost transmission.");

      const modelMsg: ChatMessage = {
        id: "chat-reply-" + Date.now(),
        role: "model",
        text: data.reply,
      };

      const finalDreams = dreams.map((d) => 
        d.id === activeDream.id ? { ...d, chatHistory: [...currentHistory, modelMsg] } : d
      );
      saveToStorage(finalDreams);
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: "chat-err-" + Date.now(),
        role: "model",
        text: `⚠️ Guide Error: ${err?.message || "Could not synchronize message. Please verify your internet connection and API key configurations."}`
      };
      const finalDreams = dreams.map((d) => 
        d.id === activeDream.id ? { ...d, chatHistory: [...currentHistory, errMsg] } : d
      );
      saveToStorage(finalDreams);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Delete dream narrative from diary
  const handleDeleteDream = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to discard this dream from your unconscious archive? This cannot be undone.")) return;
    const filtered = dreams.filter((d) => d.id !== id);
    saveToStorage(filtered);
    if (selectedDreamId === id && filtered.length > 0) {
      setSelectedDreamId(filtered[0].id);
    }
  };

  // Export entire log to a JSON database backup file
  const handleExportDB = () => {
    try {
      const dataStr = JSON.stringify(dreams, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataUri);
      downloadAnchor.setAttribute("download", `dream_journal_export_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Failed to export dream records data.");
    }
  };

  // Import JSON backup records to merge/overwrite
  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
            const merged = [...parsed, ...dreams.filter((old) => !parsed.some((imp: any) => imp.id === old.id))];
            saveToStorage(merged);
            setSelectedDreamId(merged[0].id);
            alert(`Successfully loaded ${parsed.length} database logs into your archive!`);
          } else {
            alert("Broken format inside imported file. Expected standard dream logs list.");
          }
        } catch (err) {
          alert("Could not load backup. Ensure the file contains authentic JSON schema.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Helper formatting for date
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  // Aspect ratio css sizing utilities
  const getAspectRatioClass = (ratio: "1:1" | "16:9" | "4:3" | "3:4") => {
    switch (ratio) {
      case "16:9": return "aspect-video";
      case "4:3": return "aspect-[4/3]";
      case "3:4": return "aspect-[3/4] max-h-[500px] object-contain mx-auto";
      case "1:1":
      default:
        return "aspect-square";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white" id="main-dream-app">
      {/* Top Banner Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-300 to-indigo-400 bg-clip-text text-transparent">
              Dream Journal
            </h1>
            <p className="text-[11px] text-slate-500 font-mono tracking-widest uppercase">The Unconscious Lexicon</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Export/Import Utility */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={handleExportDB}
              id="btn-export-records"
              className="px-2.5 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-xs rounded-lg flex items-center gap-1.5"
              title="Backup entire dream archive"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Backup</span>
            </button>
            <div className="relative">
              <label 
                htmlFor="import-file-selector" 
                className="px-2.5 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                title="Restore backup archive"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Restore</span>
              </label>
              <input 
                type="file" 
                id="import-file-selector" 
                accept=".json" 
                onChange={handleImportDB} 
                className="hidden" 
              />
            </div>
          </div>

          <button
            onClick={() => { setIsCreating(true); setSelectedDreamId(""); }}
            id="btn-launch-creator"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Capture Dream</span>
          </button>
        </div>
      </header>

      {/* Main Body Layout: Sidebar + Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        {/* Sidebar Panel Left */}
        <aside className="w-full lg:w-80 border-r border-slate-900 shrink-0 bg-slate-950 flex flex-col h-[300px] lg:h-[calc(100vh-73px)] overflow-hidden">
          <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex justify-between items-center shrink-0">
            <span className="text-xs font-bold tracking-wider text-slate-400 flex items-center gap-1.5 uppercase">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Unconscious Diary ({dreams.length})</span>
            </span>
            <button
              onClick={() => {
                if (confirm("Clear local cache? This will reset your archive and restore the sample stargate dream.")) {
                  localStorage.removeItem("dream_journal_collection");
                  const initial = [SAMPLE_DREAM];
                  saveToStorage(initial);
                  setSelectedDreamId(SAMPLE_DREAM.id);
                }
              }}
              id="btn-wipe-cache"
              className="p-1 hover:bg-slate-900 rounded-lg text-slate-600 hover:text-rose-400 transition"
              title="Reset data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Diary entries scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900" id="diary-list">
            {dreams.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Your unconscious files are vacant. Click "Capture Dream" at top right to initiate a vision log!
              </div>
            ) : (
              dreams.map((dream) => {
                const isActive = dream.id === selectedDreamId;
                return (
                  <div
                    key={dream.id}
                    id={`dream-item-${dream.id}`}
                    onClick={() => { setSelectedDreamId(dream.id); setIsCreating(false); }}
                    className={`p-4 flex flex-col gap-1 cursor-pointer transition relative group ${
                      isActive 
                        ? "bg-slate-900/60 border-l-2 border-indigo-500" 
                        : "hover:bg-slate-900/20"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-slate-200 text-xs md:text-sm font-semibold truncate flex-1 leading-normal">
                        {dream.title}
                      </span>
                      <button
                        onClick={(e) => handleDeleteDream(dream.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-950 bg-slate-900 rounded text-slate-500 hover:text-rose-400 transition"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3 h-3 text-indigo-500/50" />
                      <span className="text-[10px] font-mono">{formatDate(dream.date)}</span>
                      {dream.imageSize && (
                        <span className="text-[9px] px-1 bg-slate-950 text-slate-400 rounded uppercase font-bold tracking-wider">
                          {dream.imageSize}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Workspace Panel Right */}
        <main className="flex-1 overflow-y-auto bg-slate-950/20 p-6 md:p-8" id="dream-workspace">
          {isCreating ? (
            /* Creation Slate */
            <div className="max-w-xl mx-auto" id="creator-workspace">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                  <span>Translate Dreaming Visions</span>
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  Configure size parameters, pick visual ratios and narrate everything before reality fades it.
                </p>
              </div>

              {/* Configurations widget */}
              <ImageConfigure
                size={sizeSelection}
                onSizeChange={setSizeSelection}
                aspectRatio={aspectRatioSelection}
                onAspectRatioChange={setAspectRatioSelection}
              />

              {/* Error Callout display */}
              {errorStatus && (
                <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-4 text-xs md:text-sm text-rose-300 flex items-start gap-2.5 mb-6 shadow-md" id="creator-error-status">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Interfering static encountered:</span>
                    <p className="mt-1 text-rose-400/90 leading-relaxed">{errorStatus}</p>
                    <p className="text-[10px] text-rose-500 mt-2">
                      Make sure your computer's microphone is unlocked or click Secrets (Settings icon) inside the panel to confirm your GEMINI_API_KEY.
                    </p>
                  </div>
                </div>
              )}

              {/* Recording console */}
              <AudioRecorder
                onDreamSubmit={handleDreamSubmit}
                isProcessing={isProcessing}
                processingStage={processingStage}
              />

              <div className="text-center mt-6">
                <button
                  type="button"
                  id="btn-cancel-creation"
                  onClick={() => {
                    setIsCreating(false);
                    if (dreams.length > 0) setSelectedDreamId(dreams[0].id);
                  }}
                  className="text-slate-500 hover:text-slate-300 text-xs transition underline underline-offset-4 cursor-pointer"
                >
                  Return to Diary Logs
                </button>
              </div>
            </div>
          ) : activeDream ? (
            /* Selected Dream Slate view */
            <div className="max-w-4xl mx-auto space-y-8" id="active-dream-view">
              {/* Header block */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-5 gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
                    {activeDream.title}
                  </h2>
                  <div className="flex items-center gap-2.5 text-slate-500 mt-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500/50" />
                    <span className="text-xs font-mono">{formatDate(activeDream.date)}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md">
                      Dimension: {activeDream.imageSize || "1K"} • Ratio: {activeDream.imageAspectRatio || "1:1"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual + Script pane layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Visual art representation container */}
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={activeDream.imageUrl}
                      alt={`Surreal illustration scene: ${activeDream.title}`}
                      referrerPolicy="no-referrer"
                      className={`w-full h-auto object-cover rounded-2xl ${getAspectRatioClass(activeDream.imageAspectRatio)}`}
                    />
                  </div>
                  <span className="text-[10px] text-center text-slate-500 font-mono italic tracking-tight">
                    "Delve into your unconscious. Surreal illustration compiled from dream matrix theme motifs."
                  </span>
                </div>

                {/* Verbal description text script container */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 mb-2">Narrated Stream</h3>
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic shadow-inner">
                      "{activeDream.transcription}"
                    </p>
                  </div>
                  <div className="border-t border-slate-850 pt-4 mt-6 flex items-center gap-2 text-indigo-400/80 bg-indigo-950/10 p-3 rounded-xl border border-indigo-900/20">
                    <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-[11px] leading-relaxed text-slate-400">
                      Spontaneous memories fade within hours of waking. Reviewing this script maintains contact with unvisited feelings.
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab selector layout below */}
              <div className="border-b border-slate-900 flex justify-between items-center" id="tab-controls-bar">
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setActiveTab("analysis")}
                    id="tab-btn-analysis"
                    className={`pb-4 px-4 text-xs md:text-sm font-semibold transition relative flex items-center gap-1.5 ${
                      activeTab === "analysis" ? "text-indigo-400" : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Archetypal Interpretation</span>
                    {activeTab === "analysis" && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                      />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab("chat")}
                    id="tab-btn-chat"
                    className={`pb-4 px-4 text-xs md:text-sm font-semibold transition relative flex items-center gap-1.5 ${
                      activeTab === "chat" ? "text-indigo-400" : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Symbol Companion Chat</span>
                    {activeTab === "chat" && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic View Panel under standard tab selecting */}
              <AnimatePresence mode="wait">
                {activeTab === "analysis" && activeDream.analysis ? (
                  <motion.div
                    key="analysis-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AnalysisDetail analysis={activeDream.analysis} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SymbolChat
                      chatHistory={activeDream.chatHistory}
                      onSendMessage={handleChatSendMessage}
                      isSending={isSendingChat}
                      dreamAnalysisContext={JSON.stringify(activeDream.analysis)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Silent Empty space slate */
            <div className="h-[400px] flex flex-col items-center justify-center text-center text-slate-500" id="empty-workspace">
              <Sparkles className="w-12 h-12 text-slate-800/80 mb-3 animate-pulse" />
              <p className="text-sm font-medium text-slate-400">Initialize Unconscious Matrix</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                To explore deep symbols, click "Capture Dream" atop this board or select an entry from the left cabinet index.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
