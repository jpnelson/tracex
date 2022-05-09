export default {
  name: "example",
  plugin: function examplePlugin(config, log) {
    const example = {
      events: 0,
    };
    return {
      preExtract: (event) => {},
      // See docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/edit for documentation on the trace event format.
      extract: () => {
        example.events++;
      },
      report: () => {
        return {
          example,
        };
      },
    };
  },
};
