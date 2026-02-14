# Structure Checklist

## ST01: Logical Grouping
**Goal**: Files should be grouped logically (e.g., by feature or by type).
-   **OK**: Related files (Component, Style, Test) are collocated or clearly mapped.
-   **NG**: Unrelated files are mixed in a single flat directory.

## ST02: Naming Consistency
**Goal**: Directory and file names should follow a consistent convention.
-   **OK**: All directories use `kebab-case` (or project standard).
-   **NG**: Mix of `camelCase`, `snake_case`, and `kebab-case` for similar entities.

## ST03: Module Boundaries
**Goal**: Public API of a module should be clear.
-   **OK**: Modules have an `index.ts` (or equivalent) defining exports.
-   **NG**: Internal files are deep-imported from other modules (e.g., `import ... from '../feature/internal/helper'`).
