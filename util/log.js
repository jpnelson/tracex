import chalk from "chalk";

let silent = false;

export function setSilent(state) {
  silent = state;
}

export function log(...message) {
  if (silent) {
    return;
  }
  console.log(chalk.green("[⛏ tracedrill]"), ...message);
}
