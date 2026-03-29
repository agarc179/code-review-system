# Clean Code Rules

## Enforcement Model

Apply every rule strictly. A unit fails if any applicable rule fails. Do not preserve violations for convenience, backward familiarity, or local style preference.

Prefer deletion, extraction, and decomposition over commentary. If code can only be justified by explanation, the code is not clean enough.

## Readability

Code must be understandable in one pass.

Fail when any of these are true:
- A name does not reveal domain role, business meaning, or side effect.
- A reader must inspect distant code to understand the basic purpose of a unit.
- A unit mixes multiple abstraction levels, such as policy decisions beside low-level data shuffling.
- A comment explains what the code should already make obvious.

Enforce:
- Use explicit, intention-revealing names for functions, classes, variables, predicates, and types.
- Keep each unit at one abstraction level.
- Prefer direct control flow over clever shortcuts.

Forbidden placeholder names:
- `data`
- `temp`
- `value`
- `obj`
- `item`
- `stuff`
- `thing`

## Maintainability

Code must have one authoritative implementation per behavior.

Fail when any of these are true:
- The same multi-step logic appears more than once.
- The same predicate appears more than once without extraction.
- Dead code, unreachable branches, unused helpers, or obsolete flags remain.
- A change to one behavior would require edits in multiple places.

Enforce:
- Extract duplicated behavior the second time it appears.
- Delete dead code instead of preserving it "just in case".
- Centralize shared formatting, validation, mapping, and branching logic.

## Modularity

Each unit must own one responsibility.

Responsibility test:
- A unit must be describable in one sentence with one primary verb.
- If that sentence requires `and`, the unit is too broad and must be split.

Fail when any of these are true:
- Parsing, validation, processing, formatting, output, or IO are mixed in one unit.
- One class or module coordinates unrelated workflows.
- A helper exists only to hide a mixed-responsibility block.

Enforce:
- Separate parsing, validation, processing, formatting, output, and IO into distinct units or layers.
- Keep orchestration thin and domain logic focused.
- Assign one reason to change per unit.

## Function Design

Functions and methods must be small, explicit, and side-effect-aware.

Fail when any of these are true:
- A function cannot be described plainly without mentioning multiple jobs.
- A function mutates external state, performs IO, or changes shared data without making that effect obvious from its name and role.
- A helper both decides policy and performs mechanics.
- A function relies on hidden inputs or writes to hidden outputs.

Enforce:
- Default to pure helpers; isolate side effects at clear boundaries.
- Keep parameters and return values explicit.
- Use focused helpers instead of broad coordinators.

Global length limits:
- Functions and methods: maximum 20 lines
- Nesting depth: maximum 3 levels

## Complexity

Control flow must stay linear enough to reason about locally.

Fail when any of these are true:
- Nesting exceeds 3 levels.
- A function requires multiple passes to trace normal flow.
- Boolean logic is dense enough that extracting a named predicate would improve understanding.
- A long function remains intact after responsibilities and duplication have been identified.

Enforce:
- Flatten with guard clauses and early returns.
- Extract named predicates for repeated or dense conditions.
- Break large functions before performing local polish.

## Consistency

Equivalent problems must use equivalent solutions within the same scope.

Fail when any of these are true:
- The same kind of work is implemented with multiple patterns in the same file or module.
- Naming conventions change without a domain reason.
- Similar validation, mapping, or error-handling flows use different structures.
- Helper boundaries are inconsistent for equivalent operations.

Enforce:
- Use one pattern per problem type within a scope.
- Apply one naming scheme and one decomposition strategy across the file.
- Normalize similar workflows to the same structure unless an external API forces a difference.

## Transformation Order

Fix violations in this order:
1. Delete dead code and unreachable paths.
2. Separate mixed responsibilities.
3. Extract duplication and repeated predicates.
4. Reduce nesting and control-flow complexity.
5. Split oversized or multi-purpose units.
6. Rename for clarity and consistency.
7. Recheck language-specific rules.

## Scope Enforcement

For code over 150 lines:
- Review or refactor the full file unless the user explicitly limits scope.
- Partition work by logical sections, then normalize across the whole file.
- Remove cross-section duplication.
- Do not leave one section on a different naming or structural pattern from the rest.

## Language-Specific Rules

### Python

Fail when any of these are true:
- Nesting exceeds 3 levels.
- A comprehension hides branching or multi-step transformation.
- Dense one-liners reduce clarity.

Enforce:
- Prefer explicit control flow once a comprehension stops being immediately readable.
- Keep data flow obvious from names and statement order.

### Java

Fail when any of these are true:
- A class exceeds 300 lines.
- A method exceeds 20 lines.
- Method visibility is implicit or omitted.
- Service, utility, and model responsibilities are mixed.

Enforce:
- Use small private helpers.
- Keep classes narrowly scoped.
- Keep validation and formatting outside core business methods.

### TypeScript

Fail when any of these are true:
- `any` is used.
- Parameter types are implicit.
- Return types are implicit.
- Reused object shapes remain anonymous.

Enforce:
- Use explicit function signatures.
- Prefer named interfaces or type aliases for reused shapes.
- Keep transformation logic in typed helpers.

## Determinism

For the same input, produce the same:
- violation ordering
- extraction strategy
- naming pattern
- output structure

Do not vary the result for style, novelty, or personal preference.
