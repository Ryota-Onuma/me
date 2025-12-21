---
name: change-impact-checklist-provider
description: Provides change impact analysis checklists. Enforces single-item sequential evaluation for breaking changes and release strategy.
---

# Change Impact Checklist Provider

## Purpose
This skill provides checklists for analyzing the impact of code changes on the broader system.
**It forces the user to evaluate items one by one with maximum concentration.**

## Core Principle: Single Item Focus

> [!IMPORTANT]
> **MANDATORY**: Evaluate ONE checklist item at a time.
> - Complete the current item before moving to the next
> - No parallel evaluation allowed
> - Full concentration on each item

## Procedure

### Step 1: Require Context from Caller

> [!IMPORTANT]
> **Before providing checklists, DEMAND the following from the caller:**
> 1. List of modified files (or git diff)
> 2. Change context: Change type (API change, DB schema change, Logic change, Refactoring)
>
> **If context is not provided, ask the caller to specify it. Do not proceed without this information.**

### Step 2: Provide Checklists

#### Mandatory Checklists (Always Included)
The following checklists are **automatically included** regardless of change type:
- `checklists/breaking-changes.md`
- `checklists/release-strategy.md`

> [!CAUTION]
> These checklists are NON-NEGOTIABLE. The caller cannot opt out.

#### Custom Checklists (Based on Caller Input)
Based on context provided in Step 1, include if present:

| Condition | Checklist |
|-----------|-----------|
| Local rules exist | `checklists/*.local.md` |

### Step 3: Enforce Sequential Evaluation

Instruct the skill user to:
1. Read the **first item** from the first checklist
2. Evaluate **ONLY that item** against the change set
3. Record result: ✅ OK / ⚠️ NG / 🔶 CONDITIONAL
4. Move to the **next item**
5. Repeat until **all items in all checklists** are evaluated

> [!CAUTION]
> Do NOT skip items. Do NOT evaluate multiple items simultaneously.

## Available Checklists

### Standard Checklists
- `checklists/breaking-changes.md` - Breaking change detection
- `checklists/release-strategy.md` - Release order and compatibility

### Custom Checklists (Optional, Gitignored)
- `checklists/*.local.md` - Company/project-specific release rules
