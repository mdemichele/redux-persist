# Release Checklist

Step-by-step process for publishing a new version of `@mdemichele/redux-persist` to npm.

---

## Pre-release

- [ ] All feature/fix branches are merged into `master`
- [ ] Working tree is clean (`git status` shows nothing uncommitted)
- [ ] On the `master` branch (`git checkout master`)
- [ ] Tests pass: `npm test`

## Update CHANGELOG

- [ ] Add a new `## [x.y.z] - YYYY-MM-DD` section at the top of `CHANGELOG.md`
- [ ] List every notable change under `Added`, `Changed`, `Fixed`, or `Removed` headers
- [ ] Commit: `git commit -m "docs: update CHANGELOG for vx.y.z"`

## Bump the version

Run npm's built-in version command. This triggers the `version` lifecycle script, which:
1. Cleans build artifacts (`npm run clean`)
2. Rebuilds all outputs (`npm run build`)
3. Appends a new size estimate line to `LIBSIZE.md` and stages it

```bash
# For a minor release:
npm version minor

# Or pin an exact version:
npm version 6.2.0
```

This also creates a git commit and a tag automatically.

- [ ] Confirm `package.json` version field matches the intended release
- [ ] Confirm `LIBSIZE.md` has a new entry for this version
- [ ] Confirm `lib/`, `es/`, and `dist/` directories are present and up to date

## Push to GitHub

Before pushing, check whether the remote has commits you don't have locally:

```bash
git fetch origin
git status
```

If the remote is ahead, rebase first — otherwise the push will be rejected:

```bash
git pull --rebase origin master
```

> **Important:** `npm version` creates a tag on the local commit. If you rebase after tagging,
> that commit gets a new hash and the tag becomes stale. Verify and re-point it before pushing:
>
> ```bash
> # Find the rebased version commit
> git log --oneline | grep <version>
>
> # Re-point the tag if the hash doesn't match
> git tag -d vX.Y.Z
> git tag vX.Y.Z <new-commit-hash>
> ```

Then push:

```bash
git push origin master
git push origin --tags
```

- [ ] Branch pushed
- [ ] Tag pushed and points to the correct version commit (verify on GitHub under **Releases → Tags**)

## Publish to npm

```bash
npm publish --access public
```

- [ ] Confirm the new version is the `latest` tag: `npm info @mdemichele/redux-persist dist-tags`

## Create a GitHub Release

```bash
gh release create vX.Y.Z --title "vX.Y.Z" --notes-file /tmp/release-notes.md
```

Or via the GitHub UI: **Releases → Draft a new release**, select the tag, paste the CHANGELOG entry as the body.

- [ ] GitHub release published and linked to the correct tag

## Post-release sanity check

Install the published version in a scratch Node project and test both module formats:

```bash
mkdir /tmp/rp-sanity && cd /tmp/rp-sanity
echo '{"name":"sanity","version":"1.0.0"}' > package.json
npm install @mdemichele/redux-persist@X.Y.Z redux
```

**Test CJS (`require`):**
```bash
node -e "const { persistReducer, persistStore } = require('@mdemichele/redux-persist'); console.log(typeof persistReducer, typeof persistStore)"
```

**Test ESM (`import`):**
```bash
node --input-type=module <<< "import { persistReducer, persistStore } from '@mdemichele/redux-persist'; console.log(typeof persistReducer, typeof persistStore)"
```

Both should print `function function`.

- [ ] CJS `require` works
- [ ] ESM `import` works
- [ ] Update the README version reference if it pins a specific version
