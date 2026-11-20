# Release and Publishing

English | [简体中文](zh-CN/release-and-publishing.md)

## Version and tag contract

The release version is the `version` field in `package.json`, with the matching resolved version in `package-lock.json`. A release tag must be exactly `v<version>`, for example `v0.1.1` for version `0.1.1`.

`npm run release:check` reads `GITHUB_REF` and fails unless it is `refs/tags/v<package.json version>`. The check runs before publishing so a tag cannot publish a different version from the checked-out manifest.

The normal release sequence is:

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

Use the actual version in all commands. The tag push starts the tag-based publish workflows and the CI workflow also verifies the tagged commit.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes and pull requests across Ubuntu and Windows with Node.js 20, 22, and 24. Every matrix job runs:

```text
npm ci
npm run check
npm run pack:check
```

The `npm ci` step proves that the lockfile and package manifest can install from a clean checkout. `npm run check` compiles the TypeScript source and runs the Node test suite. `npm run pack:check` runs `npm pack --dry-run`, checks package metadata, and enforces the package allowlist.

## npm Trusted Publishing

`.github/workflows/publish.yml` publishes the unscoped package `xiaodao-filetype-parser` to `https://registry.npmjs.org/` when a version tag is pushed. The job grants `id-token: write`, uses Node.js 24, verifies npm 11.5.1 or newer, installs from the lockfile, runs the checks, and publishes with:

```bash
npm publish --access public
```

The npm package settings must contain a Trusted Publisher for this GitHub repository and the `publish.yml` workflow. Configure the exact owner, repository, workflow filename, and any environment required by the npm configuration. The workflow intentionally does not set `registry-url` or a long-lived `NODE_AUTH_TOKEN`; npm obtains a short-lived credential from the GitHub OIDC exchange.

If the OIDC variables are unavailable, the workflow stops before publishing. A tag push is the supported trigger because `release:check` requires a tag reference; use a correctly versioned tag for the first publish and subsequent releases.

## GitHub Packages

`.github/workflows/github-packages.yml` publishes a scoped manifest to GitHub Packages at `https://npm.pkg.github.com/`. It checks out the selected tag, verifies the version, builds and tests the project, then changes only the runner copy of the manifest to:

```json
{
  "name": "@xiaodaozhi/xiaodao-filetype-parser",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com/"
  }
}
```

The job grants `packages: write` and uses `GITHUB_TOKEN`. It checks an existing registry version's integrity before publishing; a same-version package with different bytes fails instead of being silently replaced. It then installs the published package into a clean temporary consumer directory and exercises `detect`, `detectFile`, and `getFormatByExtension`.

The workflow also supports a manual run with an existing `tag` input. A tag push is the preferred path because it keeps the package and Release jobs tied to the same immutable ref.

## GitHub Release assets

The GitHub Packages workflow builds two archives from the same tagged source:

- the unscoped npmjs.org archive;
- the scoped GitHub Packages archive.

It generates `SHA256SUMS`, verifies the checksums in the Release job, and creates or updates a GitHub Release for the tag. A new release uses `--verify-tag` and generated notes. Existing releases receive refreshed assets with clobber enabled. Prerelease status is derived from the packaged version.

The release assets provide a direct-download option for consumers who do not use a registry. The archive contents are still checked by `npm run pack:check` before publication.

## Package contents

The `files` allowlist in `package.json` is intentionally small:

```text
dist/
README.md
README.zh-CN.md
LICENSE
```

`package.json` is always included by npm. `scripts/check-package.mjs` verifies the expected files and rejects unexpected files, so documentation under `docs/` does not enter the npm package unless the allowlist is intentionally changed.

## Pre-release checklist

Before pushing a release tag:

1. Confirm `package.json` and `package-lock.json` have the intended version.
2. Run `npm ci` in a clean checkout, then run `npm run check` and `npm run pack:check`.
3. Inspect the dry-run archive and confirm both README files use the `zh-CN` filename.
4. Confirm the npm Trusted Publisher points to the repository and `publish.yml`.
5. Confirm the repository can write packages for the GitHub Packages workflow.
6. Push `v<version>` and inspect both Actions workflows.
7. Verify the npm package, GitHub package, archive checksums, and GitHub Release assets.
