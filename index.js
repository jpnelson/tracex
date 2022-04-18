import path from "path";
import glob from "glob";

import { getConfig } from "./util/config.js";
import { log, setSilent } from "./util/log.js";
import { extractProfileMetrics } from "./extractProfileMetrics.js";

async function main() {
  const { file, functions, urls, format, silent } = getConfig();
  if (silent) {
    setSilent(silent);
  }

  const filePaths = glob.sync(file);

  const functionsArray = functions.split(",").filter(Boolean);
  const urlsArray = urls.split(",").filter(Boolean);

  const extractionPromises = filePaths.map(async (filePath) => {
    const result = await extractProfileMetrics(filePath, {
      urls: urlsArray,
      functions: functionsArray,
    });

    return {
      filePath,
      result,
    };
  });

  const results = await Promise.allSettled(extractionPromises);
  log("--- Results ---");
  if (format === "csv") {
    const csvLines = [];
    results.forEach(({ value: { result, filePath } }, i) => {
      if (i === 0) {
        const resultCols = Object.keys(result)
          .map((key) =>
            Object.keys(result[key]).map((subKey) => `${key}:${subKey}`)
          )
          .flat();
        csvLines.push(["fileName", ...resultCols]);
      }
      const resultCols = [];
      const keys = Object.keys(result);
      keys.forEach((key) => {
        Object.keys(result[key]).forEach((subKey) => {
          resultCols.push(result[key][subKey]);
        });
      });
      csvLines.push([filePath, ...resultCols]);
    });

    console.log(csvLines.map((l) => l.join(",")).join("\n"));
  } else {
    console.log(
      JSON.stringify(
        results.map((r) => r.value),
        null,
        2
      )
    );
  }
}

main().then(() => {
  process.exit();
});
