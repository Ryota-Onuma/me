---
title: "Designing Data-Intensive Applications"
author: "Martin Kleppmann"
status: "reading"
externalUrl: "https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321"
tags: ["distributed-systems", "databases", "architecture"]
readDate: "2026-01-05"
rating: 5
---

## About This Book

Designing Data-Intensive Applications is a comprehensive guide to the principles and practices of building reliable, scalable, and maintainable data systems. Martin Kleppmann explores the fundamental ideas behind modern data technologies, from databases to stream processing.

The book doesn't focus on specific tools or frameworks but rather on the underlying concepts that remain relevant regardless of which technologies you use. It covers topics like data models, storage engines, replication, partitioning, transactions, consistency, and consensus.

## Impressions

This is one of the most thorough and well-researched technical books I've ever read. Kleppmann has an incredible ability to explain complex distributed systems concepts in a clear and accessible way.

What I love most is that the book doesn't take sides in technology debates. Instead, it explains the trade-offs involved in different approaches, helping you make informed decisions for your specific use case.

The book is dense with information, so I'm taking my time with it. Each chapter introduces concepts that build on previous ones, and there are plenty of references to academic papers if you want to dive deeper.

## Learnings & Knowledge Notes

### Data Models and Query Languages

- Relational, document, and graph data models each have their strengths
- The choice depends on the relationships in your data
- Schema-on-write (relational) vs schema-on-read (document)
- Declarative query languages (SQL) vs imperative approaches

### Storage and Retrieval

- Log-structured storage engines (LSM-trees) vs page-oriented engines (B-trees)
- LSM-trees optimize for write throughput
- B-trees optimize for read performance
- Different workloads need different indexing strategies

### Replication

- Leaders and followers for read scaling
- Synchronous vs asynchronous replication trade-offs
- Handling replication lag and its consequences
- Multi-leader and leaderless replication for higher availability

### Partitioning

- Partition by key range vs hash of key
- Partitioning and secondary indexes
- Rebalancing partitions as data grows
- Request routing to the correct partition

### Transactions

- ACID properties and what they really mean
- Isolation levels: read committed, snapshot isolation, serializability
- Weak isolation levels and their anomalies
- Two-phase commit for distributed transactions

### Consistency and Consensus

- Linearizability: the strongest consistency model
- CAP theorem and its practical implications
- Consensus algorithms (Paxos, Raft, ZAB)
- The importance of total order broadcast

## Key Insights

1. **There are no silver bullets**: Every architectural decision involves trade-offs. Understanding these trade-offs is more valuable than memorizing best practices.

2. **Distributed systems are hard**: Many problems arise from the asynchrony and partial failures inherent in networked systems. You can't assume that messages arrive reliably or that clocks are synchronized.

3. **Design for failure**: Things will go wrong - networks will partition, disks will fail, processes will crash. Systems should be designed to handle these failures gracefully.

## Current Progress

I'm about 60% through the book, currently on the chapter about distributed transactions and consensus. The concepts are getting increasingly complex, but the explanations remain clear. I'm taking notes and drawing diagrams to help solidify my understanding of the different consistency models and their guarantees.
