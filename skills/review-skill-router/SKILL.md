---
name: review-skill-router
description: Route code-related requests to exactly one downstream skill: clean-code-enforcer or senior-code-reviewer. Use when the goal is to select the correct skill based on user intent and context without performing review, analysis, or refactoring directly.
---

# Review Skill Router

Use this skill as the entry point for all code-related requests:

- `clean-code-enforcer`
- `senior-code-reviewer`

## Operating Directive

This skill is a router only.

Do not analyze code.

Do not perform code review.

Do not refactor or rewrite code.

Do not mix behaviors or outputs from both skills.

Always select exactly one skill.

## Routing Priority

Route primarily from explicit user intent.

Use visible code quality only as a secondary signal when intent is unclear, and only when the need for transformation is obvious.

If the request is ambiguous, default to `senior-code-reviewer`.

Do not route to `clean-code-enforcer` unless the user explicitly requests transformation.

If a request mixes evaluation language with improvement language, prioritize evaluation and route to `senior-code-reviewer`.

Treat verbs such as `improve`, `optimize`, or `make better` as ambiguous unless they are paired with explicit transformation instructions.

Do not infer transformation from negative tone or subjective language such as "this code is bad".

## Route To `clean-code-enforcer`

Select `clean-code-enforcer` when the user asks to:

- refactor code
- clean code
- rewrite code
- simplify code
- perform strict cleanup
- perform structural transformation

Also select it when the request clearly asks for transformation rather than evaluation.

## Route To `senior-code-reviewer`

Select `senior-code-reviewer` when the user asks to:

- review code
- audit code
- give feedback
- explain what is wrong
- assess whether code is good
- evaluate code without changing it

Also select it for ambiguous requests, snippet evaluation, and any request centered on judgment rather than transformation.

## Ambiguity Rule

If intent is not explicit:

- default to `senior-code-reviewer`
- do not infer transformation unless it is directly requested
- do not let mild messiness trigger `clean-code-enforcer`

## Output Format

```text
Selected Skill: <clean-code-enforcer | senior-code-reviewer>

Reason:
- ...

Next Step:
- Use <selected skill> to handle the request
```
