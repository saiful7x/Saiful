import { Crown } from 'lucide-react';

interface DeveloperSignatureProps {
  compact?: boolean;
}

export default function DeveloperSignature({ compact = false }: DeveloperSignatureProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#141210] via-[#1B1712] to-[#141210] border border-amber-500/25 shadow-sm">
        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-xs font-medium tracking-wide text-slate-300 whitespace-nowrap">
          Developed by{' '}
          <span className="font-semibold bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 bg-clip-text text-transparent">
            Saiful
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#12100E] via-[#0B0C10] to-[#12100E] border border-amber-500/25 px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/5 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-[11px] font-medium tracking-widest text-amber-400/80">
              Crafted &amp; Engineered
            </div>
            <div className="text-base sm:text-lg font-display font-bold tracking-tight bg-gradient-to-r from-amber-100 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Developed by Saiful
            </div>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-xs font-medium text-slate-400">Authorized Edition</div>
          <div className="text-[11px] font-mono-tabular text-amber-300/70">Saiful Sir</div>
        </div>
      </div>
    </div>
  );
}
