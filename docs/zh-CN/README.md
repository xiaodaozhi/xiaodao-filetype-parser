# 技术文档

[English](../README.md) | 简体中文

本目录记录 `xiaodao-filetype-parser` 的设计和维护方式。组件根据有界读取的文件内容识别类型，并返回结构化结果，供上传校验、附件处理和文件扫描流程使用。

## 文档目录

| 文档 | 内容 |
| --- | --- |
| [总体架构与设计决策](architecture.md) | 公开 API、分层结构、数据流、安全边界和扩展方式。 |
| [检测流程](detection-pipeline.md) | 文件读取窗口、检测器顺序、文本规则、容器细化和诊断信息。 |
| [格式支持](format-support.md) | 格式元数据、MIME 与扩展名映射、规则归属和真实样本策略。 |
| [发布与分发](release-and-publishing.md) | CI、版本标签、npm Trusted Publishing、GitHub Packages 和 Release 产物。 |

## 权威来源

`src/` 中的实现、`test/` 中的测试以及 `.github/workflows/` 中的工作流是权威来源。当公开 API、检测规则、包内容或发布流程发生变化时，应同步更新这些文档。
