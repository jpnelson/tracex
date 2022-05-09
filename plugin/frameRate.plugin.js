export default {
  name: "frameRate",
  plugin: function frameRatePlugin(config, log) {
    const frameData = {
      frame_dropped: 0,
      frame_partial: 0,
      frame_presented: 0,
    };
    return {
      preExtract: (event) => {},
      extract: (event) => {
        if (!config.framerate) {
          return;
        }
        // See https://perfetto.dev/docs/reference/trace-packet-proto#ChromeFrameReporter for more information on this trace event
        if (
          event.name !== "PipelineReporter" ||
          !event.args.chrome_frame_reporter
        ) {
          return;
        }

        /**
         * See https://perfetto.dev/docs/reference/trace-packet-proto#ChromeFrameReporter.State for information on this enum
         */
        const { state, affects_smoothness } = event.args.chrome_frame_reporter;

        if (state === "STATE_DROPPED" && affects_smoothness) {
          frameData.frame_dropped++;
        } else if (state === "STATE_PRESENTED_PARTIAL" && affects_smoothness) {
          frameData.frame_partial++;
        } else if (state === "STATE_PRESENTED_ALL") {
          frameData.frame_presented++;
        }
      },
      report: () => {
        if (!config.framerate) {
          return;
        }
        return {
          frameData: {
            ...frameData,
            // We "score" partial frames as 0.5 of a frame drop. Can be tweaked to match standards if they exist openly
            percent_frames_dropped:
              (frameData.frame_dropped + 0.5 * frameData.frame_partial) /
              (frameData.frame_presented +
                frameData.frame_partial +
                frameData.frame_dropped),
          },
        };
      },
    };
  },
};
