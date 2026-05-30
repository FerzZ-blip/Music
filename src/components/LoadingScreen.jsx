import { useState } from 'react';

const PALETTE = ['#e8adaa', '#d0a880', '#b3add2', '#abc3ae', '#e0b67a', '#da8b86', '#958bbd'];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ARC_ANIMS = ['meteor-arc', 'meteor-arc-fast', 'meteor-arc-slow'];
const HEAD_COLORS = ['#f2cdcc', '#ecd5c0', '#e6e4f0', '#e4ebe5', '#f5ead4'];
const TAIL_COLORS = ['#e8adaa', '#d0a880', '#b3add2', '#abc3ae', '#e0b67a', '#da8b86'];

export default function LoadingScreen({ visible = true, message }) {
  const [stars] = useState(() => {
    const result = [];
    for (let i = 0; i < 140; i++) result.push({ l: rand(0, 100), t: rand(0, 100), s: rand(0.4, 1.2), d: rand(0, 6), g: 'dist' });
    for (let i = 0; i < 60; i++) result.push({ l: rand(0, 100), t: rand(0, 100), s: rand(1.2, 2.8), d: rand(0, 5), g: 'med', c: pick(PALETTE) });
    for (let i = 0; i < 15; i++) result.push({ l: rand(0, 100), t: rand(0, 100), s: rand(2.8, 4.5), d: rand(0, 7), g: 'bright', c: pick(PALETTE) });
    return result;
  });

  const [glows] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      l: rand(5, 95), t: rand(5, 50), s: rand(18, 45), d: i * 1.5, c: pick(PALETTE),
    }))
  );

  const [meteors] = useState(() =>
    Array.from({ length: 8 }, (_, i) => ({
      track: `meteor-track-${i + 1}`,
      top: rand(3, 22),
      left: rand(5, 75),
      dur: rand(5, 8),
      delay: i === 0 ? 0 : rand(0.8, 3) + i * 1.5,
      anim: pick(ARC_ANIMS),
      tailLen: rand(200, 320),
      tailWid: rand(6, 12),
      tailColor: pick(TAIL_COLORS),
      headColor: pick(HEAD_COLORS),
      headSize: rand(2.5, 4),
    }))
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none bg-warm-50 dark:bg-warm-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 animate-sky-drift">
          {stars.map((s, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${s.g === 'dist' ? 'dist-star' : s.g === 'med' ? 'med-star' : 'bright-star'}`}
              style={{
                left: `${s.l}%`,
                top: `${s.t}%`,
                width: `${s.s}px`,
                height: `${s.s}px`,
                animationDelay: `${s.d}s`,
                backgroundColor: s.c || (s.g === 'dist' ? (i % 2 ? '#e0c0a0' : '#d0a880') : undefined),
              }}
            />
          ))}
          {glows.map((g, i) => (
            <div
              key={`g-${i}`}
              className="star-glow"
              style={{
                left: `${g.l}%`,
                top: `${g.t}%`,
                width: `${g.s}px`,
                height: `${g.s}px`,
                animationDelay: `${g.d}s`,
                background: `radial-gradient(circle, ${g.c}30 0%, transparent 70%)`,
              }}
            />
          ))}
        </div>
        {meteors.map((m, i) => (
          <div
            key={`m-${i}`}
            className={`meteor ${m.track}`}
            style={{
              top: `${m.top}%`,
              left: `${m.left}%`,
              animation: `${m.anim} ${m.dur}s cubic-bezier(0.2, 0.6, 0.3, 1) ${m.delay}s infinite`,
            }}
          >
            <div
              className="meteor-tail-glow"
              style={{
                width: `${m.tailLen * 0.9}px`,
                height: `${m.tailWid * 2.5}px`,
                background: `
                  linear-gradient(
                    to right,
                    transparent 0%,
                    ${m.tailColor}05 25%,
                    ${m.tailColor}08 50%,
                    ${m.tailColor}12 75%,
                    ${m.tailColor}20 100%
                  )
                `,
              }}
            />
            <div
              className="meteor-tail"
              style={{
                width: `${m.tailLen}px`,
                height: `${m.tailWid}px`,
                background: `
                  linear-gradient(
                    to right,
                    transparent 0%,
                    ${m.tailColor}08 15%,
                    ${m.tailColor}12 30%,
                    ${m.tailColor}18 50%,
                    ${m.tailColor}30 65%,
                    ${m.tailColor}55 80%,
                    ${m.tailColor}75 92%,
                    ${m.tailColor}90 98%,
                    ${m.tailColor} 100%
                  )
                `,
                filter: 'blur(0.5px)',
              }}
            />
            <div
              className="meteor-head"
              style={{
                width: `${m.headSize}px`,
                height: `${m.headSize}px`,
                transform: `translate(50%, -50%)`,
                background: m.headColor,
              }}
            >
              <div
                className="meteor-head-core"
                style={{
                  width: `${m.headSize * 0.4}px`,
                  height: `${m.headSize * 0.4}px`,
                  transform: `translate(-50%, -50%)`,
                }}
              />
            </div>
          </div>
        ))}
        <div className="absolute inset-0 pointer-events-none sky-top-fade" />
        <div className="absolute inset-x-0 bottom-0 h-[15%] pointer-events-none sky-bot-fade" />
      </div>
      {message && (
        <div className="relative flex flex-col items-center gap-3">
          <div className="flex items-center gap-[3px] h-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full bg-rose-300/60 dark:bg-rose-400/60"
                style={{
                  height: `${6 + Math.sin(i * 1.2) * 6}px`,
                  animation: `bar-${(i % 3) + 1} ${0.5 + i * 0.1}s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          <p
            className="text-xs text-warm-400 dark:text-warm-500 tracking-wider animate-message-float"
            style={{ textTransform: 'lowercase' }}
          >
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
