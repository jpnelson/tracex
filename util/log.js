import chalk from "chalk";
import nodeDebug from "debug";

let silent = false;

export function setSilent(state) {
  silent = state;
}

export function log(...message) {
  if (silent) {
    return;
  }
  // We log with console.error and reserve stdout for actual result output
  console.error(chalk.green("[traceX]"), ...message);
}

export function error(...message) {
  if (silent) {
    return;
  }
  console.error(chalk.red("[traceX]"), ...message);
}

export function debug(category, ...message) {
  nodeDebug(`tracex:${category}`)(...message);
}
