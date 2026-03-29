const {
  installSkills,
  listSupportedAssistants,
  printHelp,
} = require("./installers");

function parseArgs(argv) {
  let command;
  const rest = [];
  const options = {
    ai: "all",
    cwd: process.cwd(),
    global: false,
    force: false,
    help: false,
  };

  for (const arg of argv) {
    if (!command && !arg.startsWith("-")) {
      command = arg;
      continue;
    }

    rest.push(arg);
  }

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--global" || arg === "-g") {
      options.global = true;
      continue;
    }

    if (arg === "--force" || arg === "-f") {
      options.force = true;
      continue;
    }

    if (arg === "--ai" || arg === "-a") {
      const value = rest[index + 1];
      if (!value) {
        throw new Error("Missing value for --ai");
      }
      options.ai = value;
      index += 1;
      continue;
    }

    if (arg === "--dir" || arg === "-d") {
      const value = rest[index + 1];
      if (!value) {
        throw new Error("Missing value for --dir");
      }
      options.cwd = value;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    command,
    options,
  };
}

async function main() {
  try {
    const { command, options } = parseArgs(process.argv.slice(2));

    if (!command || options.help) {
      printHelp();
      return;
    }

    if (command !== "init") {
      throw new Error(
        `Unsupported command "${command}". Supported commands: init`
      );
    }

    const supportedAssistants = listSupportedAssistants();
    await installSkills({
      ai: options.ai,
      cwd: options.cwd,
      globalInstall: options.global,
      force: options.force,
      supportedAssistants,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
