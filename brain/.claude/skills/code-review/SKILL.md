---
name: code-review
description: Performs comprehensive code review by dynamically loading language-specific checklists. Use when reviewing code files to ensure quality and adherence to best practices.
---

# Code Review Skill

## Purpose
This skill performs systematic code reviews by checking files against comprehensive, language-specific checklists. It uses a modular architecture to load only the relevant checklists for the file being reviewed.

## Core Principles

### 1. Single Item Focus
- **Evaluate only one checklist item at a time, with maximum focus power.**
- Establish clear boundaries when moving between items
- Fully evaluate each item before moving to the next

### 2. Complete Tracking
To ensure developers can **grasp the status of all items at a glance**, strictly adhere to:
- ✅ Always record OK items (do not skip)
- ⚠️ Provide detailed improvement suggestions for NG items
- 🔶 Clearly state conditions and context for CONDITIONAL items

### 3. Clear Criteria
For each item:
- **Status**: ✅ OK / ⚠️ NG / 🔶 CONDITIONAL
- **Rationale**: Specific reason for the judgment
- **Location**: File name and line number
- **Suggested Fix**: Example fix for NG items

## Procedure

### Step 1: Analyze & Load Resources
**Before starting the review, you MUST perform the following:**

1.  **Identify Language**: Analyze the target file's extension and content to determine the programming language and framework.
2.  **Load Checklists**: Read **ONLY** the relevant checklist files from the `checklists/` directory.
    *   **ALWAYS Load**: `checklists/general.md`, `checklists/responsibility.md`
    *   **Conditional Loading**:
        *   TypeScript (`.ts`, `.tsx`): Load `checklists/typescript.md`
        *   React (`.tsx`, `.jsx`, imports React): Load `checklists/react.md`
        *   Kotlin (`.kt`): Load `checklists/kotlin.md`
        *   SQL (`.sql`): Load `checklists/sql.md`
        *   Test files (`test`, `spec`): Load `checklists/test.md`
    *   **Custom/Private Checklists** (if they exist, load them Conditionally):
        *   Any `checklists/*.local.md` files that exist
    *   *Do NOT load checklists for other languages.*

### Step 2: Execute Review
Using the loaded checklists, review the code item by item.

1.  **Iterate**: Go through every item in the loaded checklists.
2.  **Evaluate**: Check if the code meets the criteria defined in each item.
3.  **Report**: For each item, determine the status (OK/NG/CONDITIONAL) and provide rationale.

## Output Format
The output should follow the format defined in the checklists or the agent's instructions, ensuring all items are covered.

**Language**: All output, including rationale and suggestions, MUST be in Japanese.

## Supported Resources
### Standard Checklists
- `checklists/general.md`
- `checklists/responsibility.md`
- `checklists/typescript.md`
- `checklists/react.md`
- `checklists/kotlin.md`
- `checklists/sql.md`
- `checklists/test.md`
- `checklists/ddd.md`
- `checklists/cqrs.md`

### Custom Checklists (Optional, Gitignored)
- `checklists/*.local.md` - Company/project-specific rules
- These files should be added to `.gitignore` to keep them private
