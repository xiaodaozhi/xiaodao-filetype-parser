# 发布与分发

[English](../release-and-publishing.md) | 简体中文

## 版本与标签契约

发布版本是 `package.json` 的 `version` 字段，`package-lock.json` 中也必须有相同的解析版本。发布标签必须严格是 `v<version>`，例如版本 `0.1.1` 对应 `v0.1.1`。

`npm run release:check` 读取 `GITHUB_REF`，只有它等于 `refs/tags/v<package.json version>` 才会通过。发布前执行这一检查，可以阻止使用与已检出清单不同版本的标签发布。

标准发布顺序如下：

```bash
npm version patch --no-git-tag-version
npm install --package-lock-only
npm run check
npm run pack:check
git add package.json package-lock.json
git commit -m "release: v0.1.1"
git tag v0.1.1
git push origin main --follow-tags
```

命令中的版本号应替换为实际版本。推送标签会启动基于标签的发布工作流，CI 也会验证被标签指向的提交。

## 持续集成

`.github/workflows/ci.yml` 在 push 和 pull request 时运行，矩阵覆盖 Ubuntu、Windows 以及 Node.js 20、22、24。每个矩阵任务都会执行：

```text
npm ci
npm run check
npm run pack:check
```

`npm ci` 证明锁文件和 package manifest 可以在干净 checkout 中安装。`npm run check` 编译 TypeScript 并运行 Node 测试套件。`npm run pack:check` 执行 `npm pack --dry-run`，检查包元数据并强制执行发布白名单。

## npm Trusted Publishing

`.github/workflows/publish.yml` 在推送版本标签时把非作用域包 `xiaodao-filetype-parser` 发布到 `https://registry.npmjs.org/`。任务授予 `id-token: write`，使用 Node.js 24，检查 npm 至少为 11.5.1，按锁文件安装依赖，执行检查，最后运行：

```bash
npm publish --access public
```

npm 包设置中必须为当前 GitHub 仓库和 `publish.yml` 工作流配置 Trusted Publisher。请填写 npm 配置要求的准确 owner、repository、workflow 文件名和环境。工作流刻意不设置 `registry-url` 或长期 `NODE_AUTH_TOKEN`；npm 会通过 GitHub OIDC 交换短期发布凭据。

如果 OIDC 环境变量不可用，工作流会在发布前停止。由于 `release:check` 要求标签引用，支持的触发方式是推送正确版本的标签；首次发布和后续版本都应使用版本匹配的标签。

## GitHub Packages

`.github/workflows/github-packages.yml` 将作用域 manifest 发布到 `https://npm.pkg.github.com/`。它检出指定标签，校验版本，构建并测试项目，然后只修改 runner 中的 manifest 副本：

```json
{
  "name": "@xiaodaozhi/xiaodao-filetype-parser",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/"
  }
}
```

任务授予 `packages: write` 并使用 `GITHUB_TOKEN`。发布前会检查仓库中是否已有同版本；如果已有版本的完整性不同，流程会失败而不会静默替换。随后工作流会在干净的临时 consumer 目录安装已发布包，并调用 `detect`、`detectFile` 和 `getFormatByExtension` 做冒烟验证。

该工作流还支持携带已有 `tag` 的手动运行。优先使用推送标签的路径，因为这样可以让包发布和 Release 任务绑定到同一个不可变引用。

## GitHub Release 产物

GitHub Packages 工作流会从同一标签源码生成两个归档：

- npmjs.org 使用的非作用域包归档；
- GitHub Packages 使用的作用域包归档。

工作流生成 `SHA256SUMS`，Release 任务会先校验校验和，然后为对应标签创建或更新 GitHub Release。新 Release 使用 `--verify-tag` 和自动生成的发布说明；已有 Release 会覆盖上传新的产物。预发布状态根据打包版本推导。

Release 产物为不使用 registry 的调用方提供直接下载方式。归档内容在发布前仍会经过 `npm run pack:check` 校验。

## npm 包内容

`package.json` 的 `files` 白名单保持很小：

```text
dist/
README.md
README.zh-CN.md
LICENSE
```

npm 始终会包含 `package.json`。`scripts/check-package.mjs` 会校验预期文件并拒绝意外文件，因此 `docs/` 下的文档不会进入 npm 包，除非有意修改白名单。

## 发布前检查清单

推送发布标签前：

1. 确认 `package.json` 和 `package-lock.json` 使用目标版本。
2. 在干净 checkout 中执行 `npm ci`，然后运行 `npm run check` 和 `npm run pack:check`。
3. 检查 dry-run 归档，确认两个 README 使用 `zh-CN` 文件名。
4. 确认 npm Trusted Publisher 指向当前仓库和 `publish.yml`。
5. 确认仓库允许 GitHub Packages 工作流写入 package。
6. 推送 `v<version>` 并检查两个 Actions 工作流。
7. 核验 npm 包、GitHub 包、归档校验和以及 GitHub Release 产物。
