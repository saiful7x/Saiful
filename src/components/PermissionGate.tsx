import { useState } from 'react';
import { MessageSquare, ShieldCheck, ArrowRight, Lock, Layers } from 'lucide-react';
import DeveloperSignature from './DeveloperSignature';
import PWAInstallButton from './PWAInstallButton';
import BinaryRainCanvas from './BinaryRainCanvas';

interface PermissionGateProps {
  onGrant: () => void;
}

export default function PermissionGate({ onGrant }: PermissionGateProps) {
  const [toggleOn, setToggleOn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleContinue = () => {
    if (!toggleOn) {
      setErrorMsg('প্রবেশ করতে হলে আগে "Display over other apps" পারমিশন চালু করুন।');
      return;
    }
    setErrorMsg('');
    onGrant();
  };

  return (
    <div className="min-h-[100dvh] bg-[#030504] text-slate-100 flex flex-col relative overflow-hidden">
      <BinaryRainCanvas opacityClass="opacity-45" accent="emerald" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.16),transparent_70%)]"
      />

      <header className="relative z-10 w-full border-b border-emerald-500/20 bg-[#050806]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          <span className="text-lg font-display font-bold tracking-tight text-white whitespace-nowrap shrink-0">
            Saiful Chat AI
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton />
            <span className="text-xs text-emerald-300/75 whitespace-nowrap shrink-0 hidden sm:inline">
              Chat Setup · Step 1 of 2
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <section className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-cyan-400 tracking-wide">
                Display Permission Required
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-emerald-300 text-balance leading-[1.15]">
                চ্যাটিং করার জন্য ডিসপ্লে পারমিশন দিন
              </h1>
              <p className="text-base text-slate-300 leading-relaxed max-w-xl">
                অ্যাপের ভেতরে প্রবেশ করে এআই-এর সাথে ফুল-স্ক্রিন চ্যাটিং শুরু করার জন্য ডিসপ্লে ওভারলে
                পারমিশন দিন। পারমিশন দিলে <span className="text-amber-300 font-semibold">Start Chatting</span> চাপতেই ফুল-স্ক্রিন চ্যাট ওপেন হবে।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="bg-[#080C0A]/90 border border-emerald-500/30 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
                  <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>ফুল-স্ক্রিন এআই চ্যাটিং</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  চ্যাটিং চালু করলে স্ক্রিনজুড়ে চ্যাট ওভারলে ওপেন হবে এবং তৈরি করা প্রশ্ন দেখাবে।
                </p>
              </div>

              <div className="bg-[#080C0A]/90 border border-rose-500/30 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
                  <Lock className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>পাসওয়ার্ড সুরক্ষিত</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  চ্যাটিং চলাকালীন কোনো ক্লোজ বাটন থাকবে না; পাসওয়ার্ড দিলে ওভারলে বন্ধ হবে।
                </p>
              </div>
            </div>

            <DeveloperSignature />
          </section>

          <section className="lg:col-span-6 flex flex-col justify-center">
            <div className="bg-[#080C0A]/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/70 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-cyan-300">
                    Display over other apps
                  </h2>
                  <p className="text-sm text-emerald-300/80">
                    Saiful Chat AI · চ্যাটিং করার জন্য পারমিশন
                  </p>
                </div>
              </div>

              <div className="border-t border-b border-white/10 py-5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={toggleOn}
                  onClick={() => {
                    setToggleOn((prev) => !prev);
                    setErrorMsg('');
                  }}
                  className="w-full min-h-[56px] flex items-center justify-between gap-4 text-left rounded-2xl px-4 py-3 bg-[#13151D] hover:bg-[#191C26] border border-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Allow display over other apps
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {toggleOn
                        ? 'Permission Granted · চ্যাটিং শুরু করার জন্য প্রস্তুত'
                        : 'চ্যাটিং করার জন্য ডিসপ্লে পারমিশন চালু করুন'}
                    </div>
                  </div>
                  <span
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${
                      toggleOn ? 'bg-red-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        toggleOn ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              </div>

              {errorMsg && (
                <p className="text-sm text-red-400 font-medium" role="alert">
                  {errorMsg}
                </p>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleContinue}
                  className={`w-full min-h-[50px] px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                    toggleOn
                      ? 'bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-lg shadow-red-950/50 active:scale-[0.99]'
                      : 'bg-white/10 hover:bg-white/15 text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>চ্যাটিং পারমিশন দিয়ে প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
                <p className="text-xs text-slate-500 text-center">
                  চ্যাটিং করার জন্য পারমিশন অন করে ভেতরে গিয়ে Start Chatting বাটনে চাপ দিন।
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
