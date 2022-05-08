import * as fs from "fs";
import streamChain from "stream-chain";
import streamJson from "stream-json";
import StreamArray from "stream-json/streamers/StreamArray.js";
import { getPlugins } from "./plugin/getPlugins.js";
import { debug } from "./util/log.js";

const { chain } = streamChain;
const { parser } = streamJson;
const { streamArray } = StreamArray;

async function forEachTraceEvent(filename, cb) {
  return new Promise((resolve) => {
    const pipeline = chain([
      fs.createReadStream(filename),
      parser(),
      streamArray(),
    ]);

    pipeline.on("data", ({ value }) => {
      cb(value);
    });

    pipeline.on("end", () => {
      resolve();
    });
  });
}

/**
 * From a trace file (
 * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview
 * ) return an object with extracted data for relevant URLs and function names
 * @param filename
 * @returns result object
 */
export async function extractProfileMetrics(
  filename,
  { config, reportProgress = () => {} }
) {
  const plugins = getPlugins(config);
  debug(filename, "Performing preExtract on trace");
  reportProgress(1 / 3);

  await forEachTraceEvent(filename, (event) => {
    plugins.forEach((plugin) => {
      plugin.preExtract(event);
    });
  });

  debug(filename, "Performing extract on trace");
  reportProgress(1 / 3);

  await forEachTraceEvent(filename, (event) => {
    plugins.forEach((plugin) => {
      plugin.extract(event);
    });
  });

  const results = plugins
    .map((p) => p.report())
    .reduce((a, b) => ({ ...a, ...b }), {});

  reportProgress(1 / 3);
  debug(filename, `results ${JSON.stringify(results, null, 2)}`);

  return results;
}
