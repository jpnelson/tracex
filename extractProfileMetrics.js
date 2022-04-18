import * as fs from "fs";
import streamChain from "stream-chain";
import streamJson from "stream-json";
import Pick from "stream-json/filters/Pick.js";
import StreamArray from "stream-json/streamers/StreamArray.js";
import { log } from "./util/log.js";

const { chain } = streamChain;
const { parser } = streamJson;
const { pick } = Pick;
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
export async function extractProfileMetrics(filename, { urls, functions }) {
  log(
    `Extracting profile metrics: searching for urls: ${JSON.stringify(
      urls
    )} and functions: ${JSON.stringify(functions)}`
  );

  const relevantFunctionNodes = {};
  const relevantUrlNodes = {};

  log(`Parsing ${filename}`);
  await forEachTraceEvent(filename, (event) => {
    if (event.name !== "ProfileChunk") {
      return;
    }
    const callStackFunctionsFound = new Set();

    event.args?.data?.cpuProfile?.nodes?.forEach((node) => {
      urls.forEach((url) => {
        if (node.callFrame?.url?.indexOf(url) > -1) {
          relevantUrlNodes[url] = relevantUrlNodes[url] || new Set();
          relevantUrlNodes[url].add(node.id);
        }
      });

      functions.forEach((functionName) => {
        if (
          callStackFunctionsFound.has(functionName) ||
          node.callFrame?.functionName?.indexOf(functionName) > -1
        ) {
          callStackFunctionsFound.add(functionName);
          relevantFunctionNodes[functionName] =
            relevantFunctionNodes[functionName] || new Set();
          relevantFunctionNodes[functionName].add(node.id);
        }
      });
    });
  });

  log("Trace parsed and relevant nodes identified");

  const results = {};

  function count(type, name, field, amount = 1) {
    results[`${type}.${name}`] = results[`${type}.${name}`] || {
      timeTotal: 0,
      samplesPresent: 0,
      sampleTotal: 0,
    };
    results[`${type}.${name}`][field] += amount;
  }

  await forEachTraceEvent(filename, (event) => {
    event.args?.data?.cpuProfile?.samples?.forEach((sample, i) => {
      urls.forEach((url) => {
        if (relevantUrlNodes[url] && relevantUrlNodes[url].has(sample)) {
          count("url", url, "timeTotal", event.args?.data?.timeDeltas[i] ?? 0);
          count("url", url, "samplesPresent");
        }
        count("url", url, "sampleTotal");
      });
      functions.forEach((functionName) => {
        if (
          relevantFunctionNodes[functionName] &&
          relevantFunctionNodes[functionName].has(sample)
        ) {
          count(
            "function",
            functionName,
            "timeTotal",
            event.args?.data?.timeDeltas[i] ?? 0
          );
          count("function", functionName, "samplesPresent");
        }
        count("function", functionName, "sampleTotal");
      });
    });
  });

  log(`results ${JSON.stringify(results, null, 2)}`);

  return results;
}
