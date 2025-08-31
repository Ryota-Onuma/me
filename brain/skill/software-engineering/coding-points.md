# Coding Points

Through this document. you can understand what you must keep in mind when you write, review code.

## SOLID Principal

- Single Responsibility Principle (SRP): A class should have only one reason to change, meaning it should have a single, well-defined responsibility. This makes the code easier to understand, maintain, and test.

- Open/Closed Principle (OCP): Software entities (classes, modules, etc.) should be open for extension but closed for modification. You should be able to add new features without changing the existing source code, typically by using interfaces or abstract classes.

- Liskov Substitution Principle (LSP): Objects of a superclass should be replaceable with objects of its subclasses without breaking the application. In other words, a subclass should extend its parent class without changing its fundamental behavior.

- Interface Segregation Principle (ISP): Clients should not be forced to depend on interfaces they do not use. It's better to create many small, specific interfaces rather than one large, general-purpose one.

- Dependency Inversion Principle (DIP): High-level modules should not depend on low-level modules; both should depend on abstractions (e.g., interfaces). This decouples components and makes the system more flexible.

## Type-Driven Design

Use the type system to enforce correctness at compile time, not just runtime. The goal is to make invalid code impossible to write.

### Make Illegal States Unrepresentable

Design your data structures so that invalid combinations of data are impossible to create. This eliminates entire classes of bugs before the code is even run.

```
Bad: Using primitive types that allow for contradictory states.

// Allows isLoading=true and error!=null simultaneously
class PageState {
  bool isLoading;
  string? error;
  Data? data;
}
```

```
Good: Modeling states as a single, exclusive type.

// State can only be one of these possibilities.
// This is often done with a Sum Type (or Sealed Class/Enum).
type PageState =
  | Loading
  | Error(string message)
  | Success(Data data)

```

### Use Sum Types for Exclusive States

When a value can be one of several distinct possibilities, model it using a Sum Type. This allows the compiler to perform exhaustive checks, ensuring you handle every possible case and preventing bugs when new states are added.

- Common Use Case: Representing operation results instead of using null or exceptions for predictable failures.

```
// A function returns either a successful result or a typed error.
type Result<T, E> =
  | Success(T value)
  | Failure(E error)

function fetchUser(id): Result<User, NotFoundError> { ... }
```

## YAGNI Principal

-　 Do not add functionality or write code until you have a clear, immediate, and proven need for it.

## DRY Principal

- Reduce the repetition of information or logic, **just in the same context**.
- If you find the repetition of information or logic, consider applying `DRY Principal`.

## What to comment and what not

### Comment when

- Explain why/intent, trade-offs, or constraints.
- Record assumptions (inputs, ranges, time zone/locale, encoding).
- Clarify non-obvious logic/algorithms or edge cases.
- Note external contracts (API/DB quirks, feature flags).
- Add temporary workaround with clear removal trigger.

### Avoid comments when

- It repeats the code.
- A rename/refactor would make it obvious.
- It’s history/dead code or a fixed bug note.
