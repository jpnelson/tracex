const extractProfileMetricsModule = import("./extractProfileMetrics.js");

exports.doExtractionWork = async function doExtractionWork(
  filename,
  { config }
) {
  const { extractProfileMetrics } = await extractProfileMetricsModule;
  return extractProfileMetrics(filename, {
    config,
  });
};
