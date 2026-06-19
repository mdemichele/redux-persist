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
npm version 6.1.0
```

This also creates a git commit (`v6.1.0`) and a signed tag (`v6.1.0`) automatically.

- [ ] Confirm `package.json` version field matches the intended release
- [ ] Confirm `LIBSIZE.md` has a new entry for this version
- [ ] Confirm `lib/`, `es/`, and `dist/` directories are present and up to date

## Push to GitHub

```bash
git push origin master
git push origin --tags
```

- [ ] Branch pushed
- [ ] Tag pushed (verify tag appears on GitHub under **Releases → Tags**)

## Publish to npm

```bash
npm publish --access public
```

- [ ] Confirm the package appears at https://www.npmjs.com/package/@mdemichele/redux-persist
- [ ] Confirm the new version is the `latest` tag (`npm info @mdemichele/redux-persist dist-tags`)

## Create a GitHub Release

1. Go to the repository on GitHub → **Releases** → **Draft a new release**
2. Select the tag `v6.1.0`
3. Set the title to `v6.1.0`
4. Paste the CHANGELOG entry for this version as the release notes
5. Publish the release

- [ ] GitHub release published and linked to the correct tag

## Post-release sanity check

- [ ] Install the new version in a scratch project and verify it works: `npm install @mdemichele/redux-persist@6.1.0`
- [ ] Update the README badge/version reference if it lists a specific version
