import { Eye, Compass, Heart, HelpCircle, Tag, Layers } from "lucide-react";
import { DreamAnalysis } from "../types";

interface AnalysisDetailProps {
  analysis: DreamAnalysis;
}

export default function AnalysisDetail({ analysis }: AnalysisDetailProps) {
  return (
    <div className="space-y-8" id="analysis-detail-section">
      {/* Overview & Core emotional theme */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 text-indigo-400">
              <Heart className="w-5 h-5" />
              <span className="text-xs uppercase font-extrabold tracking-wider">Dream Atmosphere</span>
            </div>
            <h4 className="text-lg font-medium text-slate-100">Core Emotional Theme</h4>
          </div>
          <div className="mt-4 bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl">
            <p className="text-indigo-200 text-sm italic font-medium leading-relaxed">
              "{analysis.emotionalTheme}"
            </p>
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3 text-indigo-400">
            <Eye className="w-5 h-5" />
            <span className="text-xs uppercase font-extrabold tracking-wider">Depth Analysis</span>
          </div>
          <h4 className="text-lg font-medium text-slate-100 mb-3">Psychological Integration Summary</h4>
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {analysis.analysis}
          </p>
        </div>
      </div>

      {/* Recognized Archetypes */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h4 className="text-lg font-semibold text-slate-100 font-sans">Active Archetypes</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {analysis.archetypes.map((archetype, idx) => (
            <div
              key={idx}
              id={`archetype-card-${idx}`}
              className="bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-xl p-5 transition hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <span className="inline-block px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 rounded-full mb-3">
                  {archetype.name}
                </span>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                  {archetype.explanation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specific Dream Symbols */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-indigo-400" />
          <h4 className="text-lg font-semibold text-slate-100 font-sans">Decoded Symbols</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {analysis.symbols.map((symbol, idx) => (
            <div
              key={idx}
              id={`symbol-card-${idx}`}
              className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 flex flex-col gap-2"
            >
              <div className="flex items-center gap-1.5 text-indigo-300 font-medium text-sm md:text-base border-b border-slate-800 pb-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>{symbol.name}</span>
              </div>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                {symbol.meaning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reflection Prompts for journaling */}
      <div className="bg-indigo-950/10 border border-indigo-900/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4 text-indigo-400">
          <HelpCircle className="w-5 h-5" />
          <h4 className="text-md font-bold tracking-wider uppercase text-indigo-300">Waking Mind Contemplation</h4>
        </div>
        <ul className="space-y-3">
          {analysis.reflectionQuestions.map((question, idx) => (
            <li
              key={idx}
              className="text-slate-300 text-xs md:text-sm flex gap-3 items-start leading-relaxed bg-slate-950/45 p-3.5 rounded-xl border border-slate-850"
            >
              <span className="text-indigo-400 font-bold font-mono">0{idx + 1}.</span>
              <span>{question}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
