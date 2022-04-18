import yargs from "yargs";

const yargv = yargs(process.argv.slice(2));

yargv
  .command("extract <file>", "extract trace data from a file", (yargs) => {
    yargs.positional("file", {
      describe: "path to file to extract trace data from. May be a glob",
      type: "string",
    });
  })
  .option({
    urls: {
      default: "",
      type: "string",
      describe:
        "Comma separated list of URLS to search for. May be partial matches.",
    },
    functions: {
      default: "",
      type: "string",
      describe:
        "Comma separated list of functions to search for. May be partial matches",
    },
    format: {
      default: "csv",
      type: "string",
      describe: "Format to use. May be one of csv, json",
    },
    silent: {
      default: false,
      type: "boolean",
      describe:
        "Suppress info log warnings. Still outputs results in specified format",
    },
  });

const { argv } = yargv;

export function getConfig() {
  return argv;
}
