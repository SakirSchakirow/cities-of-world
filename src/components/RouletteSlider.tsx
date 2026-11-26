import { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

interface RouletteSliderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  ariaLabel: string;
}

export function RouletteSlider({
  value,
  min,
  max,
  onChange,
  ariaLabel,
}: RouletteSliderProps) {
  const dragStartRef = useRef<{ x: number; startVal: number } | null>(null);

  // Build visible roulette window around the current value (-3..+3)
  const offsets = [-3, -2, -1, 0, 1, 2, 3];

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, startVal: value };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    // Dragging left increases number like spinning a horizontal roulette wheel
    const deltaSteps = Math.round(-dx / 18);
    const next = Math.max(min, Math.min(max, dragStartRef.current.startVal + deltaSteps));
    if (next !== value) {
      onChange(next);
    }
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dir = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
    const next = Math.max(min, Math.min(max, value + dir));
    if (next !== value) onChange(next);
  };

  return (
    <div className="space-y-2.5">
      {/* Tactile Roulette Wheel Strip */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Decrease count"
          className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>

        <div
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              onChange(Math.min(max, value + 1));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              onChange(Math.max(min, value - 1));
            }
          }}
          className="relative flex-1 h-12 rounded-xl bg-slate-100 border-2 border-slate-200 overflow-hidden select-none touch-none cursor-ew-resize flex items-center justify-center gap-1 sm:gap-2 px-2 focus:outline-none focus:border-[#3A86FF]"
        >
          {/* Center Selection Indicator */}
          <div
            className="pointer-events-none absolute inset-y-1 left-1/2 -translate-x-1/2 w-12 rounded-lg bg-[#FFBE0B] shadow-xs"
            aria-hidden="true"
          />

          {offsets.map((offset) => {
            const num = value + offset;
            const inRange = num >= min && num <= max;
            const isCenter = offset === 0;
            const distance = Math.abs(offset);

            return (
              <button
                key={offset}
                type="button"
                disabled={!inRange}
                onClick={(e) => {
                  e.stopPropagation();
                  if (inRange) onChange(num);
                }}
                tabIndex={-1}
                className={`relative z-10 w-9 sm:w-10 text-center font-mono tabular-nums transition-transform cursor-pointer ${
                  !inRange
                    ? 'opacity-0 pointer-events-none'
                    : isCenter
                      ? 'text-lg font-black text-slate-950 scale-105'
                      : distance === 1
                        ? 'text-sm font-bold text-slate-700'
                        : distance === 2
                          ? 'text-xs font-semibold text-slate-400'
                          : 'hidden sm:block text-[11px] font-medium text-slate-300'
                }`}
              >
                {inRange ? num : ''}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Increase count"
          className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Precision Scrubbing Slider + Quick Presets */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={ariaLabel}
          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#3A86FF]"
        />
        <div className="flex items-center gap-1 shrink-0">
          {[7, 15, 30, 100].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`px-2 py-1 rounded-md font-mono text-[11px] font-extrabold transition-colors cursor-pointer ${
                value === preset
                  ? 'bg-[#3A86FF] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
