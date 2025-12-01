---
name: change-impact-review
description: Performs flow-level analysis to determine the impact of code changes on the broader system.
---

# Change Impact Review Skill

## Purpose
This skill focuses on the "Flow" of changes. It answers the question: "If I change this, what else breaks?"

## Core Principles

### 1. Breaking Change Detection
- API signature changes
- Database schema changes
- Logic changes that alter existing behavior

### 2. Ripple Effect Prediction
- Identify where changed components are depended upon
- Determine the scope of required testing

### 3. Risk Assessment
- Determine risk level (High/Medium/Low)
- **Release Strategy**:
    - FE/BE Release Order (Does FE depend on new BE changes?)
    - Backward Compatibility (Can old FE work with new BE?)
    - Migration Steps (Database, Data backfills)

## Procedure

### Step 1: Identify Change Set
1.  **Analyze Input**: Review the list of modified files provided by the user.
2.  **Determine Scope**: Is this a UI change, a logic change, or a data structure change?

### Step 2: Trace Dependencies
1.  **Find Usages**: For every modified public function, class, or constant, use `grep_search` to find all usages in the codebase.
2.  **Check Interfaces**: If an interface or type definition changed, identify all implementers.

### Step 3: Assess Risk
1.  **Breaking Changes**: Did a required argument become optional? Did a return type change? (High Risk)
2.  **Logic Changes**: Did the internal behavior change without signature change? (Medium Risk)
3.  **Refactoring**: Internal cleanup with no behavior change? (Low Risk)

### Step 4: Release Strategy Check
1.  **Dependency Direction**:
    - If BE API changes: Will current FE break? (Requires Backward Comp.)
    - If FE uses new API: Is BE deployed first?
2.  **Compatibility**:
    - Is the change additive? (Safe)
    - Is it a replacement/deletion? (Unsafe, requires expand-contract)

## Output
Provide a risk assessment and a list of impacted files that need verification.
