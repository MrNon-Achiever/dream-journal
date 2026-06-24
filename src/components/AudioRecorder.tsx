import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Upload, FileText, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface AudioRecorderProps {
  onDreamSubmit: (text: string, audioBase64?: string) => void;
  isProcessing: boolean;
  processingStage: string;
}

export default function AudioRecorder({ onDreamSubmit, isProcessing, processingStage }: AudioRecorderProps) {
  const [inputMode, setInputMode] = useState<"record" | "type" | "upload">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(24).fill(10));
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Format recording timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Waveform visualization simulation
  useEffect(() => {
    if (isRecording) {
      const updateWaveform = () => {
        setWaveformBars(Array.from({ length: 24 }, () => Math.floor(Math.random() * 40) + 8));
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setWaveformBars(Array(24).fill(10));
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording]);

  // Start recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all audio tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      alert("Could not access your microphone. Please allow audio permissions or try the manual typing mode.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Reset/Clear recorded audio
  const resetRecording = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  // Handle direct audio file upload selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  // Submit recorded/uploaded audio or typed text
  const handleSubmit = async () => {
    if (inputMode === "type") {
      if (!manualText.trim()) return;
      onDreamSubmit(manualText);
      setManualText("");
    } else {
      if (!audioUrl) return;
      try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(",")[1];
          onDreamSubmit("", base64Audio);
          resetRecording();
          setUploadedFile(null);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to convert audio file:", err);
        alert("An error occurred processing the audio recording. Please try manually typing.");
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl max-w-xl mx-auto my-6" id="audio-recorder-container">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>Capture Your Unconscious</span>
        </h3>
        
        {/* Toggle input mode */}
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            id="nav-mode-record"
            onClick={() => { setInputMode("record"); resetRecording(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              inputMode === "record" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Record</span>
          </button>
          <button
            type="button"
            id="nav-mode-type"
            onClick={() => { setInputMode("type"); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              inputMode === "type" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Type Narrative</span>
          </button>
          <button
            type="button"
            id="nav-mode-upload"
            onClick={() => { setInputMode("upload"); resetRecording(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              inputMode === "upload" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Audio</span>
          </button>
        </div>
      </div>

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center py-12 px-4" id="processing-loader">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="mb-4"
          >
            <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
          </motion.div>
          <p className="text-slate-300 font-medium mb-1 text-center text-sm md:text-base capitalize">
            {processingStage}
          </p>
          <p className="text-slate-500 text-xs text-center">
            Drawing symbols from the unconscious matrix...
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {inputMode === "record" && (
            <motion.div
              key="record-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center"
            >
              {audioUrl ? (
                <div className="w-full flex flex-col items-center gap-5 py-4">
                  <div className="text-sm text-emerald-400 flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/30 px-3 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Dream recorded successfully</span>
                  </div>
                  <audio src={audioUrl} controls className="w-full max-w-sm rounded-lg" />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      id="btn-retry-record"
                      onClick={resetRecording}
                      className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Discard & Retake</span>
                    </button>
                    <button
                      type="button"
                      id="btn-submit-record"
                      onClick={handleSubmit}
                      className="px-6 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Interpret Dream</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 w-full">
                  {!isRecording ? (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-slate-400 text-xs text-center max-w-xs">
                        Speak instantly upon waking to catch faint details before they recede into the conscious mind.
                      </p>
                      <button
                        type="button"
                        id="btn-start-record"
                        onClick={startRecording}
                        className="w-24 h-24 rounded-full bg-indigo-600/10 hover:bg-indigo-600/20 border-2 border-indigo-500/30 hover:border-indigo-500/80 flex items-center justify-center transition-all duration-300 active:scale-95 group shadow-inner"
                      >
                        <div className="w-16 h-16 rounded-full bg-indigo-600 group-hover:bg-indigo-500 flex items-center justify-center text-white shadow-lg transition duration-200">
                          <Mic className="w-8 h-8" />
                        </div>
                      </button>
                      <span className="text-slate-400 text-sm font-medium">Click to Speak</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6 w-full">
                      {/* Waveform Visualization */}
                      <div className="flex items-center justify-center gap-1 h-12 w-full my-4">
                        {waveformBars.map((height, idx) => (
                          <motion.div
                            key={idx}
                            style={{ height }}
                            className="w-1 bg-indigo-500 rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                          />
                        ))}
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <span className="font-mono text-2xl text-rose-500 animate-pulse font-semibold">
                          {formatTime(recordingTime)}
                        </span>
                        <span className="text-xs text-slate-500 uppercase tracking-widest">
                          Recording Unconscious Streams...
                        </span>
                      </div>

                      <button
                        type="button"
                        id="btn-stop-record"
                        onClick={stopRecording}
                        className="w-16 h-16 rounded-full bg-rose-950/50 hover:bg-rose-900/40 border border-rose-500/40 flex items-center justify-center transition active:scale-95 text-rose-500 shadow-md"
                      >
                        <Square className="w-6 h-6 fill-rose-500" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {inputMode === "type" && (
            <motion.div
              key="type-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <textarea
                id="manual-dream-text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Describe your dream narrative... I was flying across an ancient stone library, reading stars from floating scrolls, a white owl held the keys to..."
                className="w-full h-32 bg-slate-950 text-slate-200 rounded-2xl p-4 text-sm border border-slate-800 focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600 resize-none"
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  id="btn-submit-type"
                  onClick={handleSubmit}
                  disabled={!manualText.trim()}
                  className="px-6 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow transition flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Interpret Dream</span>
                </button>
              </div>
            </motion.div>
          )}

          {inputMode === "upload" && (
            <motion.div
              key="upload-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-5"
            >
              {audioUrl ? (
                <div className="w-full flex flex-col items-center gap-5 py-4">
                  <div className="text-sm text-indigo-400 flex items-center gap-1.5 bg-indigo-950/40 border border-indigo-900/30 px-3 py-1 rounded-full">
                    <CheckIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate max-w-[200px]">{uploadedFile?.name || "Uploaded file"}</span>
                  </div>
                  <audio src={audioUrl} controls className="w-full max-w-sm rounded-lg" />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      id="btn-discard-uploaded"
                      onClick={() => { setUploadedFile(null); setAudioUrl(null); }}
                      className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl transition flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Remove File</span>
                    </button>
                    <button
                      type="button"
                      id="btn-submit-uploaded"
                      onClick={handleSubmit}
                      className="px-6 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow transition flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Interpret Upload</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition relative cursor-pointer group bg-slate-950/55">
                  <input
                    type="file"
                    id="audio-file-input"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:bg-slate-800/80 transition">
                    <Upload className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 text-sm font-medium">Upload audio description</p>
                    <p className="text-slate-500 text-xs mt-1">Accepts MP3, WAV, M4A, WebM (Max 25MB)</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
