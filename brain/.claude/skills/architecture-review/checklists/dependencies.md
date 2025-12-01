# Dependencies Checklist

## DP01: No Circular Dependencies
**Goal**: Modules should not depend on each other cyclically.
-   **OK**: A → B → C
-   **NG**: A → B → A

## DP02: Domain Isolation
**Goal**: ドメイン層は外部技術に依存してはならない。ドメインは依存の中心。
-   **OK**: Domain models/entities have no imports from infrastructure, UI, or external libraries.
-   **NG**: Domain layer imports database libraries, HTTP clients, UI frameworks, or any technical implementation.

**Concept**:
```
❌ NG: Domain importing infrastructure
domain/User ──imports──> database.Client
domain/User ──imports──> http.Request

✅ OK: Domain is pure
domain/User (no external dependencies)
```

## DP03: Dependency Inversion (Ports & Adapters)
**Goal**: 技術的な実装（アダプタ）はドメインが定義したインターフェース（ポート）に依存する。
-   **OK**: Infrastructure implements interfaces defined in domain.
-   **NG**: Domain depends on concrete infrastructure implementations.

**Concept**:
```
✅ OK: Domain defines port (interface)
domain/ports/UserRepository (interface)
  ↑ implements
infrastructure/PrismaUserRepository (concrete class)

❌ NG: Domain importing adapter
domain/User ──imports──> infrastructure/PrismaUserRepository
```

**Applicable to**: Clean Architecture, Hexagonal Architecture, Onion Architecture

## DP04: Layer Direction
**Goal**: Dependencies should flow inward: UI/Infrastructure → Application → Domain.
-   **OK**: Presentation → Application Services → Domain
-   **OK**: Infrastructure → Domain (via ports)
-   **NG**: Domain → Infrastructure
-   **NG**: Domain → Application
-   **NG**: Domain → Presentation

**Dependency Flow**:
```
✅ OK:
UI ────────────┐
               ├──> Application ──> Domain
Infrastructure ┘

❌ NG:
Domain ──> Infrastructure (outward dependency)
```

## DP05: Port Definitions in Domain
**Goal**: すべてのポート（インターフェース）はドメイン層で定義される。
-   **OK**: `domain/ports/` directory contains all interfaces for external dependencies.
-   **NG**: Infrastructure defines interfaces that domain uses.

**Structure**:
```
domain/
  ├── entities/
  ├── value-objects/
  └── ports/          # ← All interfaces here
      ├── UserRepository
      ├── EmailService
      └── EventPublisher
```

## DP06: Adapter Independence
**Goal**: アダプタ（技術実装）は交換可能で、ドメインに影響を与えない。
-   **OK**: Can swap database (Prisma → TypeORM, MySQL → PostgreSQL) without changing domain.
-   **OK**: Can swap HTTP framework (Express → Fastify, Spring → Ktor) without changing domain.
-   **NG**: Changing infrastructure requires domain code changes.

**Test**: If you can replace the adapter without touching domain code, it's properly isolated.

## DP07: No Framework Coupling in Domain
**Goal**: ドメイン層はフレームワークに依存しない。
-   **OK**: Domain uses plain language features only.
-   **NG**: Domain imports framework-specific annotations, decorators, or base classes.

**Examples by Language**:
- **TypeScript/JavaScript**: No React, Express, NestJS imports
- **Java/Kotlin**: No Spring, Jakarta EE annotations in domain
- **Python**: No Django, FastAPI imports in domain
- **C#**: No ASP.NET, Entity Framework in domain

**Concept**:
```
❌ NG: Domain coupled to framework
domain/UserService ──uses──> @Injectable (framework decorator)

✅ OK: Plain domain service
domain/UserService (plain class, no framework dependencies)
```

## DP08: Encapsulation
**Goal**: Implementation details should not leak.
-   **OK**: Imports target the module's public interface.
-   **NG**: Imports target private/internal utilities of another module.
