# xiaodao-filetype-parser

一个基于文件内容识别类型的 Node.js + TypeScript 组件。组件采用纯 TypeScript ESM 实现，不依赖系统 `libmagic`、原生 DLL、外部命令或解压工具。

[English](README.md) | 简体中文

识别结果包含稳定类型标识、MIME、扩展名、类别、编码、置信度、权威性、识别信号和有界读取诊断，适合上传校验、附件处理和文件扫描流程。

## 安装

```bash
npm install xiaodao-filetype-parser
```

需要 Node.js 20 或更高版本。包以 ES Module 形式发布。

## 快速开始

```typescript
import { detect, detectFile, getFormatByExtension } from 'xiaodao-filetype-parser';
import fs from 'node:fs/promises';

const buffer = await fs.readFile('report.pdf');
const fromBuffer = detect(buffer);

console.log(fromBuffer.type);          // 'pdf'
console.log(fromBuffer.mimeType);      // 'application/pdf'
console.log(fromBuffer.authoritative); // true

const fromPath = await detectFile('report.pdf');
console.log(fromPath.description);

const mapping = getFormatByExtension('.DOCX');
console.log(mapping?.type);              // 'docx'
console.log(mapping?.definition.mimeType); // application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

文件名只能作为文本类输入的弱提示，不能覆盖可靠的内容签名：

```typescript
const result = detect(Buffer.from('const answer = 42;\n'), {
  fileName: 'answer.js',
});

console.log(result.type);          // 'text'
console.log(result.authoritative); // false
console.log(result.signals);       // 解释文本和文件名识别依据
```

## 识别结果

```typescript
interface DetectionResult {
  type: FileTypeId | 'unknown';
  name: string | null;
  description: string | null;
  mimeType: string | null;
  extensions: readonly string[];
  encoding: string | null;
  category: FileCategory | 'unknown';
  isText: boolean | null;
  confidence: number;
  authoritative: boolean;
  sizeBytes: number;
  bytesExamined: number;
  signals: readonly DetectionSignal[];
  diagnostics: readonly DetectionDiagnostic[];
  container: ContainerInfo | null;
}
```

`confidence` 的范围是 `0..1`。内容签名和经过结构校验的容器结果属于权威结果；文本启发式和文件名提示会使用较低置信度。

无法可靠识别时返回 `unknown`，不会因为未知内容抛出异常：

```typescript
const result = detect(Buffer.from([0, 1, 2, 3]));

if (result.type === 'unknown') {
  console.log('无法可靠识别文件类型');
}
```

参数错误、文件读取失败、权限错误和非法读取配置会抛出 `FileTypeError`。

## 有界文件读取

`detectFile()` 默认只读取文件头部、尾部和安全定位到的 ZIP 中央目录，不会把大型文件完整加载到内存：

```typescript
const result = await detectFile('large-upload.bin', {
  headBytes: 64 * 1024,
  tailBytes: 128 * 1024,
  maxReadBytes: 2 * 1024 * 1024,
});

console.log(result.sizeBytes);
console.log(result.bytesExamined);
console.log(result.diagnostics);
```

如果能够确认外层类型，但无法在读取预算内完成容器细分，结果会保留外层类型，并在 `diagnostics` 中返回 `container-refinement-skipped`。

## 支持格式

首版覆盖常见图片、音频、视频、文档、文本、归档、Office ZIP/OLE 容器、字体和可执行文件，包括 PNG、JPEG、GIF、WebP、BMP、TIFF、JPEG 2000、AVIF、HEIF、SVG、MP3、AAC、M4A、MIDI、WAV、FLAC、OGG、MP4、MOV、3GPP、MPEG、WebM、AVI、SWF、PDF、PostScript、RTF、XML、JSON、glTF、CSV、INI、EML、JavaScript、TypeScript、Python、YAML、ZIP、DOCX、XLSX、PPTX、ODT、ODS、ODP、EPUB、JAR、APK、IPA、VSIX、MOBI、OLE、DOC、XLS、PPT、二进制 plist、GZIP、BZIP2、XZ、7z、RAR、TAR、Debian、RPM、SQLite、ELF、PE、Mach-O、Java Class、DEX、WebAssembly、TTF、OTF、WOFF 和 WOFF2。

无需读取文件也可以查询扩展名映射。`getFormatByExtension()` 接受不区分大小写、带点或不带点的扩展名，并返回标准类型和完整格式元数据。

ZIP 和 OLE 只做结构识别，不解压归档、不执行内容、不解析宏、不渲染 HTML，也不展开嵌入对象。

## 开发

```bash
npm ci
npm run build
npm test
npm run check
npm run pack:check
```

实现通过统一的字节源抽象连接内存输入和文件路径输入。`Buffer` 入口同步执行；文件路径入口使用带读取预算的定位读取，因此签名检测和容器检测可以共享同一套逻辑。

## 发布

发布时应创建与 `package.json` 版本一致的 Git 标签并推送到远程仓库：

```bash
git tag v0.1.1
git push origin v0.1.1
```

发布工作流会先校验标签版本，从 lockfile 安装依赖，执行 `npm run check`，检查 npm 包内容，并通过 GitHub OIDC 和 npm Trusted Publishing 发布到 npm，不保存长期 npm token。

发布前，请在 npm 包设置中配置 Trusted Publisher：

| 配置项 | 值 |
| --- | --- |
| Provider | GitHub Actions |
| Organization or user | `xiaodaozhi` |
| Repository | `xiaodao-filetype-parser` |
| Workflow filename | `publish.yml` |
| Environment | 留空 |
| Permission | 允许 `npm publish` |

工作流文件名必须填写包含扩展名的 `publish.yml`；`Publish` 只是工作流的显示名称。状态为 **Pending validation** 的连接会在首次成功通过可信发布后完成验证。如果发布返回 `E404` 或 `ENEEDAUTH`，请核对包是否存在，以及上述配置和发布权限是否匹配。`0.0.0-stage` 占位包不代表正式版本已经发布。

每次发布都应使用新版本，npm 不允许覆盖已有版本。创建匹配的标签前，请同步更新 `package.json` 和 `package-lock.json`。满足 npm 的公开仓库条件时，provenance 会自动生成。首次创建包和发布平台的要求，请参阅 [npm Trusted Publishing 文档](https://docs.npmjs.com/trusted-publishers)。

## 许可证

MIT
