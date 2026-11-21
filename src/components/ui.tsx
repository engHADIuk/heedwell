import {
  Bug,
  CircleCheck,
  CircleDot,
  Leaf,
  OctagonAlert,
  TriangleAlert,
  Trees,
  Worm,
  type LucideIcon,
} from "lucide-react";
import { useId } from "react";
import { LEVELS } from "@/lib/copy";
import type { Level, ThreatId } from "@/lib/risk/types";

const LEVEL_ICON: Record<Level, LucideIcon> = {
  low: CircleCheck,
  moderate: CircleDot,
  high: TriangleAlert,
  veryHigh: OctagonAlert,
};

const THREAT_ICON: Record<ThreatId, LucideIcon> = {
  fleas: Bug,
  ticks: Trees,
  lungworm: Worm,
  harvestMites: Leaf,
};

export function ThreatIcon({ threat, size = 20 }: { threat: ThreatId; size?: number }) {
  const Icon = THREAT_ICON[threat];
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}

/** Colour is never the only signal: every level has an icon and a word. */
export function LevelBadge({ level, className = "" }: { level: Level; className?: string }) {
  const Icon = LEVEL_ICON[level];
  return (
    <span className={`badge lv-${level} ${className}`}>
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      {LEVELS[level].label}
    </span>
  );
}

/** The Heedwell mark: a paw print with one coral toe, the same coral as the "today" dot on the week ribbon. */
export function BrandMark({ size = 30 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="brand__mark">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0B3C3F" />
          <stop offset="1" stopColor="#14736F" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.82" cy="0.08" r="0.75">
          <stop offset="0" stopColor="#8FD9C4" stopOpacity="0.45" />
          <stop offset="1" stopColor="#8FD9C4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-paw`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D5F5EA" />
          <stop offset="1" stopColor="#8FD9C4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={`url(#${id}-bg)`} />
      <rect width="64" height="64" rx="18" fill={`url(#${id}-glow)`} />
      <g transform="translate(0 -3)">
        <ellipse cx="14.5" cy="33" rx="4.6" ry="6.2" transform="rotate(-24 14.5 33)" fill={`url(#${id}-paw)`} />
        <ellipse cx="24" cy="22.5" rx="5" ry="6.8" transform="rotate(-9 24 22.5)" fill={`url(#${id}-paw)`} />
        <ellipse cx="40" cy="22.5" rx="5" ry="6.8" transform="rotate(9 40 22.5)" fill={`url(#${id}-paw)`} />
        <ellipse cx="49.5" cy="33" rx="4.6" ry="6.2" transform="rotate(24 49.5 33)" fill="#FF8A65" />
        <path
          d="M32 33.5c-6.6 0-14.5 7.3-14.5 14 0 4.6 3.4 7.2 7.3 7.2 2.3 0 4.2-1 7.2-1s4.9 1 7.2 1c3.9 0 7.3-2.6 7.3-7.2 0-6.7-7.9-14-14.5-14z"
          fill={`url(#${id}-paw)`}
        />
      </g>
    </svg>
  );
}

/** Circular score, filled in proportion. The number and label are the real information. */
export function ScoreRing({ score, level, size = 148, label }: { score: number; level: Level; size?: number; label: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      role="img"
      aria-label={`${label}: ${score} out of 100, ${LEVELS[level].label.toLowerCase()}`}
      className={`ring lv-${level}`}
    >
      <circle cx="64" cy="64" r={r} className="ring__track" />
      <circle
        cx="64"
        cy="64"
        r={r}
        className="ring__value"
        strokeDasharray={`${(c * score) / 100} ${c}`}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="68" textAnchor="middle" className="ring__num">
        {score}
      </text>
      <text x="64" y="87" textAnchor="middle" className="ring__of">
        out of 100
      </text>
    </svg>
  );
}

/** Seven days of one threat on a fixed 0 to 100 scale, so the shape is honest. */
export function Sparkline({ values, selected, dates }: { values: number[]; selected: number; dates: string[] }) {
  const id = useId();
  const w = 140;
  const h = 40;
  const pad = 5;
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, values.length - 1);
  const y = (v: number) => h - pad - (v / 100) * (h - 2 * pad);
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${h} L${x(0).toFixed(1)} ${h} Z`;
  return (
    <div className="spark" aria-hidden="true">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14736F" stopOpacity=".28" />
            <stop offset="1" stopColor="#14736F" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke="#0B3C3F" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* The marker is HTML, so the stretched chart doesn't squash it into an oval. */}
      <span
        className="spark__dot"
        data-date={dates[selected]}
        style={{ left: `${(x(selected) / w) * 100}%`, bottom: `${((h - y(values[selected])) / h) * 100}%` }}
      />
    </div>
  );
}
