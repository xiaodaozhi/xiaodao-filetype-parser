# 格式支持

[English](../format-support.md) | 简体中文

## 元数据契约

每个公开 `FileTypeId` 都在 `src/formats.ts` 的 `FORMAT_DEFINITIONS` 中有一条定义：

```ts
interface FormatDefinition {
  name: string;
  description: string;
  mimeType: string;
  extensions: readonly string[];
  category: FileCategory;
  encoding: string;
  isText: boolean;
}
```

这份定义是 `DetectionResult` 和扩展名查询表的单一元数据来源。二进制格式使用 `encoding: 'binary'` 和 `isText: false`；文本格式声明默认编码并设置 `isText: true`。

`EXTENSION_TO_TYPE` 在模块加载时由格式定义派生。扩展名不带前导点并统一使用小写。`getFormatByExtension` 会去除首尾空白、去掉一个前导点并转为小写，然后返回对应的类型和定义。扩展名为空或未知时返回 `null`。

```ts
getFormatByExtension('.DOCX')?.type; // 'docx'
getFormatByExtension('  JpEg ')?.definition.mimeType; // 'image/jpeg'
getFormatByExtension('unknown'); // null
```

映射支持 `jpg`/`jpeg`、`htm`/`html`、`yml`/`yaml`、`3g2`/`3gp`、`m4v`/`mp4` 和 `azw3`/`mobi` 等别名。别名只映射到一个规范 `FileTypeId`，不会创建第二个公开格式。

## 当前覆盖范围

当前定义覆盖以下类别：

| 类别 | 代表性类型 ID | MIME 类型示例 |
| --- | --- | --- |
| 图片 | `png`、`jpeg`、`gif`、`bmp`、`tiff`、`ico`、`cur`、`jp2`、`webp`、`avif`、`heif`、`psd` | `image/*` |
| 音频 | `mp3`、`aac`、`flac`、`midi`、`ogg`、`m4a`、`wav` | `audio/*` 和 `application/ogg` |
| 视频与媒体容器 | `mp4`、`mov`、`mpeg`、`3gp`、`avi`、`mkv`、`webm`、`flv`、`mxf`、`swf`、`riff` | `video/*`、`application/mxf` 和通用容器 MIME |
| 文档 | `pdf`、`rtf`、`doc`、`docx`、`xls`、`xlsx`、`ppt`、`pptx`、`odt`、`ods`、`odp`、`epub`、`mobi`、`chm`、`msg` | Office、文档、电子书和邮件 MIME 类型 |
| 文本与源码 | `text`、`markdown`、`json`、`xml`、`html`、`svg`、`csv`、`ini`、`yaml`、`toml`、`css`、`javascript`、`typescript`、`python`、`shell`、`batch`、`postscript`、`eml`、`gltf` | `text/*`、结构化应用类型和模型 MIME 类型 |
| 基于 ZIP 的包 | `zip`、`jar`、`apk`、`ipa`、`vsix`、`odt`、`ods`、`odp`、`docx`、`xlsx`、`pptx`、`epub` | ZIP、Java、Android、Office Open XML、OpenDocument 和包 MIME 类型 |
| 归档与磁盘镜像 | `7z`、`rar`、`gzip`、`bzip2`、`xz`、`zstd`、`lz4`、`tar`、`cpio`、`ar`、`cab`、`rpm`、`deb`、`dmg`、`iso`、`wim`、`xar` | `application/*` 归档和镜像类型 |
| 可执行文件与二进制数据 | `pe`、`elf`、`macho`、`class`、`dex`、`wasm`、`sqlite`、`parquet`、`ole`、`plist`、`tnef` | 可执行文件、数据库、文档容器和二进制数据 MIME 类型 |
| 字体 | `ttf`、`otf`、`woff`、`woff2` | `font/*` |

当容器签名可靠但无法得到具体子类型时，检测器可以返回通用容器。例如，没有可识别包条目的 ZIP 会保持为 `zip`，未知 RIFF 子类型会保持为 `riff`。

## 规则应该放在哪里

按证据类型选择最小的检测器：

| 文件 | 适用规则 |
| --- | --- |
| `src/detectors/signatures.ts` | 固定字节、魔数、字节序标记或小型二进制头字段。 |
| `src/detectors/text.ts` | BOM、编码模式、可打印文本、shebang、文本结构或 JSON 这类有界解析。 |
| `src/detectors/containers.ts` | ZIP 条目名、已存储 ZIP 元数据、OLE 流名称或 RIFF 子类型。 |

规则应返回带有可解释 signal 的 candidate。candidate 的类型使用 `FileTypeId`；名称、MIME、扩展名、类别和默认编码统一放在 `FORMAT_DEFINITIONS`。

## 新增或修改格式

新增格式时：

1. 在 `src/types.ts` 定义公开 ID 和类别。
2. 增加一条元数据定义，填写基于标准的 MIME 类型和项目有意支持的扩展名。
3. 增加检测规则，提供稳定的 `ruleId`、有用的 `detail` 和与证据匹配的置信度。
4. 判断规则是否权威。唯一魔数通常可以标记为权威；文本启发式或只检查头部的规则可能不应标记为权威。
5. 在 `test/fixtures/real/` 放入至少一个真实样本，保留该格式的真实字节。
6. 在 `test/real-samples.test.ts` 中增加断言；需要时同步修改 `test/formats.test.ts`。
7. 检查别名、大小写规范化、MIME 元数据、打包内容以及 Buffer 和文件两种检测路径。

修改已有 MIME 或扩展名属于公开契约变化。当调用方可观察到的 `DetectionResult` 发生变化时，应同步 README 或发布说明，并让映射测试与规范 ID 保持一致。

## 样本策略

样本应包含真实的文件结构、头部和有代表性的元数据。只改变扩展名的文件不能证明内容识别。只要不丢失相关结构，应优先使用小样本；适合长期维护时，将样本来源记录在 `test/fixtures/real/README.md`。

验证内容识别时，`detect` 应传入无关文件名。验证有界文件路径时，应通过 `detectFile` 断言相同类型，并检查读取行为仍符合预期的有界模型。
