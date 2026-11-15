export const SENSOR_LIMITS = {
  distanceMinCm: 2,
  distanceMaxCm: 400,
  temperatureMinC: 0,
  temperatureMaxC: 40,
  defaultTemperatureC: 20,
  defaultDistanceCm: 120,
  defaultGain: 5,
  gainMin: 1,
  gainMax: 12,
  defaultCapacitanceNf: 10,
  capacitanceMinNf: 1,
  capacitanceMaxNf: 100,
} as const;

export function speedOfSound(temperatureC: number) {
  return 331.3 + 0.606 * temperatureC;
}

export function echoTimeMicroseconds(distanceCm: number, temperatureC: number) {
  return (2 * (distanceCm / 100) / speedOfSound(temperatureC)) * 1_000_000;
}

export function distanceFromEchoMicroseconds(timeUs: number, temperatureC: number) {
  return (timeUs / 1_000_000) * speedOfSound(temperatureC) * 50;
}

export function distanceResolutionCm(gain: number, temperatureC: number) {
  const normalizedNoise = 0.035;
  const normalizedEchoChangePerCm = 0.12;
  return (normalizedNoise / (normalizedEchoChangePerCm * gain)) * (speedOfSound(20) / speedOfSound(temperatureC));
}

export function rcTimeConstantMicroseconds(resistanceKOhm: number, capacitanceNf: number) {
  return resistanceKOhm * capacitanceNf;
}

export function transferFunctionSensitivity(outputSpan: number, inputSpan: number) {
  if (inputSpan === 0) return 0;
  return outputSpan / inputSpan;
}