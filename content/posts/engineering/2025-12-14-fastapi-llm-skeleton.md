---
title: "FastAPI + 大模型推理服务的最小骨架"
date: 2025-12-14T21:00:00+08:00
draft: false
categories: ["工程实践"]
tags: ["FastAPI", "推理服务"]
summary: "与其堆功能，不如先把日志、限流、超时这些‘无聊但关键’的东西做好。"
---
一个能长期跑的推理服务，至少要有：

- request_id
- 统一错误码
- 超时与限流
