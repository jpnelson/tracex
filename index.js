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
  debug("main", "filePaths", filePaths);

  log(`Parsing traces and extracting metrics from ${filePaths.length} files`);

  debug("main", "config", config);

  const results = await extractMetricsFromFiles(filePaths, {
    config,
  });

  debug("main", "results", results);

  log("======= Results =======");
  if (format === "csv") {
    const csvLines = [];

    const cols = new Set();

    results.forEach(({ result }) => {
      Object.keys(result).forEach((key) => {
        Object.keys(result[key]).forEach((subKey) => {
          cols.add(`${key}:${subKey}`);
        });
      });
    });
    const orderedCols = [...cols.values()];

    csvLines.push(["filename", ...orderedCols]);

    results.forEach(({ result, filename }) => {
      const csvLine = [filename];
      orderedCols.forEach((col) => {
        const [key, subKey] = col.split(":");
        csvLine.push(result[key]?.[subKey]);
      });
      csvLines.push(csvLine);
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
