---
title: "为什么重排几乎总能提升 RAG 效果"
date: 2025-12-14T18:20:00+08:00
draft: false
categories: ["工具解析"]
tags: ["Rerank", "检索"]
summary: "Embedding 负责“找得到”，重排负责“排得准”，这是两个完全不同的问题。"
---
实践中我观察到：

- 加重排 > 换 embedding
- 小模型重排性价比极高
