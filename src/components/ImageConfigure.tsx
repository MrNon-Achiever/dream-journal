import { Settings, Maximize2, ShieldAlert } from "lucide-react";

interface ImageConfigureProps {
  size: "1K" | "2K" | "4K";
  onSizeChange: (size: "1K" | "2K" | "4K") => void;
  aspectRatio: "1:1" | "16:9" | "4:3" | "3:4";
  onAspectRatioChange: (ratio: "1:1" | "16:9" | "4:3" | "3:4") => void;
}

export default function ImageConfigure({
  size,
  onSizeChange,
  aspectRatio,
  onAspectRatioChange,
}: ImageConfigureProps) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 max-w-xl mx-auto mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center" id="image-configure-bar">
      {/* Visual Canvas Ratio selector */}
      <div className="flex flex-col gap-1.5 w-full sm:w-auto">
        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
          <Maximize2 className="w-3 h-3 text-indigo-400" />
          <span>Canvas Aspect Ratio</span>
        </label>
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(["1:1", "16:9", "4:3", "3:4"] as const).map((ratio) => (
            <button
              key={ratio}
              type="button"
              id={`ratio-${ratio.replace(":", "-")}`}
              onClick={() => onAspectRatioChange(ratio)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                aspectRatio === ratio
                  ? "bg-slate-800 text-white border border-slate-700 shadow"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution selection (as explicitly requested: 1K, 2K, 4K) */}
      <div className="flex flex-col gap-1.5 w-full sm:w-auto">
        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
          <Settings className="w-3 h-3 text-indigo-400" />
          <span>Image Quality (Paid Model)</span>
        </label>
        <div className="flex gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(["1K", "2K", "4K"] as const).map((res) => (
            <button
              key={res}
              type="button"
              id={`size-${res}`}
              onClick={() => onSizeChange(res)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                size === res
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <span>{res}</span>
              {res === "4K" && <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1 rounded">Ultra</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
