---
id: 'rust-basics'
title: "Rust Programming Basics"
date: "2024-11-28"
tags: ["Rust", "Programming", "Systems"]
thumbnail: "/thumbnails/default_blog.png"
category: "Internal / Blog"
description: "Introduction to Rust's ownership and type system."
---

# Rust Programming Basics

Rust offers memory safety without garbage collection.

## Ownership

Every value has a single owner.

## Borrowing

```rust
fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s);
}
```
