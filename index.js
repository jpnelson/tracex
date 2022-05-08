import glob from "glob";

import { getConfig } from "./util/config.js";
import { log, setSilent } from "./util/log.js";
import { extractProfileMetrics } from "./extractProfileMetrics.js";
import { startProgressBar } from "./util/progress.js";

async function main() {
  const config = getConfig();
  const { file, format, silent } = config;
  if (silent) {
    setSilent(silent);
  }

  const filePaths = glob.sync(file);

  log(`Parsing traces and extracting metrics from ${filePaths.length} files`);
  const { reportProgress, stopProgress } = startProgressBar(filePaths.length);

  const extractionPromises = filePaths.map(async (filePath) => {
    const result = await extractProfileMetrics(filePath, {
      config,
      reportProgress,
    });

    return {
      filePath,
      result,
    };
  });

  const results = await Promise.allSettled(extractionPromises);
  stopProgress();

  log("======= Results =======");
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
