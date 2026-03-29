const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");
const SKILL_MANIFEST_PATH = path.join(REPO_ROOT, "skill.json");
const ASSISTANT_ALIASES = {
  "github-copilot": "githubcopilot",
};
const ASSISTANT_LABELS = {
  codex: "Codex",
  claude: "Claude Code",
  githubcopilot: "GitHub Copilot",
};

function readManifest() {
  return JSON.parse(fs.readFileSync(SKILL_MANIFEST_PATH, "utf8"));
}

function listSkillDirectories() {
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) =>
      fs.existsSync(path.join(SKILLS_DIR, entry.name, "SKILL.md"))
    )
    .map((entry) => entry.name)
    .sort();
}

function listSupportedAssistants() {
  return readManifest().assistants;
}

function normalizeAssistantTarget(target) {
  return ASSISTANT_ALIASES[target] || target;
}

function getAssistantLabel(target) {
  return ASSISTANT_LABELS[target] || target;
}

function formatAssistantTargetsForHelp(supportedAssistants) {
  return supportedAssistants.join(", ");
}

function makeCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }

    table[index] = value >>> 0;
  }

  return table;
}

const CRC_TABLE = makeCrcTable();

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function toZipDateParts(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);

  return {
    date:
      ((year - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate(),
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
  };
}

function createStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name.replace(/\\/g, "/"), "utf8");
    const dataBuffer = Buffer.isBuffer(entry.data)
      ? entry.data
      : Buffer.from(entry.data, "utf8");
    const stats = toZipDateParts(entry.date);
    const checksum = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(stats.time, 10);
    localHeader.writeUInt16LE(stats.date, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(stats.time, 12);
    centralHeader.writeUInt16LE(stats.date, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localDirectory = Buffer.concat(localParts);
  const endRecord = Buffer.alloc(22);

  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectory.length, 12);
  endRecord.writeUInt32LE(localDirectory.length, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([localDirectory, centralDirectory, endRecord]);
}

function parseAiTargets(aiValue, supportedAssistants) {
  if (!aiValue || aiValue === "all") {
    return supportedAssistants;
  }

  const targets = aiValue
    .split(",")
    .map((value) => normalizeAssistantTarget(value.trim().toLowerCase()))
    .filter(Boolean);

  const invalidTargets = targets.filter(
    (target) => !supportedAssistants.includes(target)
  );

  if (invalidTargets.length > 0) {
    throw new Error(
      `Unsupported assistant(s): ${invalidTargets.join(
        ", "
      )}. Supported assistants: ${supportedAssistants.join(", ")}`
    );
  }

  return [...new Set(targets)];
}

function ensureDirectory(targetDirectory) {
  fs.mkdirSync(targetDirectory, { recursive: true });
}

function copyDirectory(sourceDirectory, targetDirectory, force, excludedNames = []) {
  ensureDirectory(targetDirectory);

  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || excludedNames.includes(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDirectory, entry.name);
    const targetPath = path.join(targetDirectory, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, force, excludedNames);
      continue;
    }

    if (!force && fs.existsSync(targetPath)) {
      throw new Error(
        `Refusing to overwrite existing file without --force: ${targetPath}`
      );
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function writeFile(targetPath, content, force) {
  ensureDirectory(path.dirname(targetPath));

  if (!force && fs.existsSync(targetPath)) {
    throw new Error(
      `Refusing to overwrite existing file without --force: ${targetPath}`
    );
  }

  fs.writeFileSync(targetPath, content, "utf8");
}

function pathExists(targetPath) {
  return fs.existsSync(targetPath);
}

function stripFrontMatter(markdownContent) {
  if (!markdownContent.startsWith("---")) {
    return markdownContent.trim();
  }

  const match = markdownContent.match(/^---\n[\s\S]*?\n---\n?/);
  if (!match) {
    return markdownContent.trim();
  }

  return markdownContent.slice(match[0].length).trim();
}

function readSkill(skillName) {
  const skillDirectory = path.join(SKILLS_DIR, skillName);
  const skillPath = path.join(skillDirectory, "SKILL.md");
  const skillContent = fs.readFileSync(skillPath, "utf8");

  const descriptionMatch = skillContent.match(/description:\s*(.+)/);

  return {
    name: skillName,
    directory: skillDirectory,
    description: descriptionMatch ? descriptionMatch[1].trim() : skillName,
    content: skillContent,
    body: stripFrontMatter(skillContent),
  };
}

function readRelativeFile(skillName, relativePath) {
  return fs.readFileSync(path.join(SKILLS_DIR, skillName, relativePath), "utf8").trim();
}

function resolveAssistantOverridePath(skillName, assistant, fileName) {
  return path.join(SKILLS_DIR, skillName, "overrides", assistant, fileName);
}

function readAssistantOverride(skillName, assistant, fileName) {
  const overridePath = resolveAssistantOverridePath(skillName, assistant, fileName);

  if (!pathExists(overridePath)) {
    return null;
  }

  return fs.readFileSync(overridePath, "utf8");
}

function buildCopilotPromptBody(skill) {
  if (skill.name !== "clean-code-enforcer") {
    return skill.body;
  }

  const rulesContent = readRelativeFile(skill.name, "references/rules.md");
  const normalizedBody = skill.body.replace(
    "Load [references/rules.md](references/rules.md) before producing output. That file is the source of truth for enforcement criteria and failure conditions.",
    "Use the inlined `references/rules.md` content below as the source of truth for enforcement criteria and failure conditions."
  );

  return `${normalizedBody}

## Inlined Reference

The following content is inlined for GitHub Copilot because prompt files do not load repository-relative markdown dependencies automatically.

### references/rules.md

\`\`\`md
${rulesContent}
\`\`\`
`;
}

function resolveCodexTarget(globalInstall, cwd) {
  return globalInstall
    ? path.join(os.homedir(), ".codex", "skills")
    : path.join(cwd, ".codex", "skills");
}

function resolveClaudeTarget(globalInstall, cwd) {
  return globalInstall
    ? path.join(os.homedir(), ".claude", "skills")
    : path.join(cwd, ".claude", "skills");
}

function resolveCopilotTarget(globalInstall, cwd) {
  if (globalInstall) {
    throw new Error(
      "GitHub Copilot installation is project-scoped in this CLI. Remove --global or install Codex and Claude separately."
    );
  }

  return path.join(cwd, ".github");
}

function buildCopilotPrompt(skill) {
  const explicitPrompt = readAssistantOverride(
    skill.name,
    "githubcopilot",
    "prompt.md"
  );

  if (explicitPrompt) {
    return explicitPrompt;
  }

  return `---
agent: 'agent'
description: '${skill.description.replace(/'/g, "''")}'
---

${buildCopilotPromptBody(skill)}
`;
}

function buildCopilotInstructions(skillNames) {
  const instructionOverrides = skillNames
    .map((skillName) =>
      readAssistantOverride(skillName, "githubcopilot", "instructions.md")
    )
    .filter(Boolean)
    .join("\n\n");

  const slashCommands = skillNames
    .map((skillName) => `- \`/${skillName}\``)
    .join("\n");

  return `# Code Review Pro Instructions

Use the installed prompts for task-specific behavior:

${slashCommands}

Default operating rules:

- Separate evaluation from transformation.
- Prefer high-signal review over broad, noisy checklists.
- When the user asks for critique, use the reviewer behavior.
- When the user asks for refactoring or rewriting, use the clean-code behavior.

${instructionOverrides ? `Skill-specific notes:\n\n${instructionOverrides}\n` : ""}`;
}

function installNativeSkillDirectory(skillName, assistant, targetRoot, force) {
  const overrideDirectory = resolveAssistantOverridePath(skillName, assistant, "skill");
  const targetDirectory = path.join(targetRoot, skillName);

  if (pathExists(overrideDirectory)) {
    copyDirectory(overrideDirectory, targetDirectory, force);
    return;
  }

  copyDirectory(path.join(SKILLS_DIR, skillName), targetDirectory, force, ["overrides"]);
}

function listClaudeDesktopFiles(skillDirectory) {
  const results = [];

  function walk(currentDirectory) {
    for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
      if (entry.name === ".DS_Store" || entry.name === "agents" || entry.name === "overrides") {
        continue;
      }

      const currentPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        walk(currentPath);
        continue;
      }

      results.push(currentPath);
    }
  }

  walk(skillDirectory);
  return results.sort();
}

function toClaudeDesktopArchiveEntries(skillName) {
  const skillDirectory = path.join(SKILLS_DIR, skillName);

  return listClaudeDesktopFiles(skillDirectory).map((filePath) => {
    const relativePath = path.relative(skillDirectory, filePath);
    const archiveRelativePath =
      relativePath === "SKILL.md"
        ? "Skill.md"
        : relativePath;

    return {
      name: `${skillName}/${archiveRelativePath.replace(/\\/g, "/")}`,
      data: fs.readFileSync(filePath),
      date: fs.statSync(filePath).mtime,
    };
  });
}

function exportClaudeDesktopSkills({ outputDir, force }) {
  const skillNames = listSkillDirectories();
  ensureDirectory(outputDir);
  const archives = [];

  for (const skillName of skillNames) {
    const zipPath = path.join(outputDir, `${skillName}.zip`);

    if (!force && pathExists(zipPath)) {
      throw new Error(
        `Refusing to overwrite existing file without --force: ${zipPath}`
      );
    }

    const archiveBuffer = createStoredZip(toClaudeDesktopArchiveEntries(skillName));
    fs.writeFileSync(zipPath, archiveBuffer);
    archives.push(zipPath);
  }

  return archives;
}

function installForCodex(skillNames, cwd, globalInstall, force) {
  const targetRoot = resolveCodexTarget(globalInstall, cwd);
  ensureDirectory(targetRoot);

  for (const skillName of skillNames) {
    installNativeSkillDirectory(skillName, "codex", targetRoot, force);
  }

  return targetRoot;
}

function installForClaude(skillNames, cwd, globalInstall, force) {
  const targetRoot = resolveClaudeTarget(globalInstall, cwd);
  ensureDirectory(targetRoot);

  for (const skillName of skillNames) {
    installNativeSkillDirectory(skillName, "claude", targetRoot, force);
  }

  return targetRoot;
}

function installForGitHubCopilot(skillNames, cwd, globalInstall, force) {
  const targetRoot = resolveCopilotTarget(globalInstall, cwd);
  const promptsDirectory = path.join(targetRoot, "prompts");

  ensureDirectory(promptsDirectory);

  for (const skillName of skillNames) {
    const skill = readSkill(skillName);
    writeFile(
      path.join(promptsDirectory, `${skillName}.prompt.md`),
      buildCopilotPrompt(skill),
      force
    );
  }

  writeFile(
    path.join(targetRoot, "copilot-instructions.md"),
    buildCopilotInstructions(skillNames),
    force
  );

  return targetRoot;
}

async function installSkills({
  ai,
  cwd,
  globalInstall,
  force,
  supportedAssistants,
}) {
  const targets = parseAiTargets(ai, supportedAssistants);
  const skillNames = listSkillDirectories();
  const results = [];

  for (const target of targets) {
    if (target === "codex") {
      results.push({
        assistant: target,
        path: installForCodex(skillNames, cwd, globalInstall, force),
      });
      continue;
    }

    if (target === "claude") {
      results.push({
        assistant: target,
        path: installForClaude(skillNames, cwd, globalInstall, force),
      });
      continue;
    }

    if (target === "githubcopilot") {
      results.push({
        assistant: target,
        path: installForGitHubCopilot(skillNames, cwd, globalInstall, force),
      });
      continue;
    }
  }

  for (const result of results) {
    console.log(
      `Installed ${readManifest().name} for ${getAssistantLabel(result.assistant)}: ${result.path}`
    );
  }
}

function printHelp() {
  const assistants = formatAssistantTargetsForHelp(listSupportedAssistants());

  console.log(`codepro <command> [options]

Commands:
  init                      Install skills for supported AI assistants
  export claude-desktop     Build ZIP archives for Claude desktop custom skill upload

Options:
  -a, --ai <targets>    Assistant target(s): ${assistants}, or all
  -d, --dir <path>      Project directory for project-scoped installs
  -f, --force           Overwrite existing generated files
  -g, --global          Install to home-directory targets when supported
  -h, --help            Show this help message

Examples:
  codepro init --ai codex --global
  codepro init --ai claude,githubcopilot
  codepro init --ai all --dir /tmp/demo
  codepro export claude-desktop --dir ./dist/claude-desktop
`);
}

module.exports = {
  exportClaudeDesktopSkills,
  installSkills,
  listSupportedAssistants,
  printHelp,
};
