# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal blog and portfolio built with Next.js 16 (App Router) featuring two content collections:
- **Blog posts**: Longer-form articles, including external links to published articles
- **Books**: Reading records with optional notes and external book links

The site uses a custom markdown processing pipeline with extended syntax for embeds, alerts, and link cards.

## Development Commands

### Running the application
- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm start` - Start production server

### Testing
- `npm test` - Run all tests (Vitest unit tests + Playwright e2e tests)
- `npm run test:watch` - Run Vitest in watch mode
- `npm run test:e2e` - Run Playwright e2e tests only
- `npm run test:e2e:ui` - Run Playwright with UI
- `npm run test:e2e:report` - View Playwright test report

### Code quality
- `npm run lint` - Run ESLint

## Architecture

### Content System

**Two content types:**
1. **Blog Posts** (`content/posts/*.md`)
   - Standard blog articles with frontmatter
   - Can link to external articles via `external_url` field
   - Processed by `src/lib/posts.ts`

2. **Books** (`content/books/*.md`)
   - Reading records with optional Markdown notes
   - Records without notes link directly to the external book page
   - Processed by `src/lib/books.ts`

**Content locations:**
- Blog posts: `content/posts/`
- Books: `content/books/`

### Markdown Processing Pipeline

The markdown processing is split across three layers:

1. **Pre-processing** (`src/lib/markdownProcessor.ts`)
   - Converts shorthand syntax to directive syntax
   - Handles: `:::message`, `:::details`, `@[youtube](id)`, standalone URLs, image resize syntax

2. **Remark plugin** (`src/lib/remarkCustomDirectives.ts`)
   - Transforms directive nodes into custom hName/hProperties
   - Handles container directives (message, details), leaf directives (embeds, link-card), auto-link cards, image resizing, table wrapping

3. **React components** (`src/lib/markdownComponents.tsx`)
   - Maps custom hNames to React components
   - Provides components for: alerts, code blocks (with Mermaid), embeds (YouTube, Twitter, GitHub, etc.), link cards, details/summary blocks

**Custom markdown syntax:**
- `:::message info` / `:::message warning` - Alert boxes
- `:::details Title` - Collapsible details block
- `@[youtube](videoId)` - YouTube embed
- `@[twitter](tweetId)` - Twitter embed
- `@[github](user/repo)` - GitHub card
- Standalone URLs on their own line - Auto link card
- `![alt](url =400)` - Image with width in pixels
- ` ```mermaid ` - Mermaid diagrams
- ` ```language:filename{1,3-5} ` - Code blocks with filename and line highlights

### App Structure

**Next.js App Router layout:**
- `src/app/layout.tsx` - Root layout with metadata
- `src/app/page.tsx` - Homepage with archive shelves and recent updates
- `src/app/blog/page.tsx` - Blog list page
- `src/app/blog/[slug]/page.tsx` - Individual blog post detail
- `src/app/library/page.tsx` - Reading record list page
- `src/app/library/[slug]/page.tsx` - Reading record detail page

**Component organization:**
- `src/components/layout/` - Header, Footer, MobileMenu
- `src/components/sections/` - Page sections (AboutSection, WorksSection, LibrarySection, BlogHero, BlogNavigation)
- `src/components/ui/` - Reusable UI components (WorkCard, BookCard, TagFilterButton)
- `src/components/markdown/` - Markdown rendering components (CodeBlock, AlertBlock, LinkCard, Mermaid, EmbedBlock)
- `src/components/effects/` - Visual effects (Spotlight, NoiseOverlay, AmbientLight)

**Key libraries:**
- Content: `gray-matter` (frontmatter parsing)
- Markdown: `react-markdown`, `remark-gfm`, `remark-directive`, `remark-math`, `rehype-katex`, `rehype-raw`, `rehype-slug`
- UI: `lucide-react` (icons), `@tailwindcss/typography`
- Code highlighting: `react-syntax-highlighter`
- Diagrams: `mermaid`

### Testing

**Unit tests (Vitest):**
- Test files: `*.test.ts` alongside source files
- Setup: `src/test/setup.ts`
- Environment: jsdom with React Testing Library
- Run single test file: `npx vitest run src/path/to/file.test.ts`

**E2E tests (Playwright):**
- Test files: `tests/*.spec.ts`
- Runs against dev server on http://localhost:3000
- Tests all three browsers: chromium, firefox, webkit

### Path Aliases

Use `@/` to import from `src/`:
```typescript
import { getAllPosts } from '@/lib/posts';
import { Header } from '@/components/layout/Header';
```

## Content Frontmatter Schemas

### Blog Post Frontmatter
```yaml
---
title: "Post Title"
description: "Brief description"
tags: ["tag1", "tag2"]
date: "2026-01-10"
thumbnail: "/thumbnails/image.png"
category: "Blog"
external_url: "https://example.com/article"  # Optional: for external articles
---
```

### Book Frontmatter
```yaml
---
title: "Book Title"
author: "Author Name"
status: "completed"
externalUrl: "https://example.com/book"
tags: ["Book"]
---
```
