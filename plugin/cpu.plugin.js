import { count } from "./utils/count.js";

export default function functionPlugin(config) {
  const relevantFunctionNodes = {};
  const relevantUrlNodes = {};
  const results = {};
  const { functions: functionsString, urls: urlsString } = config;
  const functions = functionsString.split(",").filter(Boolean);
  const urls = urlsString.split(",").filter(Boolean);

  return {
    preExtract: (event) => {
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
    },
    extract: (event) => {
      event.args?.data?.cpuProfile?.samples?.forEach((sample, i) => {
        urls.forEach((url) => {
          if (relevantUrlNodes[url] && relevantUrlNodes[url].has(sample)) {
            count(
              results,
              "url",
              url,
              "timeTotal",
              event.args?.data?.timeDeltas[i] ?? 0
            );
            count(results, "url", url, "samplesPresent");
          }
          count(results, "url", url, "sampleTotal");
        });
        functions.forEach((functionName) => {
          if (
            relevantFunctionNodes[functionName] &&
            relevantFunctionNodes[functionName].has(sample)
          ) {
            count(
              results,
              "function",
              functionName,
              "timeTotal",
              event.args?.data?.timeDeltas[i] ?? 0
            );
            count(results, "function", functionName, "samplesPresent");
          }
          count(results, "function", functionName, "sampleTotal");
        });
      });
    },
    report: () => {
      return results;
    },
  };
}
