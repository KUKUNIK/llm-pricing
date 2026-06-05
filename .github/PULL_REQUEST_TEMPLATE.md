<!-- Short PR description — what changes and why. -->

## What

## Why

## Verification

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] For catalog changes, the **source URL** is in the diff (or the
      catalog entry's `source` field) so the price is auditable
- [ ] For catalog changes, the `asOf` date is updated to the day you
      checked the source
- [ ] If a public CLI flag or library type changed, README.md and
      CHANGELOG.md were updated

## Notes for reviewer

<!-- Anything to eyeball: rounding, currency handling, cache-input
     vs cache-write semantics for a vendor, etc. -->
