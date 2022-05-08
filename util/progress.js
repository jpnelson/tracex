import * as cliProgress from "cli-progress";

export function startProgressBar(total) {
  const bar = new cliProgress.SingleBar(
    {
      format: `[{bar}] {percentage}% | Duration: {duration}s`,
      clearOnComplete: true,
    },
    cliProgress.Presets.shades_classic
  );

  bar.start(total, 0);

  const reportProgress = (increment = 1) => {
    bar.increment(increment);
  };

  const stopProgress = () => {
    bar.stop();
  };

  return { reportProgress, stopProgress };
}
