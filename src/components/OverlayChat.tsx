import {
  useEffect,
  useRef,
  useState,
  FormEvent,
  TouchEvent as ReactTouchEvent,
} from 'react';
import {
  Lock,
  Send,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { PRESET_QUESTIONS } from '../data/presets';
import { ChatMessage, PresetQuestion } from '../types';
import DeveloperSignature from './DeveloperSignature';
import BinaryRainCanvas from './BinaryRainCanvas';

interface OverlayChatProps {
  onUnlockSuccess: () => void;
}

interface NavigatorWithLock extends Navigator {
  keyboard?: {
    lock?: (keyCodes?: string[]) => Promise<void>;
    unlock?: () => void;
  };
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function OverlayChat({ onUnlockSuccess }: OverlayChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: 'আসসালামু আলাইকুম! ফুল-স্ক্রিন এআই চ্যাট চালু হয়েছে। পাসওয়ার্ড দিয়ে আনলক না করা পর্যন্ত এই ওভারলে বন্ধ বা মিনিমাইজ করা যাবে না। আপনি এখন আমার সাথে মন খুলে কথা বলতে পারেন অথবা নিচের প্রশ্নগুলো ব্যবহার করতে পারেন।',
      timestamp: formatTime(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [unlockingSuccess, setUnlockingSuccess] = useState(false);

  const [lockAlert, setLockAlert] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const unlockInputRef = useRef<HTMLInputElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const unlockingRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const showTemporaryLockAlert = (msg: string) => {
    setLockAlert(msg);
  };

  const reassertFullscreenAndKeys = async () => {
    if (unlockingRef.current) return;
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' } as FullscreenOptions);
      }
    } catch {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Ignore if browser restricts programmatic fullscreen without gesture
      }
    }
    try {
      const nav = navigator as NavigatorWithLock;
      if (nav.keyboard?.lock) {
        await nav.keyboard.lock(['Escape', 'Tab', 'MetaLeft', 'MetaRight', 'AltLeft', 'AltRight', 'F11']);
      }
    } catch {
      // Keyboard Lock API may be unavailable on some devices
    }
  };

  // Kiosk & Lockdown guards: Back trap, Keyboard trap, Wake Lock, Visibility/Fullscreen guard
  useEffect(() => {
    window.history.pushState({ overlayLocked: true }, '', window.location.href);

    let wakeLockSentinel: WakeLockSentinel | null = null;
    const nav = navigator as NavigatorWithLock;
    if ('wakeLock' in navigator && navigator.wakeLock?.request) {
      navigator.wakeLock
        .request('screen')
        .then((sentinel) => {
          wakeLockSentinel = sentinel;
        })
        .catch(() => {
          // Wake lock optional
        });
    }

    const handlePopState = () => {
      if (unlockingRef.current) return;
      window.history.pushState({ overlayLocked: true }, '', window.location.href);
      showTemporaryLockAlert('ব্যাক নেভিগেশন ব্লক করা আছে! পাসওয়ার্ড দিয়ে আনলক করুন।');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (unlockingRef.current) return;
      const blockedKeys = ['Escape', 'F11', 'F12', 'Meta', 'OS'];
      const isModifierExit =
        (e.altKey && (e.key === 'Tab' || e.key === 'F4')) ||
        ((e.ctrlKey || e.metaKey) && ['w', 'W', 't', 'T', 'r', 'R', 'h', 'H', 'l', 'L'].includes(e.key));

      if (blockedKeys.includes(e.key) || isModifierExit) {
        e.preventDefault();
        e.stopPropagation();
        showTemporaryLockAlert('স্ক্রিন লক করা আছে! পাসওয়ার্ড ছাড়া বের হওয়া বা মিনিমাইজ করা যাবে না।');
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !unlockingRef.current) {
        showTemporaryLockAlert('ফুল-স্ক্রিন লকডাউন সক্রিয়! পাসওয়ার্ড ছাড়া ওভারলে বন্ধ হবে না।');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !unlockingRef.current) {
        showTemporaryLockAlert('অ্যাপ মিনিমাইজ বা পরিবর্তন করার চেষ্টা শনাক্ত হয়েছে — সিস্টেম লকড!');
      } else if (!document.hidden && !unlockingRef.current) {
        void reassertFullscreenAndKeys();
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unlockingRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (wakeLockSentinel) {
        void wakeLockSentinel.release().catch(() => {});
      }
      if (nav.keyboard?.unlock) {
        nav.keyboard.unlock();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, unlockModalOpen]);

  useEffect(() => {
    if (unlockModalOpen) {
      setTimeout(() => unlockInputRef.current?.focus(), 60);
    }
  }, [unlockModalOpen]);

  // Intercept top-edge downward swipe (notification shutter guard) inside viewport
  const handleRootTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (!document.fullscreenElement && !unlockingRef.current) {
      void reassertFullscreenAndKeys();
    }
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleRootTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || e.touches.length === 0) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;

    if (touchStartYRef.current < 80 && deltaY > 14) {
      e.preventDefault();
      showTemporaryLockAlert('ওপরের শাটার ও মিনিমাইজ লক করা আছে! আনলক করতে পাসওয়ার্ড দিন।');
    }
  };

  const handleRootTouchEnd = () => {
    touchStartYRef.current = null;
  };

  const triggerUnlockTransition = async () => {
    unlockingRef.current = true;
    setUnlockingSuccess(true);
    setUnlockError('');
    setLockAlert('');

    try {
      const nav = navigator as NavigatorWithLock;
      if (nav.keyboard?.unlock) {
        nav.keyboard.unlock();
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // Proceed cleanly even if fullscreen was not active
    }

    setTimeout(() => {
      onUnlockSuccess();
    }, 550);
  };

  const handleVerifyPassword = async (passwordToVerify: string) => {
    const trimmed = passwordToVerify.trim();
    if (!trimmed) {
      setUnlockError('অনুগ্রহ করে পাসওয়ার্ড লিখুন।');
      return;
    }

    setIsVerifying(true);
    setUnlockError('');

    try {
      const res = await fetch('/api/verify-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      });
      const data = (await res.json()) as { unlocked?: boolean };

      if (data.unlocked) {
        await triggerUnlockTransition();
      } else {
        setUnlockError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।');
      }
    } catch {
      setUnlockError('পাসওয়ার্ড যাচাই করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePresetClick = (preset: PresetQuestion) => {
    if (isLoading || unlockingSuccess) return;
    void reassertFullscreenAndKeys();

    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      text: preset.questionBn,
      timestamp: formatTime(),
    };

    const modelMsg: ChatMessage = {
      id: createId(),
      role: 'model',
      text: preset.presetAnswer || '',
      timestamp: formatTime(),
      showUnlockPrompt: Boolean(preset.triggersUnlockPrompt),
    };

    setMessages((prev) => [...prev, userMsg, modelMsg]);
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoading || unlockingSuccess) return;

    void reassertFullscreenAndKeys();
    setInputText('');

    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      text: trimmed,
      timestamp: formatTime(),
    };

    const nextHistory = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory,
        }),
      });

      const data = (await response.json()) as {
        unlocked?: boolean;
        reply?: string;
        showUnlockPrompt?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: 'model',
            text: data.error || 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
            timestamp: formatTime(),
            isError: true,
          },
        ]);
        return;
      }

      const replyMsg: ChatMessage = {
        id: createId(),
        role: 'model',
        text: data.reply || 'উত্তর পাওয়া যায়নি।',
        timestamp: formatTime(),
        showUnlockPrompt: Boolean(data.showUnlockPrompt),
      };

      setMessages((prev) => [...prev, replyMsg]);

      if (data.unlocked) {
        await triggerUnlockTransition();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'model',
          text: 'নেটওয়ার্ক সংযোগ ব্যর্থ হয়েছে। ইন্টারনেট পরীক্ষা করে আবার চেষ্টা করুন।',
          timestamp: formatTime(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      chatInputRef.current?.focus();
    }
  };

  return (
    <div
      onTouchStart={handleRootTouchStart}
      onTouchMove={handleRootTouchMove}
      onTouchEnd={handleRootTouchEnd}
      onClick={() => {
        if (!document.fullscreenElement && !unlockingRef.current) {
          void reassertFullscreenAndKeys();
        }
      }}
      className="fixed inset-0 z-50 h-[100dvh] w-screen bg-[#030504] text-slate-100 flex flex-col overflow-hidden select-none overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-label="Locked Full-Screen Overlay AI Chat"
    >
      <BinaryRainCanvas opacityClass="opacity-30" accent="crimson" />

      {/* Top-edge swipe-down / shutter shield barrier */}
      <div
        className="fixed top-0 left-0 right-0 h-6 z-[60] touch-none"
        onTouchStart={(e) => {
          e.preventDefault();
          showTemporaryLockAlert('ওপরের শাটার নামানো লক করা আছে! আনলক করতে পাসওয়ার্ড দিন।');
        }}
        onTouchMove={(e) => {
          e.preventDefault();
        }}
      />

      {/* Atmospheric crimson/emerald radial depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(185,28,28,0.20),transparent_70%)]"
      />

      {/* Top Overlay Header — No Close Button */}
      <header className="relative z-10 shrink-0 border-b border-red-500/20 bg-[#090A0F]/95 backdrop-blur-md touch-none">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-950/70 border border-red-500/35 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-display font-bold text-white truncate">
                Saiful Chat AI
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 truncate">
                <span className="font-mono-tabular text-red-300">{formatDuration(elapsedSeconds)}</span>
                <span aria-hidden="true">·</span>
                <span>Full-Screen Chat · No Close</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setUnlockModalOpen((prev) => !prev);
              setUnlockError('');
            }}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-red-700/25 hover:bg-red-700/40 border border-red-500/40 text-red-100 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Lock className="w-3.5 h-3.5 shrink-0 text-red-300" />
            <span>Unlock</span>
          </button>
        </div>

        {/* Premium Developer Signature Bar */}
        <div className="max-w-3xl mx-auto px-4 pb-2.5 flex items-center justify-between gap-3">
          <DeveloperSignature compact />
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Password Protected Kiosk Mode
          </span>
        </div>
      </header>

      {/* Lockdown Breach Alert Strip */}
      {lockAlert && (
        <div
          role="alert"
          className="relative z-10 shrink-0 bg-red-950/90 border-b border-red-500/40 px-4 py-2.5"
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 text-xs font-semibold text-red-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{lockAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setLockAlert('')}
              className="text-[11px] text-red-300 hover:text-white underline whitespace-nowrap shrink-0"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Expandable Password Unlock Sheet */}
      {unlockModalOpen && (
        <div className="relative z-10 shrink-0 border-b border-white/10 bg-[#0D0F16]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleVerifyPassword(unlockPassword);
            }}
            className="max-w-3xl mx-auto px-4 py-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <KeyRound className="w-4 h-4 text-amber-300 shrink-0" />
                <span>অ্যাপ আনলক ও বন্ধ করতে পাসওয়ার্ড দিন</span>
              </div>
              <button
                type="button"
                onClick={() => setUnlockModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 min-h-[32px] px-2 whitespace-nowrap"
              >
                লুকান
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={unlockInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={unlockPassword}
                  onChange={(e) => {
                    setUnlockPassword(e.target.value);
                    setUnlockError('');
                  }}
                  placeholder="পাসওয়ার্ড লিখুন..."
                  disabled={isVerifying || unlockingSuccess}
                  className="w-full min-h-[44px] pl-3.5 pr-10 py-2 rounded-xl bg-[#050507] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifying || unlockingSuccess}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
              >
                {unlockingSuccess ? 'আনলক হচ্ছে...' : isVerifying ? 'যাচাই...' : 'Unlock'}
              </button>
            </div>

            {unlockError && (
              <p className="text-xs text-red-400 font-medium" role="alert">
                {unlockError}
              </p>
            )}
          </form>
        </div>
      )}

      {/* Scrollable Chat Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-5 touch-pan-y select-text">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm sm:text-[15px] leading-relaxed tracking-wide ${
                    isUser
                      ? 'bg-gradient-to-br from-red-700 to-red-800 text-white rounded-br-sm shadow-lg shadow-red-950/30'
                      : msg.isError
                      ? 'bg-red-950/70 border border-red-500/35 text-red-200 rounded-bl-sm'
                      : 'bg-[#0E1017] border border-white/10 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  {msg.isError && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-300 mb-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Error</span>
                    </div>
                  )}

                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                  {msg.showUnlockPrompt && !unlockingSuccess && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleVerifyPassword(unlockPassword);
                      }}
                      className="mt-3 pt-3 border-t border-white/10 space-y-2.5"
                    >
                      <div className="text-xs font-medium text-amber-200/90">
                        এখানে পাসওয়ার্ড টাইপ করুন অথবা নিচের চ্যাট বক্সে লিখুন:
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={unlockPassword}
                          onChange={(e) => {
                            setUnlockPassword(e.target.value);
                            setUnlockError('');
                          }}
                          placeholder="পাসওয়ার্ড দিন..."
                          disabled={isVerifying || unlockingSuccess}
                          className="flex-1 min-w-0 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#050507] border border-white/15 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                        />
                        <button
                          type="submit"
                          disabled={isVerifying || unlockingSuccess}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
                        >
                          {isVerifying ? 'যাচাই...' : 'Unlock'}
                        </button>
                      </div>
                      {unlockError && (
                        <p className="text-xs text-red-400 font-medium" role="alert">
                          {unlockError}
                        </p>
                      )}
                    </form>
                  )}
                </div>

                <span className="mt-1 px-1 text-[11px] text-slate-500 font-mono-tabular">
                  {isUser ? 'আপনি' : 'Saiful Lock AI'} · {msg.timestamp}
                </span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-[#0E1017] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-slate-300">
                উত্তর তৈরি হচ্ছে...
              </div>
            </div>
          )}

          {unlockingSuccess && (
            <div className="flex items-start">
              <div className="bg-emerald-950/80 border border-emerald-500/35 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-emerald-200 font-medium">
                পাসওয়ার্ড সঠিক! লকডাউন আনলক হচ্ছে এবং অ্যাপ স্টপ হচ্ছে...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Preset Questions + Chat Composer Dock */}
      <div className="relative z-10 shrink-0 border-t border-white/10 bg-[#090A0F] pb-safe touch-none">
        <div className="max-w-3xl mx-auto px-4 pt-3 pb-3 space-y-3">
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-slate-400">
              আগে থেকে তৈরি প্রশ্ন (ট্যাপ করুন):
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
              {PRESET_QUESTIONS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  disabled={isLoading || unlockingSuccess}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#141722] hover:bg-[#1C2030] active:scale-[0.98] border border-white/12 text-xs sm:text-sm font-medium text-slate-100 whitespace-nowrap shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {preset.questionBn}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              ref={chatInputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="এআই-এর সাথে কথা বলুন অথবা আনলক পাসওয়ার্ড লিখুন..."
              disabled={isLoading || unlockingSuccess}
              className="flex-1 min-w-0 min-h-[48px] px-4 py-2.5 rounded-2xl bg-[#050507] border border-white/15 text-sm sm:text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading || unlockingSuccess}
              aria-label="Send message"
              className="min-h-[48px] min-w-[48px] px-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 disabled:bg-slate-800 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
