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
- Claude
- GitHub Copilot

## Installation

```bash
git clone https://github.com/agarc179/code-review-system
cd code-review-system
npm install
```

### Local Development

Link the CLI locally:

```bash
npm link
```

Then install the skills you want:

```bash
codepro init --ai codex --global
codepro init --ai claude
codepro init --ai githubcopilot
```

You can also install all supported assistants in one command:

```bash
codepro init --ai all
```

### Codex Shortcut

If you only want the old Codex global install behavior:

```bash
./install.sh
```

### Published Usage

After you publish this package to npm under your chosen package name, the install flow becomes:

```bash
npm install -g <your-package-name>
codepro init --ai codex --global
```

## Install Targets

- Codex: `~/.codex/skills` with `--global`, or `.codex/skills` in the target project
- Claude: `~/.claude/skills` with `--global`, or `.claude/skills` in the target project
- GitHub Copilot: `.github/prompts/*.prompt.md` and `.github/copilot-instructions.md` in the target project

Each assistant is installed through its native route. This project does not force one fake universal format across Codex, Claude, and GitHub Copilot.

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
- Claude: installs the override skill directory if present, otherwise installs the canonical skill folder
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
