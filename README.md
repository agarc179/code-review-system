# Code Review Pro

A modular code review toolkit that separates:

- **Enforcement** → deterministic clean code transformations  
- **Review** → high-signal, risk-based feedback  

---

## 🧠 Why This Exists

Most AI code review tools are:

- noisy  
- inconsistent  
- overly mechanical  

This system separates responsibilities to produce:

- high-signal feedback  
- predictable transformations  
- consistent behavior  

---

## ⚙️ Skills

### 1. clean-code-enforcer
Deterministic refactoring engine for clean code enforcement.

- rule-driven  
- consistent output  
- safe for automation  

---

### 2. senior-code-reviewer
Senior-level reviewer focused on:

- architecture  
- risk  
- prioritization  

Surfaces only what actually matters.

---

## Supported Assistants

- Codex
- Claude Code
- Claude Desktop
- GitHub Copilot

## Installation

Choose the path that matches what you are actually trying to do.

### Option 1: Use The Published Package

If you just want to use the CLI and the package is already published to npm, install it globally:

```bash
npm install -g code-review-pro-skill
```

Then install the skills for the assistant you use:

```bash
codepro init --ai codex --global
codepro init --ai claude --global      # Claude Code
codepro init --ai githubcopilot
```

Use `--global` for Codex and Claude Code when you want the skills available across projects.

In this CLI, `claude` means Claude Code.

GitHub Copilot is project-scoped in this CLI, so install it from inside the repository where you want the prompts and instructions generated.

Claude Desktop does not load these file-based installs directly. For Claude Desktop, export uploadable ZIPs instead:

```bash
codepro export claude-desktop --dir ./dist/claude-desktop
npm run export:claude-desktop
```

Then upload the generated ZIP files in Claude Desktop under `Customize > Skills`.

Examples:

```bash
codepro init --ai codex,claude --global
codepro init --ai githubcopilot
codepro init --ai all
```

Use `codepro init --ai all` for project-scoped installation across every supported assistant.

Use `codepro init --ai codex,claude --global` when you want global installs for Codex and Claude Code.

If you publish under a different npm package name, replace `code-review-pro-skill` with that package name.

### Option 2: Develop Or Test This Repository Locally

If you cloned this repository and want to work on it locally:

```bash
git clone https://github.com/agarc179/code-review-system
cd code-review-system
npm install
npm link
```

This installs the repo dependencies and links the local `codepro` CLI so you can test changes from your machine.

Then install for the assistant you want to test:

```bash
codepro init --ai codex --global
codepro init --ai claude --global      # Claude Code
codepro init --ai githubcopilot
```

To build Claude Desktop upload bundles from the local repo:

```bash
codepro export claude-desktop --dir ./dist/claude-desktop
npm run export:claude-desktop
```

Or install all file-based assistant targets:

```bash
codepro init --ai all
```

### Quick Install Shortcut

This repository also includes a shortcut script for the original Codex global install flow:

```bash
./install.sh
```

## Install Targets

- Codex: `~/.codex/skills` with `--global`, or `.codex/skills` in the target project
- Claude Code: `~/.claude/skills` with `--global`, or `.claude/skills` in the target project
- Claude Desktop: ZIP upload through `Customize > Skills`
- GitHub Copilot: `.github/prompts/*.prompt.md` and `.github/copilot-instructions.md` in the target project

Each assistant is installed through its native route. This project does not force one fake universal format across Codex, Claude Code, Claude Desktop, and GitHub Copilot.

GitHub Copilot is intentionally project-scoped in this CLI. Pretending there is one clean global file-based install path would be sloppy.

## Authoring Model

Skills default to one canonical source:

- `skills/<skill-name>/SKILL.md`

Optional assistant-native overrides are supported when a target needs its own artifact:

- `skills/<skill-name>/overrides/codex/skill/...`
- `skills/<skill-name>/overrides/claude/skill/...`
- `skills/<skill-name>/overrides/githubcopilot/prompt.md`
- `skills/<skill-name>/overrides/githubcopilot/instructions.md`

Installer behavior:

- Codex: installs the override skill directory if present, otherwise installs the canonical skill folder
- Claude Code: installs the override skill directory if present, otherwise installs the canonical skill folder
- GitHub Copilot: uses `prompt.md` if present, otherwise generates a native prompt file from the canonical skill content

Use overrides only when an assistant needs materially different instructions or a different native file format.

---

## 🧪 Usage

### Choose the skill directly

```
Use the senior-code-reviewer.

[describe what you want + paste code]
```

---

### Example — Review

```
Use the senior-code-reviewer.

review this code

function getUserScore(user) {
  if (!user) return null;

  return user.actions.reduce((total, action) => {
    return total + action.value;
  }, 0);
}
```

---

### Example — Refactor

```
Use the clean-code-enforcer.

refactor this function

function getUserScore(user) {
  if (!user) return null;

  return user.actions.reduce((total, action) => {
    return total + action.value;
  }, 0);
}
```

---

### Direct Usage (optional)

You can call skills directly:

```
Use the senior-code-reviewer.
Use the clean-code-enforcer.
```

---

## 🧱 Architecture

```
User Request
     ↓
 ┌─────────────────────┬─────────────────────┐
 │                     │                     │
clean-code-enforcer    senior-code-reviewer
(transform)            (evaluate)
```

---

## ⚠️ Important Notes

- Skills are used directly based on intent  
- Designed for JavaScript, TypeScript, and Python  
- Default behavior prioritizes evaluation over transformation  

---

## 📄 License

MIT License
