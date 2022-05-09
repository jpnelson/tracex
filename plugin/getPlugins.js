import glob from "glob";
import path from "path";

import cpuPlugin from "./cpu.plugin.js";
import frameRatePlugin from "./frameRate.plugin.js";
import { log, debug } from "../util/log.js";

export async function getPlugins(config) {
  let pluginsFromFiles = [];
  if (config.plugins && config.plugins.length) {
    const pluginFiles = config.plugins
      .split(",")
      .map((pluginFileGlob) => glob.sync(pluginFileGlob))
      .flat()
      .map((f) => path.resolve(f));

    debug("getPlugins", "pluginFiles", pluginFiles);

    pluginsFromFiles = (
      await Promise.all(pluginFiles.map((pluginFile) => import(pluginFile)))
    ).map((p) => p.default);

    debug("getPlugins", "pluginsFromFiles", pluginsFromFiles);
  }

  const builtInPlugins = [cpuPlugin, frameRatePlugin];
  return [...builtInPlugins, ...pluginsFromFiles].map(({ name, plugin }) => {
    debug("getPlugins", "creating plugin", name, plugin);

    const pluginLog = (...message) => log(`plugin:${name}`, ...message);
    return plugin(config, pluginLog);
  });
}
