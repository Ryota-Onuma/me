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

**Reference skill**: Read `.claude/skills/code-review/SKILL.md` and follow its procedure.

#### Load Checklists
- Always load: `checklists/general.md`, `checklists/responsibility.md`
- Load language/file-specific checklists as needed (see SKILL.md for details)

#### Execute Review (One Item at a Time)
**Important**: Evaluate checklist items **one by one, sequentially**. Do not evaluate multiple items simultaneously.

For each item:
1. Focus exclusively on that item while reviewing the target code
2. Determine status: ✅ OK / ⚠️ NG / 🔶 CONDITIONAL
3. Record reasoning, location, and suggested fix
4. Move to the next item only after completion

**Record all items**: Do not skip OK items—ensure full visibility of all evaluations.

---

### Step 3: Architecture Review

**Reference skill**: Read `.claude/skills/architecture-review/SKILL.md` and follow its procedure.

1. **Structural Analysis**: Map directory structure, identify architecture patterns
2. **Dependency Analysis**: Check import patterns, detect circular dependencies and layer violations
3. **Checklist Evaluation**: Use `checklists/structure.md`, `checklists/dependencies.md`

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
- `.claude/skills/code-review/`
- `.claude/skills/architecture-review/`
- `.claude/skills/fact-checking/`
