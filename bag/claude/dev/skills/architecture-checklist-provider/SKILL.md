---
name: architecture-checklist-provider
description: Provides architecture-specific checklists for structural and dependency analysis. Enforces single-item sequential evaluation.
user-invocable: false
---

# Architecture Checklist Provider

## Purpose
This skill provides architecture-specific checklists for reviewing project structure and dependencies.
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
> 1. Target directory/module path(s)
> 2. Architecture context: Layer structure, Architecture pattern (Clean Architecture, Feature-based, etc.)
>
> **If context is not provided, ask the caller to specify it. Do not proceed without this information.**

### Step 2: Provide Checklists

#### Mandatory Checklists (Always Included)
The following checklists are **automatically included** regardless of architecture:
- `checklists/structure.md`
- `checklists/dependencies.md`

> [!CAUTION]
> These checklists are NON-NEGOTIABLE. The caller cannot opt out.

#### Custom Checklists (Based on Caller Input)
Based on context provided in Step 1, include if present:

| Condition | Checklist |
|-----------|-----------|
| Local structure rules exist | `checklists/structure.local.md` |
| Local dependency rules exist | `checklists/dependencies.local.md` |
| Other local files exist | `checklists/*.local.md` |

### Step 3: Enforce Sequential Evaluation

Instruct the skill user to:
1. Read the **first item** from the first checklist
2. Evaluate **ONLY that item** against the target structure
3. Record result: ✅ OK / ⚠️ NG / 🔶 CONDITIONAL
4. Move to the **next item**
5. Repeat until **all items in all checklists** are evaluated

> [!CAUTION]
> Do NOT skip items. Do NOT evaluate multiple items simultaneously.

## Available Checklists

### Standard Checklists
- `checklists/structure.md` - Directory and file organization
- `checklists/dependencies.md` - Import patterns and coupling rules

### Custom Checklists (Optional, Gitignored)
- `checklists/*.local.md` - Company/project-specific architecture rules
