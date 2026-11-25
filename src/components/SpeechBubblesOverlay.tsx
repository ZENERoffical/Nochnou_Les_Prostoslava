import React from 'react';
import { FloatingPickupText, SpeechBubbleState } from '../types/game';

interface SpeechBubblesOverlayProps {
  bubbles: SpeechBubbleState[];
  floatingTexts: FloatingPickupText[];
  frameClassName?: string;
}

export const SpeechBubblesOverlay: React.FC<SpeechBubblesOverlayProps> = ({
  bubbles,
  floatingTexts,
  frameClassName = 'fixed inset-0',
}) => {
  return (
    <div className={`pointer-events-none overflow-hidden z-20 ${frameClassName}`}>
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          style={{
            left: `${item.screenX}px`,
            top: `${item.screenY}px`,
            opacity: item.alpha,
            transform: 'translate(-50%, -50%)',
          }}
          className={`absolute font-black tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] whitespace-nowrap ${
            item.isGold ? 'text-yellow-300 text-xl' : 'text-emerald-300 text-base'
          }`}
        >
          {item.text}
        </div>
      ))}

      {bubbles.map((b) => {
        if (!b.visible) return null;
        const isRoner = b.speakerId === 'roner';
        const isNikita = b.speakerId === 'nikita';
        return (
          <div
            key={b.id}
            style={{
              left: `${b.screenX}px`,
              top: `${b.screenY}px`,
              transform: `translate(-50%, -100%) scale(${b.scale})`,
            }}
            className={`absolute ${
              b.isScream ? 'speech-bubble-scream z-30' : 'speech-bubble-pop'
            }`}
          >
            <div
              className={`relative rounded-2xl border-2 px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.55)] ${
                b.isScream && !isNikita
                  ? 'border-yellow-300 bg-red-600 text-white px-5 py-3'
                  : isNikita
                    ? 'border-emerald-400 bg-[#0d1f16] text-emerald-100'
                    : isRoner
                      ? 'border-amber-400 bg-[#1a1625] text-amber-100'
                      : 'border-cyan-400 bg-[#0f172a] text-cyan-100'
              }`}
            >
              <div
                className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
                  b.isScream && !isNikita
                    ? 'text-yellow-200'
                    : isNikita
                      ? 'text-emerald-300'
                      : isRoner
                        ? 'text-amber-300'
                        : 'text-cyan-300'
                }`}
              >
                {b.speaker}
              </div>
              <div
                className={`font-black leading-tight max-w-[280px] sm:max-w-xs ${
                  b.isScream ? 'text-lg sm:text-xl tracking-wide' : 'text-sm sm:text-base'
                }`}
              >
                — {b.text}
              </div>
              <div
                className={`absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-r-2 border-b-2 ${
                  b.isScream && !isNikita
                    ? 'border-yellow-300 bg-red-600'
                    : isNikita
                      ? 'border-emerald-400 bg-[#0d1f16]'
                      : isRoner
                        ? 'border-amber-400 bg-[#1a1625]'
                        : 'border-cyan-400 bg-[#0f172a]'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
