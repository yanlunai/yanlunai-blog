---
title: "Hugo + PaperMod：我推荐的工程目录结构"
date: 2025-12-16T08:50:00+08:00
draft: false
categories: ["工程实践"]
tags: ["Hugo", "PaperMod", "工程结构"]
summary: "相比写主题魔改，我更建议用 layouts + assets/extended 的方式，保持主题可升级、改动可控。"
---
## 核心原则

- 不改 theme 源码
- 所有自定义都可删除、可回滚

## 推荐结构

```text
layouts/
  index.html
  partials/
assets/
  css/extended/
content/
  posts/
```
