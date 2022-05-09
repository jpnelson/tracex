#!/usr/bin/env node

import glob from "glob";

import { getConfig } from "./util/config.js";
import { debug, log, setSilent } from "./util/log.js";
import { extractMetricsFromFiles } from "./extract/extractMetricsFromFiles.js";

async function main() {
  const config = getConfig();
  const { file, format, silent } = config;
  if (silent) {
    setSilent(silent);
  }

  const filePaths = glob.sync(file);

  log(`Parsing traces and extracting metrics from ${filePaths.length} files`);

  debug("main", "config", config);

  const results = await extractMetricsFromFiles(filePaths, {
    config,
  });

  debug("main", "results", results);

  log("======= Results =======");
  if (format === "csv") {
    const csvLines = [];
    results.forEach(({ result, filename }, i) => {
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
      csvLines.push([filename, ...resultCols]);
    });

    console.log(csvLines.map((l) => l.join(",")).join("\n"));
  } else {
    console.log(
      JSON.stringify(
        results.map((r) => r),
        null,
        2
      )
    );
  }
}

main().then(() => {
  process.exit();
});
