import * as cliProgress from "cli-progress";

export function startProgressBar(total, title) {
  const bar = new cliProgress.SingleBar(
    {
      format: `[{bar}] {percentage}% | Duration: {duration}s`,
      clearOnComplete: true,
    },
    cliProgress.Presets.shades_classic
  );

  bar.start(total, 0);

  const reportProgress = (stageCompletion) => {
    bar.increment(stageCompletion);
  };

  const stopProgress = () => bar.stop();

  return { reportProgress, stopProgress };
}
