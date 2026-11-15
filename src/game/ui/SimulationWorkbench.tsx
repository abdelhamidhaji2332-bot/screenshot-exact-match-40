import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  AudioWaveform,
  BadgeCheck,
  BookOpen,
  Download,
  Layers3,
  Minus,
  Radio,
  SlidersHorizontal,
  Thermometer,
  Waves,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SENSOR_LIMITS, distanceResolutionCm, echoTimeMicroseconds, speedOfSound } from "@/game/sensor-model";
import { SensorScene } from "@/game/scene/SensorScene";
import { CircuitDiagram } from "@/game/ui/CircuitDiagram";
import { Oscilloscope } from "@/game/ui/Oscilloscope";

export type ChapterId = "piezo" | "filter" | "gain" | "limit";
type DataView = "schema" | "scope";

const chapters: { id: ChapterId; number: string; name: string; detail: string }[] = [
  { id: "piezo", number: "01", name: "Principe piézoélectrique", detail: "Conversion acoustique · 40 kHz" },
  { id: "filter", number: "02", name: "Filtrage & condensateur", detail: "Bande passante · constante RC" },
  { id: "gain", number: "03", name: "Amplification & sensibilité", detail: "Gain, pente & signal utile" },
  { id: "limit", number: "04", name: "Comparateur, bruit & RSB", detail: "Seuil de détection · saturation" },
];

const chapterExplainers: Record<ChapterId, { title: string; body: string; formula: string }> = {
  piezo: {
    title: "Un aller-retour ultrasonore",
    body: "Une salve de huit périodes à 40 kHz excite le transducteur. Le récepteur reconvertit l’écho mécanique en signal électrique.",
    formula: "Δt = 2d / c(T) · transducteur PZT",
  },
  filter: {
    title: "Extraire l’écho du bruit",
    body: "La capacité C₁ agit sur le temps de réponse du réseau RC. Un filtrage plus marqué atténue le bruit, mais peut émousser un écho bref.",
    formula: "τ = R C₁ · bande passante ≈ 1 / (2πτ)",
  },
  gain: {
    title: "Amplifier n’améliore pas tout",
    body: "Augmenter le gain relève le signal utile et le bruit d’entrée. La résolution dépend du rapport signal/bruit et de la dérive, pas du gain seul.",
    formula: "S = Δs / Δe · localement : S(e) = ds / de",
  },
  limit: {
    title: "Le seuil fixe la portée utile",
    body: "Quand le signal dépasse le comparateur, l’ECHO devient logique. L’amplitude limitée par l’alimentation sature : chaque mesure révèle un compromis de portée.",
    formula: "RSB = 20 log₁₀ (Aₛ / Aᵦ) · Vₒᵤₜ ≤ 5 V",
  },
};

function RangeControl({
  icon: Icon,
  label,
  value,
  min,
  max,
  step,
  unit,
  lowLabel,
  highLabel,
  onChange,
}: {
  icon: typeof Radio;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="control-row">
      <div className="control-row-top">
        <span className="control-name"><Icon size={13} strokeWidth={1.8} />{label}</span>
        <span className="control-value">{value.toFixed(step < 1 ? 1 : 0)}<small>{unit}</small></span>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([next]) => { if (next !== undefined) onChange(next); }}
      />
      <div className="control-range-labels"><span>{lowLabel}</span><span>{highLabel}</span></div>
    </div>
  );
}

function GainInsight({ gain }: { gain: number }) {
  const noiseLevel = Math.min(100, 19 + gain * 4.8);
  const resolution = distanceResolutionCm(gain, SENSOR_LIMITS.defaultTemperatureC);
  const snr = 31.2 - 7.8 * Math.log10(gain);
  const hasBadSNR = snr < 22;

  return (
    <div className="gain-insight" aria-live="polite">
      <div className="gain-insight-copy">
        <span className="insight-heading">ILLUSION D’AMPLIFICATION</span>
        <span className="insight-summary">Signal amplifié <strong>×{gain.toFixed(1)}</strong> <span className="insight-divider">·</span> bruit également</span>
      </div>
      <div className="noise-readout">
        <div className="noise-meter-track"><span style={{ width: `${noiseLevel}%` }} /></div>
        <span className="noise-meter-label">BRUIT&nbsp; {noiseLevel.toFixed(0)} %</span>
      </div>
      <div className="gain-metrics">
        <span><i>RSB estimé</i><strong>{snr.toFixed(1)} dB</strong></span>
        <span><i>Résolution estimée</i><strong>{resolution.toFixed(2)} cm</strong></span>
        <span className={`gain-state ${hasBadSNR ? "gain-state-warning" : ""}`}>
          <i>Rapport S / B</i><strong>{hasBadSNR ? "Bruit croissant" : "Détectable"}</strong>
        </span>
      </div>
      <span className="gain-model-note">Modèle pédagogique normalisé · indicateurs illustratifs, non spécifiés par le fabricant.</span>
    </div>
  );
}

export function SimulationWorkbench() {
  const [chapter, setChapter] = useState<ChapterId>("gain");
  const [dataView, setDataView] = useState<DataView>("schema");
  const [distance, setDistance] = useState(SENSOR_LIMITS.defaultDistanceCm);
  const [temperature, setTemperature] = useState(SENSOR_LIMITS.defaultTemperatureC);
  const [gain, setGain] = useState(SENSOR_LIMITS.defaultGain);
  const [capacitanceNf, setCapacitanceNf] = useState(SENSOR_LIMITS.defaultCapacitanceNf);
  const [exploded, setExploded] = useState(false);

  const soundSpeed = speedOfSound(temperature);
  const echoTime = echoTimeMicroseconds(distance, temperature);
  const compensatedDistance = (echoTime / 1_000_000) * soundSpeed * 50;
  const activeChapter = chapters.find((item) => item.id === chapter) ?? chapters[2]!;
  const explanation = chapterExplainers[chapter];
  const powerPointReady = false;

  return (
    <main className="lab-app">
      <header className="lab-topbar">
        <div className="lab-identity">
          <div className="lab-logo" aria-hidden="true"><Radio size={18} strokeWidth={1.7} /></div>
          <div className="lab-identity-copy">
            <span>ATELIER DE MÉTROLOGIE</span>
            <span>PROJET SCIENTIFIQUE · TIPE</span>
          </div>
        </div>
        <div className="topbar-session"><span className="session-status-dot" />SESSION EXPÉRIMENTALE <span className="session-divider" /> 01 / 04</div>
        <Button disabled={!powerPointReady} variant="outline" size="sm" className="presentation-button" title="Aucun fichier PowerPoint n’a été fourni">
          <Download size={14} /> <span>PRÉSENTATION</span> <span className="presentation-unavailable">À FOURNIR</span>
        </Button>
      </header>

      <section className="project-heading">
        <div className="project-title-group">
          <span className="project-eyebrow"><span>ÉLECTRONIQUE & INSTRUMENTATION</span><span className="eyebrow-dash" /><span>CHAPITRE {activeChapter.number}</span></span>
          <h1>Caractéristiques des capteurs <span>— étude de la sensibilité</span></h1>
          <p>Étude interactive du télémètre ultrasonore HC‑SR04 · capteur, réponse et incertitudes.</p>
        </div>
        <div className="instrument-status">
          <div className="instrument-status-icon"><Activity size={17} strokeWidth={1.8} /></div>
          <div><span>ÉTAT DU BANC</span><span>En acquisition</span></div>
          <span className="instrument-status-live"><i /><span>LIVE</span></span>
        </div>
      </section>

      <section className="workbench-grid" aria-label="Banc de simulation">
        <section className="sensor-panel" aria-label="Simulation tridimensionnelle du capteur">
          <div className="panel-heading">
            <div className="panel-title-group"><span className="panel-number">01</span><div><h2>Banc capteur</h2><span>MODÈLE 3D INTERACTIF · VUE PRODUIT</span></div></div>
            <div className="view-live"><span /><span>MESURE EN COURS</span></div>
          </div>
          <div className="sensor-stage">
            <SensorScene distance={distance} temperature={temperature} exploded={exploded} chapter={chapter} />
          </div>
          <div className="sensor-measurement-strip">
            <div className="measurement-cell"><span>PORTÉE CIBLE</span><strong>{distance.toFixed(0)} <small>cm</small></strong></div>
            <div className="measurement-separator" />
            <div className="measurement-cell"><span>TEMPS DE VOL · Δt</span><strong>{echoTime.toFixed(2)} <small>µs</small></strong></div>
            <div className="measurement-separator" />
            <div className="measurement-cell"><span>DISTANCE COMPENSÉE</span><strong>{compensatedDistance.toFixed(1)} <small>cm</small></strong></div>
            <div className="measurement-frequency"><Waves size={14} /><span>40 kHz</span></div>
          </div>
        </section>

        <aside className="instrument-panel" aria-label="Réglages de l’expérience">
          <div className="panel-heading controls-panel-heading">
            <div className="panel-title-group"><span className="panel-number">02</span><div><h2>Paramètres</h2><span>RÉGLAGES DE L’EXPÉRIENCE</span></div></div>
            <SlidersHorizontal size={15} className="control-panel-icon" />
          </div>

          <div className="chapter-section">
            <div className="section-kicker"><Layers3 size={12} /> <span>COUCHES DU SYSTÈME</span></div>
            <div className="chapter-list" role="group" aria-label="Chapitres du système">
              {chapters.map((item) => (
                <button className={`chapter-button ${chapter === item.id ? "chapter-button-active" : ""}`} key={item.id} onClick={() => setChapter(item.id)} aria-pressed={chapter === item.id}>
                  <span className="chapter-index">{item.number}</span>
                  <span className="chapter-copy"><span>{item.name}</span><small>{item.detail}</small></span>
                  <ArrowRight className="chapter-arrow" size={13} />
                </button>
              ))}
            </div>
          </div>

          <div className="parameter-section">
            <div className="section-kicker"><SlidersHorizontal size={12} /> <span>VARIABLES EXPÉRIMENTALES</span></div>
            <RangeControl icon={Activity} label="Sensibilité · gain" value={gain} min={SENSOR_LIMITS.gainMin} max={SENSOR_LIMITS.gainMax} step={0.5} unit="×" lowLabel="× 1 · gain minimal" highLabel="× 12 · saturation" onChange={setGain} />
            <RangeControl icon={ArrowDownRight} label="Distance de la cible" value={distance} min={SENSOR_LIMITS.distanceMinCm} max={SENSOR_LIMITS.distanceMaxCm} step={1} unit="cm" lowLabel="2 cm · portée min." highLabel="400 cm · portée max." onChange={setDistance} />
            <RangeControl icon={Minus} label="Condensateur · C₁" value={capacitanceNf} min={SENSOR_LIMITS.capacitanceMinNf} max={SENSOR_LIMITS.capacitanceMaxNf} step={1} unit="nF" lowLabel="1 nF · réponse rapide" highLabel="100 nF · filtre marqué" onChange={setCapacitanceNf} />
            <RangeControl icon={Thermometer} label="Température ambiante" value={temperature} min={SENSOR_LIMITS.temperatureMinC} max={SENSOR_LIMITS.temperatureMaxC} step={0.5} unit="°C" lowLabel="0 °C" highLabel="40 °C" onChange={setTemperature} />
          </div>

          <label className={`explode-toggle ${exploded ? "explode-toggle-active" : ""}`}>
            <span className="explode-toggle-icon"><Layers3 size={15} /></span>
            <span className="explode-toggle-copy"><span>Vue éclatée piézo</span><small>Disque céramique · laiton</small></span>
            <input type="checkbox" checked={exploded} onChange={(event) => setExploded(event.target.checked)} aria-label="Vue éclatée piézoélectrique" />
            <span className="explode-track" aria-hidden="true"><span /></span>
          </label>
        </aside>
      </section>

      <GainInsight gain={gain} />

      <section className="signal-panel" aria-labelledby="signal-title">
        <div className="panel-heading signal-heading">
          <div className="panel-title-group"><span className="panel-number">03</span><div><h2 id="signal-title">Chaîne de mesure</h2><span>SIGNAL ANALOGIQUE & TEMPS DE VOL</span></div></div>
          <div className="view-switch" role="tablist" aria-label="Vue de la chaîne de mesure">
            <button role="tab" aria-selected={dataView === "schema"} className={dataView === "schema" ? "view-tab view-tab-active" : "view-tab"} onClick={() => setDataView("schema")}><BookOpen size={13} /> SCHÉMA</button>
            <button role="tab" aria-selected={dataView === "scope"} className={dataView === "scope" ? "view-tab view-tab-active" : "view-tab"} onClick={() => setDataView("scope")}><AudioWaveform size={13} /> OSCILLOSCOPE</button>
          </div>
        </div>

        {dataView === "schema" ? (
          <div role="tabpanel" className="data-view-content">
            <CircuitDiagram gain={gain} capacitanceNf={capacitanceNf} activeChapter={chapter} />
            <div className="chapter-insight">
              <div className="insight-topline"><span className="insight-step">CH. {activeChapter.number}</span><span className="insight-topic"><BadgeCheck size={13} /> {activeChapter.name}</span></div>
              <h3>{explanation.title}</h3>
              <p>{explanation.body}</p>
              <span className="insight-formula">{explanation.formula}</span>
            </div>
          </div>
        ) : (
          <div role="tabpanel" className="data-view-content oscilloscope-content">
            <Oscilloscope distance={distance} temperature={temperature} gain={gain} capacitanceNf={capacitanceNf} chapter={chapter} />
          </div>
        )}
      </section>

      <section className="theory-section" aria-label="Repères de métrologie">
        <div className="theory-intro">
          <span className="section-kicker"><BookOpen size={12} /> <span>REPÈRES DE MÉTROLOGIE</span></span>
          <h2>Comprendre <span>la mesure.</span></h2>
          <p>Définir, caractériser, compenser.</p>
        </div>
        <div className="theory-item">
          <span className="theory-index">A</span>
          <h3>Sensibilité</h3>
          <span className="theory-formula">S = Δs / Δe<br />S(e) = ds / de</span>
          <p>Pente moyenne ou locale de la fonction de transfert.</p>
          <div className="unit-example-list"><span>mV · K⁻¹</span><span>pC · bar⁻¹</span><span>V · Pa⁻¹</span></div>
        </div>
        <div className="theory-item">
          <span className="theory-index">B</span>
          <h3>Modèle & linéarité</h3>
          <span className="theory-formula">s = f(e) · pente constante si linéaire</span>
          <p>Une réponse non linéaire demande un conditionnement ou une linéarisation numérique.</p>
          <span className="theory-note"><span>HC‑SR04</span> · durée ECHO ∝ distance</span>
        </div>
        <div className="theory-item theory-item-temperature">
          <span className="theory-index">C</span>
          <h3>Influence thermique</h3>
          <span className="theory-formula">c(T) = 331,3 + 0,606 T</span>
          <p>La vitesse du son modifie le temps de vol et introduit une sensibilité croisée.</p>
          <span className="theory-note"><Thermometer size={12} /> {temperature.toFixed(1)} °C <span>·</span> c = {soundSpeed.toFixed(1)} m/s</span>
        </div>
        <div className="theory-item theory-item-dynamics">
          <span className="theory-index">D</span>
          <h3>Réponse dynamique</h3>
          <span className="theory-formula">H₁(s) = K / (1 + τs)</span>
          <p>La constante de temps borne la bande passante et la durée de réponse.</p>
          <span className="theory-note"><Waves size={12} /> τ ≈ {(1.8 * capacitanceNf).toFixed(1)} µs · modèle 1ᵉʳ ordre</span>
        </div>
      </section>

      <footer className="lab-footer">
        <div><span className="footer-logo"><Radio size={13} /></span><span>LABORATOIRE DE MÉTROLOGIE</span><span className="footer-divider">/</span><span>HC‑SR04</span></div>
        <div className="footer-source"><span className="footer-source-dot" /> MODÈLE PÉDAGOGIQUE · INDICATEURS RSB ESTIMÉS</div>
        <span className="footer-version">S = ds / de</span>
      </footer>
    </main>
  );
}