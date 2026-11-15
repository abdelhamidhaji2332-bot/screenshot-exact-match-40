import { ArrowRight, CircleDot, Waves } from "lucide-react";

import type { ChapterId } from "@/game/ui/SimulationWorkbench";

type CircuitDiagramProps = {
  gain: number;
  capacitanceNf: number;
  activeChapter: ChapterId;
};

const blockData = [
  { id: "piezo", number: "01", title: "Récepteur", subtitle: "PZT · 40 kHz" },
  { id: "filter", number: "02", title: "Filtrage", subtitle: "C₁ · passe-bande" },
  { id: "gain", number: "03", title: "Amplification", subtitle: "Gain ×" },
  { id: "limit", number: "04", title: "Décision", subtitle: "Écho numérique" },
] as const;

export function CircuitDiagram({ gain, capacitanceNf, activeChapter }: CircuitDiagramProps) {
  return (
    <div className="circuit-diagram">
      <div className="diagram-rail diagram-rail-top">
        <span><Waves size={13} /> RÉCEPTION · SIGNAL FAIBLE</span>
        <span className="diagram-live-dot" />
      </div>
      <div className="diagram-flow">
        {blockData.map((block, index) => (
          <div className="diagram-step-group" key={block.id}>
            <div className={`circuit-step ${block.id === activeChapter ? "circuit-step-active" : ""}`}>
              <span className="circuit-step-index">{block.number}</span>
              <div className={`circuit-symbol circuit-symbol-${block.id}`}>
                {block.id === "piezo" && (
                  <svg viewBox="0 0 40 32" role="img" aria-label="Symbole du récepteur ultrasonore">
                    <path d="M3 6H11L26 2V30L11 26H3Z" />
                    <path d="M31 8Q39 16 31 24M34 4Q46 16 34 28" />
                  </svg>
                )}
                {block.id === "filter" && (
                  <svg viewBox="0 0 42 32" role="img" aria-label="Condensateur de filtrage C1">
                    <path d="M2 16H16M16 5V27M25 5V27M25 16H40" />
                  </svg>
                )}
                {block.id === "gain" && (
                  <svg viewBox="0 0 42 36" role="img" aria-label="Amplificateur opérationnel">
                    <path d="M7 3L36 18L7 33Z" />
                    <path d="M1 12H8M1 24H8M36 18H42M12 8V13M10 10H14M11 24H15" />
                  </svg>
                )}
                {block.id === "limit" && <CircleDot size={22} strokeWidth={1.55} />}
              </div>
              <span className="circuit-step-name">{block.title}</span>
              <span className="circuit-step-subtitle">
                {block.id === "filter" ? `${capacitanceNf} nF · τ ≈ ${(1.8 * capacitanceNf).toFixed(0)} µs` : block.id === "gain" ? `Aᵥ ≈ ${gain.toFixed(1)}×` : block.subtitle}
              </span>
              {block.id === "filter" && <span className="circuit-tag">C₁</span>}
              {block.id === "gain" && <span className="circuit-tag">Aᵥ</span>}
            </div>
            {index < blockData.length - 1 && (
              <div className="diagram-connector" aria-hidden="true">
                <span />
                <ArrowRight size={13} />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="diagram-out-row">
        <span className="diagram-ground"><i /> MASSE COMMUNE</span>
        <span className="diagram-out">V<sub>OUT</sub> <span className="diagram-out-wave">〰</span></span>
      </div>
    </div>
  );
}