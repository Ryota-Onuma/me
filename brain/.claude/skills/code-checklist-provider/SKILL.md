---
name: code-checklist-provider
description: Provides technology-specific code review checklists. Analyzes target files and returns relevant checklists, enforcing single-item sequential evaluation.
---

# Code Checklist Provider

## Purpose
This skill provides technology-specific checklists for code review.
**It forces the user to evaluate items one by one with maximum concentration.**

## Core Principle: Single Item Focus

> [!IMPORTANT]
> **MANDATORY**: Evaluate ONE checklist item at a time.
> - Complete the current item before moving to the next
> - No parallel evaluation allowed
> - Full concentration on each item

## Procedure

### Step 1: Require Tech Stack from Caller

> [!IMPORTANT]
> **Before providing checklists, DEMAND the following from the caller:**
> 1. Target file path(s)
> 2. Tech stack: Language, Framework, Patterns (DDD/CQRS), Test file or not
>
> **If tech stack is not provided, ask the caller to specify it. Do not proceed without this information.**

### Step 2: Provide Checklists

#### Mandatory Checklists (Always Included)
The following checklists are **automatically included** regardless of tech stack:
- `checklists/general.md`
- `checklists/responsibility.md`

> [!CAUTION]
> These checklists are NON-NEGOTIABLE. The caller cannot opt out.

#### Tech Stack Checklists (Based on Caller Input)
Based on the tech stack provided in Step 1, include the relevant checklists:

| Tech Stack | Checklist |
|-----------|-----------|
| TypeScript (.ts, .tsx) | `checklists/typescript.md` |
| React (.tsx, .jsx, uses React) | `checklists/react.md` |
| Kotlin (.kt) | `checklists/kotlin.md` |
| SQL (.sql) | `checklists/sql.md` |
| Test files (test, spec) | `checklists/test.md` |
| DDD patterns | `checklists/ddd.md` |
| CQRS patterns | `checklists/cqrs.md` |
| Local files exist | `checklists/*.local.md` |

### Step 3: Enforce Sequential Evaluation

Instruct the skill user to:
1. Read the **first item** from the first checklist
2. Evaluate **ONLY that item** against the target code
3. Record result: ✅ OK / ⚠️ NG / 🔶 CONDITIONAL
4. Move to the **next item**
5. Repeat until **all items in all checklists** are evaluated

> [!CAUTION]
> Do NOT skip items. Do NOT evaluate multiple items simultaneously.

## Available Checklists

### Standard Checklists
- `checklists/general.md` - General code quality
- `checklists/responsibility.md` - Single responsibility, separation of concerns
- `checklists/typescript.md` - TypeScript-specific
- `checklists/react.md` - React-specific
- `checklists/kotlin.md` - Kotlin-specific
- `checklists/sql.md` - SQL-specific
- `checklists/test.md` - Test code quality
- `checklists/ddd.md` - Domain-Driven Design
- `checklists/cqrs.md` - CQRS pattern

### Custom Checklists (Optional, Gitignored)
- `checklists/*.local.md` - Company/project-specific rules
