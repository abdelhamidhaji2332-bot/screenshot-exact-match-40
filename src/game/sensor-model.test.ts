import { describe, expect, it } from "vitest";

import {
  SENSOR_LIMITS,
  distanceFromEchoMicroseconds,
  distanceResolutionCm,
  echoTimeMicroseconds,
  rcTimeConstantMicroseconds,
  speedOfSound,
  transferFunctionSensitivity,
} from "@/game/sensor-model";

describe("HC-SR04 teaching model metrology", () => {
  it("keeps the documented 2 cm to 400 cm measurement range", () => {
    expect([SENSOR_LIMITS.distanceMinCm, SENSOR_LIMITS.distanceMaxCm]).toEqual([2, 400]);
  });

  it("uses the documented temperature-dependent speed of sound", () => {
    expect(speedOfSound(20)).toBeCloseTo(343.42, 2);
    expect(speedOfSound(0)).toBeCloseTo(331.3, 2);
  });

  it("converts a round-trip echo duration into the corresponding distance", () => {
    const echoTime = echoTimeMicroseconds(120, 20);
    expect(echoTime).toBeCloseTo(6984.46, 1);
    expect(distanceFromEchoMicroseconds(echoTime, 20)).toBeCloseTo(120, 8);
  });

  it("reduces distance uncertainty when useful gain rises in this explicitly illustrative model", () => {
    expect(distanceResolutionCm(8, 20)).toBeLessThan(distanceResolutionCm(2, 20));
  });

  it("makes the filter time constant proportional to its C1 capacitance", () => {
    expect(rcTimeConstantMicroseconds(1.8, 10)).toBeCloseTo(18);
    expect(rcTimeConstantMicroseconds(1.8, 100)).toBeCloseTo(180);
  });

  it("calculates a static transfer sensitivity as output change per input change", () => {
    expect(transferFunctionSensitivity(2, 0.5)).toBeCloseTo(4);
    expect(transferFunctionSensitivity(2, 0)).toBe(0);
  });
});