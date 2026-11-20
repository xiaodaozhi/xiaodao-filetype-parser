# Technical Documentation

English | [简体中文](zh-CN/README.md)

This directory documents the design and maintenance model of `xiaodao-filetype-parser`. The package identifies a file from bounded byte content, then returns a structured result that callers can use for validation, attachment handling, and scanning workflows.

## Documents

| Document | Scope |
| --- | --- |
| [Architecture](architecture.md) | Public API, layers, data flow, safety boundaries, and extension points. |
| [Detection pipeline](detection-pipeline.md) | File windows, detector order, text heuristics, container refinement, and diagnostics. |
| [Format support](format-support.md) | Format metadata, MIME and extension mappings, detector placement, and fixture policy. |
| [Release and publishing](release-and-publishing.md) | CI, release tags, npm Trusted Publishing, GitHub Packages, and release assets. |

## Source of truth

The implementation in `src/`, the tests in `test/`, and the workflows in `.github/workflows/` are authoritative. These documents describe the current behavior and should be updated with code changes that alter the public API, detection rules, package contents, or release process.
