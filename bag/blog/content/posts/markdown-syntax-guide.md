---
id: 'markdown-syntax-guide'
type: 'internal'
title: 'Markdown & Syntax Highlighting Guide'
category: 'Tutorial'
description: 'A comprehensive guide to testing and verifying Markdown rendering and syntax highlighting in this blog engine.'
date: 'Jan 02, 2026'
tags: []
thumbnail: '/thumbnails/markdown-syntax-guide.png'
---

Welcome to the Markdown and Syntax Highlighting guide. This post serves as a test suite for our rendering engine to ensure everything looks premium and consistent.

## Typography and Basic Elements

### Headings
Headings from H1 to H6 should have distinct sizes and weights. This is an **H3**, and below is an **H4**.

#### Paragraphs and Formatting
You can use **bold text** for emphasis, *italicized text* for subtle highlights, or even ~~strikethrough~~. Combining them like ***bold and italic*** should also work flawlessly.

> "Design is not just what it looks like and feels like. Design is how it works."
> — Steve Jobs

---

## Lists and Tables

### Task Lists
- [x] Implement syntax highlighting
- [x] Add smooth transitions
- [ ] Optimize image loading

### Unordered and Ordered Lists
1. First item
2. Second item
   - Sub-item A
   - Sub-item B
3. Third item

### Data Tables
| Feature | Supported | Notes |
| :--- | :---: | :--- |
| GitHub Flavored Markdown | Yes | Including tables and task lists |
| Syntax Highlighting | Yes | Powered by Prism.js |
| Mermaid Diagrams | Yes | Flowcharts, sequence diagrams |
| KaTeX Math | Yes | Inline and block equations |

---

## Messages & Alerts

Our engine supports specialized markdown containers for high-visibility messages. While standard GitHub-style blockquotes are supported, we recommend using the `:::message` directive for a more consistent look.

:::message
**Note**: This is a standard message box. It uses our Bianchi Celeste brand color.
:::

:::message tip
**Tip**: This is a tip alert with a fresh look and a lightbulb icon.
:::

:::message important
**Important**: This is an important alert with a violet theme and a zap icon.
:::

:::message warning
**Warning**: This is a warning alert with an amber theme and a triangle icon.
:::

:::message caution
**Caution**: This is a caution alert with a rose theme and a circle-x icon.
:::

---

## Code and Syntax Highlighting

### Inline Code
You can use `inline code` for variable names or short commands like `npm run dev`.

### Code Blocks
Our engine supports various languages with a "Copy" button UI.

#### TypeScript (TSX) with Line Highlighting
```tsx:Counter.tsx{3,5-6}
import React, { useState } from 'react';

export const Counter = () => {
    const [count, setCount] = useState(0);
    
    return (
        <button onClick={() => setCount(count + 1)}>
            Count is: {count}
        </button>
    );
};
```

#### CSS (with filename)
```css:layout.css
.container {
    display: flex;
    justify-content: center;
}
```

#### Bash
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### JSON
```json
{
  "name": "my-blog",
  "version": "1.0.0",
  "private": true
}
```

#### Python
```python:example.py
def hello_world():
    print("Hello, World!")

if __name__ == "__main__":
    hello_world()
```

#### Rust
```rust:main.rs
fn main() {
    println!("Hello, Rust!");
}
```

#### Kotlin
```kotlin:Main.kt
fun main() {
    val message = "Hello, Kotlin!"
    println(message)
    
    val numbers = listOf(1, 2, 3, 4, 5)
    val doubled = numbers.map { it * 2 }
    println(doubled)
}
```

#### SQL
```sql
SELECT * FROM users WHERE active = true;
```

---

## Mathematical Expressions

Inline math: $E = mc^2$

Block math:

$$
\frac{1}{n} \sum_{i=1}^{n} x_i
$$

---

## Mermaid Diagrams

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B
```

---

## Details and Summary

<details>
<summary>Click to see more</summary>

This is hidden content inside a details tag. It supports markdown too!
- Item 1
- Item 2

</details>

---

## Media

### Images
Images should be responsive and centered.

![Sample Thumbnail](/thumbnails/default_blog.png)

*Figure: This is a caption for the image.*

---

## Custom Markdown Extensions

Our engine supports specialized markdown extensions for a richer writing experience.


### Accordion (Directive)
While we support HTML `<details>`, we also support the specialized `:::details` directive.

:::details Click to see more
This is the hidden content inside the accordion. It supports **markdown** too!
:::

### Rich Embeds

Our engine supports shorthand `@[platform](id)` and leaf directives `::platform[id]`. Both will render premium, responsive embeds.

#### YouTube
You can use either shorthand or directive:
- `@[youtube](dQw4w9WgXcQ)`
- `::youtube[id=dQw4w9WgXcQ]`

@[youtube](dQw4w9WgXcQ)

#### Twitter (X)
- `@[twitter](20)`
- `::twitter[id=20]`

@[twitter](20)

#### GitHub Card (Real OGP)
GitHub embeds now fetch the **official social preview (OGP)** from GitHub, providing a rich card with stars, description, and the repository's branding.
- `@[github](Ryota-Onuma/me)`
- `::github[id=Ryota-Onuma/me]`

@[github](Ryota-Onuma/me)

### Link Cards

Simply place a URL on its own line to generate a rich, glassmorphic link card with Open Graph metadata.

https://zenn.dev/zenn/articles/markdown-guide

### Image Resizing
Add `=width` at the end of the image title or URL to resize it.

![Resized Thumbnail](/thumbnails/markdown-syntax-guide.png =300)

---

## Conclusion

If all elements above render correctly with beautiful spacing and crisp colors, the blog engine is ready for production-grade content!
