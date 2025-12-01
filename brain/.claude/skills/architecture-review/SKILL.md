---
name: architecture-review
description: Performs macro-level analysis of codebases, focusing on directory structure, file organization, and dependency patterns.
---

# Architecture Review Skill

## Purpose
This skill provides a "Bird's Eye" view of the codebase. Instead of looking at individual lines of code, it analyzes the relationships between files and the overall structure of the project.

## Core Principles

### 1. Structural Integrity
- Ensure directory structure follows project design intent
- Verify appropriate file placement (e.g., collocation principles)

### 2. Dependency Health
- Detect circular references
- Verify correct dependency direction between layers (e.g., Upper -> Lower)
- Identify inappropriate cross-module coupling

### 3. Visualization
- Explain directory trees and dependencies as needed to help users understand the structure

## Procedure

### Step 1: Structural Mapping
1.  **Analyze Directory**: Use `list_dir` to map out the folder structure of the target area.
2.  **Identify Patterns**: Determine if the project follows a specific architecture (e.g., Feature-based, Layer-based, Clean Architecture).

### Step 2: Dependency Analysis
1.  **Check Imports**: Use `grep_search` or `view_file` on key files to understand import patterns.
2.  **Detect Violations**: Look for:
    -   Circular dependencies
    -   Imports from higher layers to lower layers (if prohibited)
    -   Cross-feature dependencies that should be decoupled

### Step 3: Evaluation
Evaluate the findings against the loaded checklists:
-   `checklists/structure.md`: For directory and file organization.
-   `checklists/dependencies.md`: For import and coupling rules.
-   **Custom Checklists** (if they exist):
    -   `checklists/structure.local.md`: Company-specific structure rules.
    -   `checklists/dependencies.local.md`: Company-specific dependency rules.
    -   Any `checklists/*.local.md` files that exist

## Supported Resources
### Standard Checklists
- `checklists/structure.md`
- `checklists/dependencies.md`

### Custom Checklists (Optional, Gitignored)
- `checklists/*.local.md` - Company/project-specific architecture rules
- These files should be added to `.gitignore` to keep them private
