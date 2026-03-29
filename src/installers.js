const fs = require("fs");
const os = require("os");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");
const SKILL_MANIFEST_PATH = path.join(REPO_ROOT, "skill.json");

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

function parseAiTargets(aiValue, supportedAssistants) {
  if (!aiValue || aiValue === "all") {
    return supportedAssistants;
  }

  const targets = aiValue
    .split(",")
    .map((value) => value.trim().toLowerCase())
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
    console.log(`Installed ${readManifest().name} for ${result.assistant}: ${result.path}`);
  }
}

function printHelp() {
  const assistants = listSupportedAssistants().join(", ");

  console.log(`codepro init [options]

Install code review skills for supported AI assistants.

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
`);
}

module.exports = {
  installSkills,
  listSupportedAssistants,
  printHelp,
};
