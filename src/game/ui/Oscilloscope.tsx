import { Activity, Radio, Waves } from "lucide-react";

import { echoTimeMicroseconds } from "@/game/sensor-model";
import type { ChapterId } from "@/game/ui/SimulationWorkbench";

type OscilloscopeProps = {
  distance: number;
  temperature: number;
  gain: number;
  capacitanceNf: number;
  chapter: ChapterId;
};

function createWavePath(values: number[], baseline: number, amplitude: number, width: number) {
  return values
    .map((value, index) => `${index === 0 ? "M" : "L"} ${(index / (values.length - 1)) * width} ${(baseline - value * amplitude).toFixed(2)}`)
    .join(" ");
}

export function Oscilloscope({ distance, temperature, gain, capacitanceNf, chapter }: OscilloscopeProps) {
  const durationMs = echoTimeMicroseconds(distance, temperature) / 1000;
  const waveTimes = Array.from({ length: 240 }, (_, index) => index / 240);
  const delay = Math.min(durationMs / 28, 0.76);
  const burstAmplitude = chapter === "piezo" ? 20 : 13;
  const burst = waveTimes.map((time) => {
    const pulseEnvelope = time < 0.13 ? Math.sin(Math.PI * time / 0.13) : 0;
    return pulseEnvelope * (time < 0.13 ? Math.sin(time * 5200) : 0);
  });
  const echo = waveTimes.map((time) => {
    const relative = time - delay;
    if (relative < 0 || relative > 0.11) return 0;
    const envelope = Math.min(1, relative * 44) * Math.max(0, 1 - relative * 6.5);
    const carrier = Math.sin(relative * 4300);
    const noisyFloor = Math.sin(time * 1100 + 0.7) * 0.07 + Math.sin(time * 3100) * 0.038;
    return Math.max(-0.2, Math.min(1.15, envelope * (0.58 + gain * 0.024) * carrier + noisyFloor * (gain / 5)));
  });
  const echoPath = createWavePath(echo, 51, burstAmplitude * 1.5, 720);
  const burstPath = createWavePath(burst, 122, burstAmplitude * 0.72, 720);
  const timeMarks = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="oscilloscope-panel">
      <div className="scope-header">
        <div className="scope-channel-heading">
          <span className="scope-icon"><Activity size={15} /></span>
          <div>
            <span className="scope-title">Acquisition du signal</span>
            <span className="scope-subtitle">SIMULATION DU TEMPS DE VOL</span>
          </div>
        </div>
        <span className="scope-reading"><span>Δt</span> {durationMs.toFixed(3)} <small>ms</small></span>
      </div>
      <div className="oscilloscope-display">
        <div className="scope-left-axis"><span>V</span><span>+5</span><span>0</span><span>−5</span></div>
        <svg viewBox="0 0 720 156" preserveAspectRatio="none" role="img" aria-label={`Oscillogramme : salve émise et écho après ${durationMs.toFixed(2)} millisecondes`}>
          <defs>
            <linearGradient id="echo-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" className="scope-gradient-top" />
              <stop offset="100%" className="scope-gradient-bottom" />
            </linearGradient>
            <linearGradient id="pulse-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" className="pulse-gradient-top" />
              <stop offset="100%" className="pulse-gradient-bottom" />
            </linearGradient>
          </defs>
          {timeMarks.map((mark) => (
            <g key={`time-${mark}`} className="scope-grid-line">
              <line x1={mark * 120} x2={mark * 120} y1="0" y2="156" />
              <text x={mark * 120 + 4} y="150">{mark} ms</text>
            </g>
          ))}
          {[26, 51, 76, 101, 126].map((y) => <line key={y} className="scope-grid-line" x1="0" x2="720" y1={y} y2={y} />)}
          <line className="scope-baseline" x1="0" x2="720" y1="51" y2="51" />
          <line className="scope-baseline" x1="0" x2="720" y1="122" y2="122" />
          <path d={`M 0 122 ${burstPath.replace(/^M /, "L ")}`} fill="none" className="scope-pulse-path" />
          <path d={`M 0 51 ${echoPath.replace(/^M /, "L ")}`} fill="none" className="scope-echo-path" />
          <path d={`M 0 51 ${echoPath.replace(/^M /, "L ")} L 720 51 Z`} fill="url(#echo-fill)" className="scope-area" />
          <line className="scope-trigger-line" x1={Math.min(delay * 720, 718)} x2={Math.min(delay * 720, 718)} y1="5" y2="145" />
          <text className="scope-trigger-label" x={Math.min(delay * 720 + 8, 650)} y="16">ÉCHO · CIBLE {distance.toFixed(0)} cm</text>
          <line className="scope-threshold-line" x1="0" x2="720" y1="42" y2="42" />
          <text className="scope-threshold-label" x="587" y="38">SEUIL DU COMPARATEUR</text>
        </svg>
        <div className="scope-y-labels"><span>CH₂&nbsp; / &nbsp;ÉCHO</span><span>CH₁&nbsp; / &nbsp;TRIG</span></div>
        <div className="scope-x-label">TEMPS (ms) <span>·</span> 1 ms / DIV</div>
      </div>
      <div className="scope-footer">
        <span><i className="scope-legend-echo" /> CH₂&nbsp; ÉCHO AMPLIFIÉ</span>
        <span><i className="scope-legend-pulse" /> CH₁&nbsp; SALVE DE DÉCLENCHEMENT</span>
        <span className="scope-cap-read">C₁ · {(1.8 * capacitanceNf).toFixed(1)} µs</span>
        <span className="scope-read-status"><Radio size={12} /> ACQUISITION</span>
      </div>
    </div>
  );
}