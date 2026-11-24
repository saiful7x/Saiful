import {
  Play,
  ShieldCheck,
  Lock,
  MessageSquareText,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { PRESET_QUESTIONS } from '../data/presets';
import { ServiceStatus } from '../types';
import DeveloperSignature from './DeveloperSignature';
import PWAInstallButton from './PWAInstallButton';
import BinaryRainCanvas from './BinaryRainCanvas';

interface ControlDashboardProps {
  status: ServiceStatus;
  onStartOverlay: () => void;
  onRevokePermission: () => void;
}

export default function ControlDashboard({
  status,
  onStartOverlay,
  onRevokePermission,
}: ControlDashboardProps) {
  const isStopped = status === 'stopped';

  return (
    <div className="min-h-[100dvh] bg-[#030504] text-slate-100 flex flex-col relative overflow-x-hidden">
      <BinaryRainCanvas opacityClass="opacity-45" accent="emerald" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.16),transparent_70%)]"
      />

      {/* Strict 3-zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-[#050806]/90 backdrop-blur-md border-b border-emerald-500/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          <a
            href="#overview"
            className="text-lg font-display font-bold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            Saiful Chat AI
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a
              href="#overview"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#questions"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Questions
            </a>
            <a
              href="#lockdown"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Protection
            </a>
            <a
              href="#permission"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Permission
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onStartOverlay}
              className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-600 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Play className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>Start Chatting</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-28 md:pb-12 space-y-6">
        {isStopped && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-sm font-medium">
              পাসওয়ার্ড ভেরিফিকেশন সফল হয়েছে। ওভারলে লক থেকে বের হয়ে অ্যাপ এখন Stopped অবস্থায় আছে।
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          <section
            id="overview"
            className="lg:col-span-7 bg-[#080C0A]/95 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-8 shadow-2xl shadow-black/70"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-cyan-300">
                <span className="text-emerald-400 font-semibold">চ্যাটিং পারমিশন সক্রিয়</span>
                <span aria-hidden="true">·</span>
                <span>State: {isStopped ? 'Stopped' : 'Ready to Chat'}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-emerald-300 text-balance leading-[1.15]">
                ফুল-স্ক্রিন এআই চ্যাটিং শুরু করুন
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                <span className="text-amber-300 font-semibold">Start Chatting</span> চাপলেই আপনার স্ক্রিনে ফুল-স্ক্রিন এআই চ্যাট ওভারলে ওপেন হবে। আনলক না করা পর্যন্ত কোনো ক্লোজ
                বাটন থাকবে না, এবং ভেতরেই ছোট উইন্ডোতে Telegram ও Call ব্যবহার করা যাবে।
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-emerald-500/20">
              <div className="space-y-1">
                <div className="text-xs text-cyan-400/80">ওভারলে মোড</div>
                <div className="text-sm font-semibold text-emerald-300">Kiosk Fullscreen</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-cyan-400/80">মিনি অ্যাপস</div>
                <div className="text-sm font-semibold text-cyan-300">Telegram &amp; Call</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-cyan-400/80">এক্সিট সিস্টেম</div>
                <div className="text-sm font-semibold text-amber-300">Password Only</div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={onStartOverlay}
                className="w-full min-h-[54px] px-6 py-4 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-500 active:scale-[0.99] text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all whitespace-nowrap shadow-xl shadow-red-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <Play className="w-5 h-5 fill-current shrink-0" />
                <span>Start Chatting</span>
              </button>

              <DeveloperSignature />
            </div>
          </section>

          <aside className="lg:col-span-5 flex flex-col gap-6">
            <section
              id="questions"
              className="bg-[#080C0A]/95 border border-cyan-500/25 rounded-3xl p-6 space-y-4 flex-1"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquareText className="w-5 h-5 text-cyan-400 shrink-0" />
                <h2 className="text-base font-semibold text-cyan-300">
                  আগে থেকে তৈরি প্রশ্নসমূহ
                </h2>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                ওভারলের ভেতরে এআই চ্যাটের সাথে মন খুলে কথা বলার পাশাপাশি নিচের প্রশ্নগুলো দেখাবে:
              </p>

              <div className="divide-y divide-emerald-500/15">
                {PRESET_QUESTIONS.map((item, idx) => (
                  <div key={item.id} className="py-3 first:pt-1 last:pb-1 space-y-1">
                    <div className="text-sm font-semibold text-emerald-300">
                      0{idx + 1}. {item.questionBn}
                    </div>
                    <div className="text-xs text-amber-300/85">
                      {item.id === 'creator'
                        ? 'উত্তর: Saiful Sir'
                        : item.id === 'turn-off'
                        ? 'উত্তর: পাসওয়ার্ড দিয়ে আনলক প্রম্পট চালু করবে'
                        : item.questionAlt}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="lockdown"
              className="bg-[#080C0A]/95 border border-rose-500/25 rounded-3xl p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                <h2 className="text-base font-semibold text-rose-300">
                  ওভারলে সুরক্ষা ও আনলক সিস্টেম
                </h2>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                চ্যাটিং শুরু হলে ফুল-স্ক্রিন কিয়স্ক, কি-বোর্ড লক, স্ক্রিন ওয়েক-লক এবং শাটার প্রতিরোধ
                সক্রিয় থাকে। শুধুমাত্র সঠিক পাসওয়ার্ড দিলেই অ্যাপ স্টপ হবে।
              </p>

              <div
                id="permission"
                className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>চ্যাটিং পারমিশন সক্রিয়</span>
                </div>

                <div className="flex items-center gap-2">
                  <PWAInstallButton />
                  <button
                    type="button"
                    onClick={onRevokePermission}
                    className="min-h-[40px] px-3 py-2 text-xs font-medium text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>Reset Permission</span>
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </div>

        <footer className="pt-4 pb-2 flex items-center justify-between gap-4 text-xs text-slate-500 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />
            <span>Saiful Chat AI · Full-Screen Overlay</span>
          </div>
          <span className="font-medium text-amber-300/90">Developed by Saiful</span>
        </footer>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-[#08090D]/95 backdrop-blur-md border-t border-white/10 md:hidden z-30 pb-safe">
        <button
          type="button"
          onClick={onStartOverlay}
          className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap"
        >
          <Play className="w-4 h-4 fill-current shrink-0" />
          <span>Start Chatting</span>
        </button>
      </div>
    </div>
  );
}
