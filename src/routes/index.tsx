import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const ExperienceEntry = lazy(() => import("@/game/ui/ExperienceEntry").then((module) => ({ default: module.ExperienceEntry })));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sensibilité ultrasonore · Simulateur HC‑SR04" },
      {
        name: "description",
        content: "Simulateur interactif de métrologie du capteur HC‑SR04 : température, temps de vol, amplification, bruit et sensibilité.",
      },
      { property: "og:title", content: "Sensibilité ultrasonore · Simulateur HC‑SR04" },
      {
        property: "og:description",
        content: "Manipulez un capteur ultrasonore HC‑SR04 en 3D et observez sa réponse, son bruit et son temps de vol.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <Suspense fallback={<div className="app-loading" aria-label="Chargement du laboratoire">INITIALISATION DU LABORATOIRE…</div>}>
      <ExperienceEntry />
    </Suspense>
  );
}