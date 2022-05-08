import * as fs from "fs";
import streamChain from "stream-chain";
import streamJson from "stream-json";
import StreamArray from "stream-json/streamers/StreamArray.js";
import { getPlugins } from "../plugin/getPlugins.js";
import { debug } from "../util/log.js";

const { chain } = streamChain;
const { parser } = streamJson;
const { streamArray } = StreamArray;

async function forEachTraceEvent(filename, cb) {
  return new Promise((resolve, reject) => {
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

    pipeline.on("error", (e) => {
      debug("stream", "error", e);
      reject(e);
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
export async function extractProfileMetrics(filename, { config }) {
  const plugins = getPlugins(config);
  debug("extractProfileMetrics", filename, "Performing preExtract on trace");

  await forEachTraceEvent(filename, (event) => {
    plugins.forEach((plugin) => {
      plugin.preExtract(event);
    });
  });

  debug("extractProfileMetrics", filename, "Performing extract on trace");

  await forEachTraceEvent(filename, (event) => {
    plugins.forEach((plugin) => {
      plugin.extract(event);
    });
  });

  const results = plugins
    .map((p) => p.report())
    .reduce((a, b) => ({ ...a, ...b }), {});

  debug(
    "extractProfileMetrics",
    filename,
    `results ${JSON.stringify(results, null, 2)}`
  );

  return results;
}
