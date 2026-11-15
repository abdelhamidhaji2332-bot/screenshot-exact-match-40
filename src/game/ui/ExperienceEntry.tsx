import { useState } from "react";

import { BootScreen } from "@/game/ui/BootScreen";
import { SimulationWorkbench } from "@/game/ui/SimulationWorkbench";

export function ExperienceEntry() {
  const [bootState, setBootState] = useState<"boot" | "exiting" | "ready">("boot");

  const initialize = () => {
    if (bootState !== "boot") return;
    setBootState("exiting");
    window.setTimeout(() => setBootState("ready"), 540);
  };

  if (bootState === "ready") return <SimulationWorkbench />;

  return <BootScreen onInitialize={initialize} exiting={bootState === "exiting"} />;
}