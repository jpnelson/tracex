import TraceProcessor from "lighthouse/lighthouse-core/lib/tracehouse/trace-processor.js";
import MainThreadTasks from "lighthouse/lighthouse-core/lib/tracehouse/main-thread-tasks.js";

// These trace events, when not triggered by a script inside a particular task, are just general Chrome overhead.
const BROWSER_TASK_NAMES_SET = new Set(["CpuProfiler::StartProfiling"]);

// These trace events, when not triggered by a script inside a particular task, are GC Chrome overhead.
const BROWSER_GC_TASK_NAMES_SET = new Set([
  "V8.GCCompactor",
  "MajorGC",
  "MinorGC",
]);

function isRelevantUrl(url, urlSearchStrings) {
  return urlSearchStrings.some((u) => url.includes(u));
}

function getAttributableURLForTask(task) {
  // This is to ensure we're skipping attributeUrl's like https://example.com
  // and only considering js. Lighthouse does this with the network trace,
  // but without that we just look at the URL's and guess
  // TODO: improve the way in which we match javascript
  const jsURL = task.attributableURLs.find((attributableUrl) =>
    attributableUrl.includes(".js")
  );
  const fallbackURL = task.attributableURLs[0];
  let attributableURL = jsURL || fallbackURL;
  if (attributableURL !== fallbackURL) {
  }
  // If we can't find what URL was responsible for this execution, attribute it to the root page
  // or Chrome depending on the type of work.
  if (!attributableURL || attributableURL === "about:blank") {
    if (BROWSER_TASK_NAMES_SET.has(task.event.name))
      attributableURL = "Browser";
    else if (BROWSER_GC_TASK_NAMES_SET.has(task.event.name))
      attributableURL = "Browser GC";
    else attributableURL = "Unattributable";
  }

  return attributableURL;
}

export default {
  name: "cpu",
  plugin: function functionPlugin(config, log) {
    const events = [];
    const results = {};
    const { functions: functionsString, urls: urlsString } = config;
    const functions = functionsString.split(",").filter(Boolean); // TODO: rework with tracehouse
    const urlSearchStrings = urlsString.split(",").filter(Boolean);

    return {
      preExtract: (event) => {
        events.push(event);
      },
      extract: (event) => {},
      report: () => {
        const { mainThreadEvents, frames, timestamps } =
          TraceProcessor.processTrace({ traceEvents: events });
        const mainThreadTasks = MainThreadTasks.getMainThreadTasks(
          mainThreadEvents,
          frames,
          timestamps.traceEnd
        );

        const urlTimes = new Map();

        for (const task of mainThreadTasks) {
          const attributableURL = getAttributableURLForTask(
            task,
            urlSearchStrings
          );
          const timingByGroupId = urlTimes.get(attributableURL) || {};
          const originalTime = timingByGroupId[task.group.id] || 0;
          timingByGroupId[task.group.id] = originalTime + task.selfTime;
          urlTimes.set(attributableURL, timingByGroupId);
        }

        [...urlTimes.keys()].forEach((url) => {
          urlSearchStrings.forEach((urlSearchString) => {
            if (isRelevantUrl(url, [urlSearchString])) {
              results[`urls.${urlSearchString}`] = {
                ...urlTimes.get(url),
              };
            }
          });
        });

        return results;
      },
    };
  },
};
