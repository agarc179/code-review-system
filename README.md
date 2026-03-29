# Multi-Agent Code Review System for Codex

A modular code review system that separates:

- **Enforcement** → deterministic clean code transformations  
- **Review** → high-signal, risk-based feedback  
- **Routing** → automatic selection of the correct tool  

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

### 3. review-skill-router
Routes requests to the correct skill based on intent.

- prevents mixed behavior  
- ensures predictable results  

---

## 🚀 Installation

```bash
git clone <your-repo-url>
cd code-review-system
./install.sh
```

Restart Codex after installation.

---

## 🧪 Usage

### Recommended (use router)

```
Use the review-skill-router.

[describe what you want + paste code]
```

---

### Example — Review

```
Use the review-skill-router.

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
Use the review-skill-router.

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
review-skill-router
     ↓
 ┌───────────────┬─────────────────────┐
 │               │                     │
clean-code-enforcer   senior-code-reviewer
(transform)           (evaluate)
```

---

## ⚠️ Important Notes

- Router is recommended for consistent behavior  
- Skills can be used directly if needed  
- Designed for JavaScript, TypeScript, and Python  
- Default behavior prioritizes evaluation over transformation  

---

## 📄 License

MIT License
