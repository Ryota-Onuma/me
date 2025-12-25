---
id: 'graphql-intro'
title: "Getting Started with GraphQL"
date: "2024-12-05"
tags: ["GraphQL", "API", "Backend"]
thumbnail: "/thumbnails/default_blog.png"
category: "Internal / Blog"
description: "Learn the fundamentals of GraphQL API design."
---

# Getting Started with GraphQL

GraphQL offers a flexible alternative to REST APIs.

## Queries

```graphql
query {
  user(id: "1") {
    name
    email
  }
}
```

## Mutations

Modify data with GraphQL mutations.
