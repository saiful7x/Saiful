import { useEffect, useRef } from 'react';

interface BinaryRainCanvasProps {
  opacityClass?: string;
  accent?: 'emerald' | 'crimson';
}

const LIVE_CODE_SNIPPETS = [
  'const stream = await openOverlayChannel({ mode: "fullscreen" });',
  '01001011 01100101 01110010 01101110 01100101 01101100',
  'if (permission.displayOverApps === true) attachChatLayer();',
  'void dispatchEncryptedPacket(0x7F, payload.buffer);',
  '01110011 01100001 01101001 01100110 01110101 01101100',
  'while (session.active) { syncNeuralSocket(chunk); }',
  'interceptGesture(TOP_EDGE_SHUTTER | BACK_KEY_TRAP);',
  'verifyAccessToken(digest) ? releaseOverlay() : holdFocus();',
];

export default function BinaryRainCanvas({
  opacityClass = 'opacity-35',
  accent = 'emerald',
}: BinaryRainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const fontSize = 14;
    let columns = Math.max(1, Math.floor(width / fontSize));
    let drops: number[] = Array.from({ length: columns }, () =>
      Math.floor(Math.random() * -(height / fontSize))
    );

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      columns = Math.max(1, Math.floor(width / fontSize));
      drops = Array.from({ length: columns }, () =>
        Math.floor(Math.random() * (height / fontSize))
      );
    };

    window.addEventListener('resize', handleResize);

    const chars = ['0', '1', '0', '1', '0', '1', '0', '1'];
    let lastTime = 0;
    const frameInterval = 46; // ~22fps crisp terminal rain cadence

    const drawFrame = (timestamp: number) => {
      if (timestamp - lastTime >= frameInterval) {
        lastTime = timestamp;

        ctx.fillStyle = 'rgba(3, 5, 4, 0.14)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          const isLead = Math.random() > 0.88;
          if (accent === 'crimson') {
            ctx.fillStyle = isLead ? '#FCA5A5' : i % 3 === 0 ? '#10B981' : '#EF4444';
          } else {
            ctx.fillStyle = isLead ? '#D1FAE5' : i % 7 === 0 ? '#F87171' : '#10B981';
          }

          ctx.fillText(text, x, y);

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }

      if (!prefersReducedMotion) {
        animationId = window.requestAnimationFrame(drawFrame);
      }
    };

    if (prefersReducedMotion) {
      drawFrame(frameInterval);
    } else {
      animationId = window.requestAnimationFrame(drawFrame);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        window.cancelAnimationFrame(animationId);
      }
    };
  }, [accent]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${opacityClass}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute inset-x-0 top-14 px-4 sm:px-8 h-36 overflow-hidden select-none">
        <div className="animate-code-stream space-y-1.5 font-mono-tabular text-[11px] text-emerald-400/35">
          {[...LIVE_CODE_SNIPPETS, ...LIVE_CODE_SNIPPETS].map((line, i) => (
            <div key={i} className="truncate">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
