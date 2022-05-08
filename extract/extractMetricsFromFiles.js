import { Worker as JestWorker } from "jest-worker";
import { createRequire } from "module";
import { error, debug } from "../util/log.js";
import { startProgressBar } from "../util/progress.js";

const require = createRequire(import.meta.url);

export async function extractMetricsFromFiles(files, { config }) {
  const worker = new JestWorker(require.resolve("./worker.cjs"), {
    exposedMethods: ["doExtractionWork"],
  });

  worker.getStderr().pipe(process.stderr);

  const { reportProgress, stopProgress } = startProgressBar(files.length);

  const results = await Promise.allSettled(
    files.map(async (filename) => {
      const result = await worker.doExtractionWork(filename, { config });
      reportProgress();

      return {
        filename,
        result,
      };
    })
  );
  stopProgress();

  debug("extractMetricsFromFiles", "results", results);

  const errors = results
    .map((result, index) => ({
      result,
      index,
    }))
    .filter(({ result: { status } }) => status === "rejected");

  debug("extractMetricsFromFiles", "errors", errors);
  errors.forEach(({ index, result: { reason } }) => {
    error(
      `Extraction worker error: could not extract metrics.
File: ${files[index]}:
Reason: ${reason.stack ? reason.stack : reason}`
    );
  });

  const completed = results
    .filter(
      ({ status, value }) => status === "fulfilled" && value && !value.error
    )
    .map(({ value }) => value);
  return completed;
}
