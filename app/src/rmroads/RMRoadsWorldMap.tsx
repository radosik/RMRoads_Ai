import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

type Port = { code: string; lon: number; lat: number };

const PORTS: Port[] = [
  { code: "LAX", lon: -118, lat: 33 },
  { code: "JFK", lon: -74, lat: 40 },
  { code: "VRC", lon: -96, lat: 19 },
  { code: "RTM", lon: 4, lat: 51 },
  { code: "HAM", lon: 9, lat: 53 },
  { code: "DXB", lon: 55, lat: 25 },
  { code: "SIN", lon: 103, lat: 1 },
  { code: "SHA", lon: 121, lat: 31 },
  { code: "HKG", lon: 114, lat: 22 },
  { code: "SYD", lon: 151, lat: -33 },
  { code: "CPT", lon: 18, lat: -33 },
];

const ROUTES: Array<[string, string]> = [
  ["SHA", "LAX"],
  ["SIN", "RTM"],
  ["VRC", "JFK"],
  ["HKG", "HAM"],
  ["CPT", "DXB"],
  ["SYD", "LAX"],
  ["DXB", "RTM"],
];

const ALERT_PORT = "SHA";

const VIEW_W = 1000;
const VIEW_H = 500;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * VIEW_W;
  const y = ((90 - lat) / 180) * VIEW_H;
  return [x, y];
}

function arcPath(from: Port, to: Port): string {
  const [x1, y1] = project(from.lon, from.lat);
  const [x2, y2] = project(to.lon, to.lat);
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const ctrlY = midY - Math.min(dist * 0.35, 110);
  return `M ${x1} ${y1} Q ${midX} ${ctrlY} ${x2} ${y2}`;
}

// Stylized continent blobs (not geographically accurate, intentionally abstract).
const CONTINENT_PATHS = [
  // North America
  "M 200 115 C 245 90 295 95 325 125 C 340 165 315 215 285 245 C 270 275 245 285 220 270 C 185 250 150 215 162 172 C 170 145 182 122 200 115 Z",
  // Mexico/Central America extension
  "M 235 248 C 252 272 268 290 248 290 C 232 285 224 262 235 248 Z",
  // South America
  "M 290 295 C 322 290 350 315 343 360 C 325 405 296 442 275 432 C 263 412 270 380 282 350 C 287 320 290 308 290 295 Z",
  // Europe (compact)
  "M 508 148 C 548 144 585 154 596 170 C 583 188 545 190 520 182 C 508 172 503 158 508 148 Z",
  // British Isles hint
  "M 488 148 C 498 146 503 155 497 162 C 488 162 484 156 488 148 Z",
  // Africa
  "M 540 198 C 585 195 612 225 622 275 C 615 325 593 365 562 380 C 535 370 514 338 510 296 C 510 250 525 215 540 198 Z",
  // Asia (large)
  "M 600 128 C 700 112 800 122 882 152 C 898 195 882 238 832 252 C 770 255 700 250 650 242 C 614 225 593 195 600 128 Z",
  // India peninsula
  "M 705 225 C 722 248 722 268 708 282 C 694 277 688 256 700 230 Z",
  // SE Asia / Indonesia hint
  "M 815 268 C 838 265 855 278 850 292 C 832 297 815 287 815 268 Z",
  // Australia
  "M 848 350 C 895 345 938 360 938 386 C 922 412 880 412 854 396 C 836 380 836 360 848 350 Z",
];

export function RMRoadsWorldMap() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const root = svgRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const arcs = Array.from(root.querySelectorAll<SVGPathElement>(".rmr-arc"));
    arcs.forEach((arc) => {
      const len = arc.getTotalLength();
      arc.style.strokeDasharray = `${len}`;
      arc.style.strokeDashoffset = reduceMotion ? "0" : `${len}`;
    });

    if (reduceMotion) return;

    animate(arcs, {
      strokeDashoffset: 0,
      duration: 1700,
      ease: "outCubic",
      delay: stagger(220),
    });

    const pulses = Array.from(
      root.querySelectorAll<SVGCircleElement>(".rmr-port-pulse"),
    );
    animate(pulses, {
      r: [
        { to: 4, duration: 0 },
        { to: 14, duration: 1400 },
      ],
      opacity: [
        { to: 0.55, duration: 0 },
        { to: 0, duration: 1400 },
      ],
      delay: stagger(220, { from: "first" }),
      loop: true,
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label="Global shipping routes with active disruption signal"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="rmr-port-gradient">
          <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#4cd7f6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#4cd7f6" stopOpacity="0" />
        </radialGradient>
        <filter id="rmr-arc-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        className="rmr-meridians"
        stroke="rgba(76, 215, 246, 0.05)"
        strokeWidth="0.5"
        fill="none"
      >
        {Array.from({ length: 11 }, (_, i) => (i * VIEW_W) / 10).map((x) => (
          <line key={`m-${x}`} x1={x} y1={0} x2={x} y2={VIEW_H} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (i * VIEW_H) / 5).map((y) => (
          <line key={`p-${y}`} x1={0} y1={y} x2={VIEW_W} y2={y} />
        ))}
      </g>

      <g
        className="rmr-continents"
        fill="rgba(212, 228, 250, 0.05)"
        stroke="rgba(212, 228, 250, 0.18)"
        strokeWidth="0.6"
      >
        {CONTINENT_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      <g
        className="rmr-arcs"
        stroke="#4cd7f6"
        strokeWidth="1.3"
        fill="none"
        strokeOpacity="0.85"
        filter="url(#rmr-arc-glow)"
      >
        {ROUTES.map(([from, to]) => {
          const f = PORTS.find((p) => p.code === from);
          const t = PORTS.find((p) => p.code === to);
          if (!f || !t) return null;
          return <path key={`${from}-${to}`} className="rmr-arc" d={arcPath(f, t)} />;
        })}
      </g>

      <g className="rmr-ports">
        {PORTS.map((p) => {
          const [x, y] = project(p.lon, p.lat);
          const isAlert = p.code === ALERT_PORT;
          return (
            <g key={p.code}>
              <circle
                className="rmr-port-pulse"
                cx={x}
                cy={y}
                r="4"
                fill={isAlert ? "url(#rmr-port-gradient)" : "url(#rmr-port-gradient)"}
                opacity="0"
              />
              <circle
                cx={x}
                cy={y}
                r="2.6"
                fill={isAlert ? "#ffb4ab" : "#4cd7f6"}
              />
              <text
                x={x + 7}
                y={y - 6}
                fill="rgba(212, 228, 250, 0.55)"
                fontSize="9"
                fontFamily="Geist, system-ui, sans-serif"
              >
                {p.code}
              </text>
            </g>
          );
        })}
      </g>

      {(() => {
        const alert = PORTS.find((p) => p.code === ALERT_PORT);
        if (!alert) return null;
        const [x, y] = project(alert.lon, alert.lat);
        return (
          <circle
            cx={x}
            cy={y}
            r="16"
            fill="rgba(255, 180, 171, 0.06)"
            stroke="#ffb4ab"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
        );
      })()}
    </svg>
  );
}
