# Versioning and Release System

This document describes the versioning and release system introduced to ASOP Studio.

## Overview

The project uses Conventional Commits (e.g., `feat: ...`, `fix: ...`) to automate version management, changelog generation, and tagging.

We use [`commit-and-tag-version`](https://www.npmjs.com/package/commit-and-tag-version), the official and actively maintained successor/fork of `standard-version`.

## Commands

Two scripts are registered in `package.json` to handle releases:

1. **Dry Run (Preview changes)**:
   ```bash
   npm run release:dry-run
   ```
   This command inspects git commits, determines the next semantic version, outputs the proposed additions to `CHANGELOG.md`, and prints out what files will be updated without actually writing any changes or making commits/tags.

2. **Real Release (Perform bump, commit, tag)**:
   ```bash
   npm run release
   ```
   This command will:
   * Bump the version in `package.json` and `package-lock.json`.
   * Update `CHANGELOG.md` with release notes compiled from the conventional commit messages.
   * Make a git commit with the message `chore(release): vX.Y.Z`.
   * Create a local git tag `vX.Y.Z`.
   * Log instructions to push the commits and tags to origin (e.g., `git push --follow-tags origin main`).

## Configuration

The versioning behavior is customized using [`.versionrc.json`](../.versionrc.json) at the root of the project. 

Specifically, this configuration ensures that `refactor` type commits are not hidden and are displayed under a dedicated **Refactoring** section in the generated `CHANGELOG.md` files:

```json
{
  "types": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "refactor", "section": "Refactoring" },
    { "type": "perf", "section": "Performance Improvements" },
    { "type": "chore", "hidden": true },
    { "type": "docs", "hidden": true },
    { "type": "style", "hidden": true },
    { "type": "test", "hidden": true }
  ]
}
```

## Automatic UI Version Display

The frontend UI dynamically displays the correct version number from `package.json`:

1. **Vite Injection**: In `vite.config.ts`, `package.json` is read at build/dev-server launch time, and the version field is exposed as a global compiler constant `__APP_VERSION__` via Vite's `define` option.
2. **TypeScript Declaration**: In `src/client/App.tsx`, we declare `declare const __APP_VERSION__: string;` at the top of the file.
3. **UI Element**: The app header renders `v{__APP_VERSION__}` in the brand badge dynamically.
