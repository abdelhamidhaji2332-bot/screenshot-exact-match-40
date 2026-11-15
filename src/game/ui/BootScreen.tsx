import { Activity, Cpu, Radio, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type BootScreenProps = {
  onInitialize: () => void;
  exiting: boolean;
};

const telemetryLines = [
  "[SYS_INIT]  PIEZO_TRANSDUCER_READY",
  "[CALIBRATING]  40.000 kHz · 8-CYCLE BURST",
  "[METROLOGY]  S = Δs / Δe MATRIX LOADED",
  "[THERMAL]  SPEED-OF-SOUND COMPENSATION ONLINE",
];

export function BootScreen({ onInitialize, exiting }: BootScreenProps) {
  const [visibleLines, setVisibleLines] = useState(1);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setVisibleLines((current) => Math.min(current + 1, telemetryLines.length));
    }, 320);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className={`boot-screen ${exiting ? "boot-screen-exiting" : ""}`} aria-label="Initialisation de la simulation">
      <div className="boot-grid" aria-hidden="true" />
      <div className="boot-content">
        <div className="boot-mark">
          <div className="boot-mark-icon">
            <Radio size={21} strokeWidth={1.7} />
          </div>
          <span>LABORATOIRE DE MÉTROLOGIE</span>
          <span className="boot-mark-version">TIPE · 2025—26</span>
        </div>

        <div className="boot-scope" aria-label="Signal ultrasonore de 40 kilohertz">
          <div className="boot-scope-line" />
          <svg viewBox="0 0 720 96" preserveAspectRatio="none" role="img" aria-hidden="true">
            <path
              className="boot-wave-path"
              d="M0 48 H120 Q132 48 136 36 T148 24 T160 72 T172 24 T184 72 T196 24 T208 72 T220 48 H720"
            />
          </svg>
          <div className="boot-scope-label">
            <span>ÉMISSION PIEZOÉLECTRIQUE</span>
            <span>40 kHz&nbsp; · &nbsp;8 CYCLES</span>
          </div>
        </div>

        <div className="boot-copy">
          <div className="boot-eyebrow">
            <Sparkles size={13} />
            <span>SIMULATION INTERACTIVE DE CAPTEUR</span>
          </div>
          <h1>
            Welcome to our
            <br />
            <span>presentation simulation.</span>
          </h1>
          <p>
            Caractéristiques des capteurs&nbsp;: étude rigoureuse de la sensibilité
            <br className="boot-desktop-break" />
            du capteur ultrasonore HC‑SR04.
          </p>
        </div>

        <div className="boot-footer">
          <div className="boot-telemetry" aria-live="polite">
            <div className="boot-telemetry-header">
              <Cpu size={13} />
              <span>CONSOLE SYSTÈME</span>
              <span className="boot-online-dot" />
            </div>
            {telemetryLines.slice(0, visibleLines).map((line) => (
              <div className="boot-telemetry-line" key={line}>
                <span className="boot-check">›</span>
                {line}
              </div>
            ))}
          </div>
          <div className="boot-action">
            <Activity size={15} aria-hidden="true" />
            <span>INTERFACE PRÊTE</span>
            <Button className="initialize-button" onClick={onInitialize}>
              Initialiser la simulation <span aria-hidden="true">→</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="boot-corner boot-corner-top">ACQUISITION D’UN SIGNAL</div>
      <div className="boot-corner boot-corner-bottom">HC—SR04&nbsp; / &nbsp;STATION 01</div>
    </section>
  );
}