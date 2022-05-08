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
  console.error(chalk.green("[📊 tracex]"), ...message);
}

export function debug(...message) {
  nodeDebug("tracex")(...message);
}
