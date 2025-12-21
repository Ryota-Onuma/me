---
description: Execute code review and architecture review, then display results after fact-checking
---

# Comprehensive Code Review Workflow

## Procedure

### Step 1: Identify Review Target

Identify the review target using one of the following:
- PR URL / commit hash / directory / file passed via `$ARGUMENTS`
- Check uncommitted changes via `git status` / `git diff`

**If target is ambiguous or unspecified**: Ask the user for clarification and stop.

---

### Step 2: Code Review

**Reference skill**: Read `.claude/skills/code-checklist-provider/SKILL.md` to get relevant checklists.

#### Get Checklists
Call the skill with:
1. Target file path(s)
2. Tech stack: Language, Framework, Patterns (DDD/CQRS if applicable), Test file or not

The skill will:
- **Automatically include**: `checklists/general.md`, `checklists/responsibility.md` (mandatory)
- **Add based on tech stack**: TypeScript, React, Kotlin, SQL, Test, DDD, CQRS checklists

#### Execute Review (One Item at a Time)

> [!IMPORTANT]
> Evaluate checklist items **one by one, sequentially**. No parallel evaluation.

For each checklist item:
1. Focus exclusively on that item
2. Determine status: ✅ OK / ⚠️ NG / 🔶 CONDITIONAL
3. Record: status, rationale, location (file:line), suggested fix (if NG)
4. Move to the next item only after completion

**Record ALL items**: Do not skip OK items—ensure full visibility of all evaluations.

---

### Step 3: Architecture Review

**Reference skill**: Read `.claude/skills/architecture-checklist-provider/SKILL.md` to get relevant checklists.

#### Get Checklists
Call the skill with:
1. Target directory/module path(s)
2. Architecture context: Layer structure, Architecture pattern

The skill will:
- **Automatically include**: `checklists/structure.md`, `checklists/dependencies.md` (mandatory)
- **Add if present**: Local architecture rules (`*.local.md`)

#### Execute Review (One Item at a Time)

> [!IMPORTANT]
> Evaluate checklist items **one by one, sequentially**. No parallel evaluation.

For each checklist item:
1. Focus exclusively on that item
2. Determine status: ✅ OK / ⚠️ NG / 🔶 CONDITIONAL
3. Record: status, rationale, location, suggested fix (if NG)
4. Move to the next item only after completion

---

### Step 4: Fact Check

**Reference skill**: Read `.claude/skills/fact-checking/SKILL.md` and follow its procedure.

Verify findings from Step 2 and Step 3:

1. **Reference Accuracy**: Verify file/class/function existence, confirm code snippets and line numbers
2. **Evidence Validation**: Verify dependency claims, confirm impact scope validity
3. **Assign Verification Status**: ✅ VERIFIED / ⚠️ INVALID / 🔶 REQUIRES_CONFIRMATION

---

### Step 5: Display Results

```markdown
# Review Results

## Summary
- Review Target: [target]
- Issues Found: [count]

## Action Items
[List in priority order]

### 1. [Issue Summary]
- **Location**: [file path:line number]
- **Details**: [issue and suggested fix]
- **Fix Prompt**:
  ```
  [Executable fix instruction]
  ```

## Details

### Code Review
[Verified code review results]

### Architecture Review
[Verified architecture review results]

### Fact Check Summary
[Verification summary - include details for INVALID/REQUIRES_CONFIRMATION items]
```

---

## Skills Used
- `.claude/skills/code-checklist-provider/`
- `.claude/skills/architecture-checklist-provider/`
- `.claude/skills/fact-checking/`
