"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type EcgLineProps = {
  className?: string;
  /** seconds per full sweep of the bright segment */
  duration?: number;
};

const W = 1600;
const H = 140;
const MID = H / 2;

/** Tile a heartbeat complex across the canvas. */
function buildPath(): string {
  let d = `M0 ${MID}`;
  const seg = 200;
  for (let x = 0; x < W; x += seg) {
    d += ` L${x + 70} ${MID}`;
    d += ` l12 -7 l8 13 l13 -${Math.round(H * 0.36)} l14 ${Math.round(H * 0.62)} l12 -${Math.round(
      H * 0.26,
    )} l10 8`;
    d += ` L${x + seg} ${MID}`;
  }
  return d;
}

const PATH = buildPath();

/**
 * Animated electrocardiogram trace — the Pulse brand motif.
 * A dim base trace sits under a bright sweeping highlight.
 */
export function EcgLine({ className, duration = 7 }: EcgLineProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden
      className={cn("h-full w-full", className)}
    >
      <defs>
        <linearGradient id={`ecg-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00e599" stopOpacity="0" />
          <stop offset="45%" stopColor="#00e599" />
          <stop offset="100%" stopColor="#4da3ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={PATH} fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="1.5" />
      <path
        d={PATH}
        fill="none"
        stroke={`url(#ecg-${uid})`}
        strokeWidth="2"
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="12 88"
        className="pl-ecg-sweep"
        style={{ animationDuration: `${duration}s` }}
      />
    </svg>
  );
}
