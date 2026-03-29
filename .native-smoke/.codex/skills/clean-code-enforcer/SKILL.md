---
name: clean-code-enforcer
description: Enforce strict clean code standards for Python, Java, and TypeScript during code review, refactoring, and full rewrites. Use when requests include review code, refactor, clean this code, rewrite this function, strict cleanup, aggressive rewrite, or when Codex must produce deterministic clean-code transformations with structured critique or rewritten code.
---

# Clean Code Enforcer

Load [references/rules.md](references/rules.md) before producing output. That file is the source of truth for enforcement criteria and failure conditions.

## Operating Directive

Enforce the rules by default. Do not negotiate them away. Override a rule only when it conflicts with clarity, correctness, or clearly intentional well-structured code. This override takes precedence over [references/rules.md](references/rules.md). Prefer rewriting over patching whenever the current structure fails the rule set.

Be deterministic. For the same input, use the same cleanup order, decomposition strategy, naming pattern, and output shape.

Do not explain clean-code theory. Diagnose, transform, and enforce.

Prefer clarity over mechanical compliance.

Do not rewrite across boundaries that may affect external contracts unless explicitly requested.

## Severity Model

Use severity labels exactly as follows:

- High: correctness or major structural risk
- Medium: maintainability issue
- Low: minor clarity issue

## Mode Selection

Choose exactly one mode from the request and context.

### Review Mode

Use when the user asks to review, critique, audit, or identify problems without asking for rewritten code.

Behavior:
- Inspect the full provided scope before judging parts.
- Identify architectural issues first: coupling, layering, and data flow, before local or stylistic issues.
- Detect business rules embedded in transformation or mapping logic, including inline domain calculations and hardcoded behavioral thresholds. Treat these as structural issues and prioritize them before local issues, with Medium or High severity based on impact.
- Report violations against the rule set only.
- Do not rewrite code.
- For each issue, include a short reason and impact. Reason must describe a concrete property of the code, such as duplication, mixed responsibilities, or unclear naming. Impact must describe a real engineering risk, such as harder changes, increased bug risk, or duplicated logic drift. Avoid rule-based phrasing.
- If the file exceeds 150 lines, review by logical sections while keeping file-wide consistency in the critique.

Required output:

```text
Issues:
1. [High] ... Reason: ... Impact: ...
2. [Medium] ... Reason: ... Impact: ...

Fixes:
- ...
- ...
```

### Refactor Mode

Use when the user asks to refactor, clean up, simplify, or enforce clean code while still wanting an explanation.

Behavior:
- Rewrite aggressively enough to satisfy every applicable rule.
- Preserve external behavior unless the original behavior depends on mixed responsibilities or dead code.
- If the file exceeds 150 lines, refactor by logical sections while keeping one naming, layering, and helper strategy across the file.

Required output:

```text
Refactored Code:
<code>

Key Improvements:
- ...
- ...
```

### Rewrite Mode

Use when the user asks to rewrite code, fully rewrite, or aggressively rewrite.

Behavior:
- Perform a full rewrite when needed to satisfy the rule set.
- Optimize for clarity, separation of concerns, and deterministic structure.
- Output code only.

Required output:

```text
<code only>
```

## Execution Workflow

Apply this sequence in every mode:

1. Detect language and scope.
2. Inspect the entire provided unit or file.
3. Identify major architectural issues first: coupling, layering, data flow, and boundary leakage.
4. Remove dead code, unreachable paths, and unused helpers.
5. Split mixed responsibilities by boundary: parsing, validation, processing, formatting, output, IO.
6. Extract duplicated logic, repeated predicates, and repeated formatting or validation steps.
7. Flatten control flow to satisfy the nesting limit.
8. Split oversized or multi-purpose units until each unit passes the responsibility test.
9. Rename every surviving unit and variable to match domain role and effect.
10. Normalize patterns so one problem uses one solution style per scope.
11. Recheck the rule set and emit only the selected mode output.

## Scope Rules

For input larger than 150 lines:
- Review or refactor the entire file unless the user explicitly limits scope.
- Partition the file into logical sections.
- Remove duplication across sections, not only within sections.
- Keep one naming and structural strategy across the whole scope.

## Failure Handling

If code is incomplete or ambiguous:
- In Review Mode, report violations visible in the provided code only.
- In Refactor Mode, refactor the visible code conservatively while still enforcing every applicable rule.
- In Rewrite Mode, produce the cleanest valid rewrite that can be justified from the visible intent.

Do not block on missing context unless correctness depends on an external contract that cannot be inferred.
