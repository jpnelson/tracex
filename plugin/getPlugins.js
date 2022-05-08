import cpuPlugin from "./cpu.plugin.js";

export function getPlugins(config) {
  // TODO: use the config to read extra plugins from other places
  return [cpuPlugin].map((plugin) => plugin(config));
}
