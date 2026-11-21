# Phase 3B verification

Verified on 2026-11-21. No backend, dependency, route or query-key changes.

## Automated checks

`npm run build`, `npm run lint`, `npm run format:check` and `npm test -- --run`
pass: 39 test files, 372 tests.

Coverage includes image selection/compression, the eight-image limit, concurrency
of two, URL/path pairing and response-count validation before assignment, upload
failure blocking publication, and submission retries without re-uploading successes.
Every signed-upload 4xx discards only that image's URL/path pair; network failures
and 5xx retain the pair. Only a 2xx marks an upload complete.

Edit tests cover fresh data despite cache, initialization once, retaining local
changes on refetch, owner checks including nonowner admins, existing/new/removed
images, optional fields and coordinates, confirmation, invalidation and clearing
dirty state. Owner-action tests cover confirmation/cancellation, errors/retry,
duplicate-call prevention, deletion navigation and cache invalidation. Implicit
submission before review advances the wizard rather than publishing.

## Real browser, fixture API

Headless Chrome 157 on Linux, at 320 × 568 and 1280 × 800:

- Exercised all seven create steps, Back/review editing, Arabic/Persian digit
  normalization, land restricted to sale, location selection and image processing.
- Reached review without sending an API mutation; explicit publication then
  produced signed-URL request → WebP PUT → POST, with the returned image path.
  The PUT had `Content-Type: image/webp`, `credentials: omit`, no authorization
  header and no upsert flag.
- Exercised existing-image edit, review confirmation/cancellation and PUT without
  re-uploading the existing image. Verified preserved coordinates and false/zero.
- Exercised availability confirmation and a bodyless PATCH, reflected the new
  availability, cancelled deletion without a request, then confirmed DELETE and
  reached the owner's profile.
- Inspected RTL screenshots, mobile currency controls without the former sticky
  action-bar overlap, desktop publishing entry, and no horizontal overflow at
  320px. Measured price-step input/navigation targets at 44px and choice targets
  at 56px. The mobile publishing entry remains in the existing bottom navigation.
- Verified the dirty form cancels a dispatched `beforeunload` event. Native browser
  unload-prompt presentation was not exercised. Unit tests cover listener cleanup
  and saved/untouched edit state.
- No JavaScript errors in the clean browser verification session.

The actual compression module converted synthetic 2400 × 1500 JPEG, PNG and WebP
inputs to `image/webp` at 1600 × 1000 in Chrome. Firefox, Safari and physical mobile
devices were not tested.

All authentication, signed-upload URLs, storage responses and property mutations
in these browser flows were fixtures. **A real signed Supabase upload and real
backend create/edit/delete were not verified end to end:** no authorized test
session was available. Unit tests, not live storage, establish retry behavior for
network/5xx/4xx failures.

## Production bundles

Compared the Phase 3A base and this implementation using the same dependencies
and local Vite environment. Sizes below are bytes; gzip uses Node's gzip level 9
consistently on both builds. These gzip figures are not Vite's displayed estimate.

- Original entry: 302,795 raw / 94,977 gzip.
- Current main chunk: 267,267 raw / 83,088 gzip.
- Current complete entry static-import graph, including shared Button/runtime:
  304,472 raw / 97,237 gzip. Net increase: 1,677 raw / 2,260 gzip.
- Create page wrapper: 174 → 221 raw; 178 → 180 gzip.
- Edit page wrapper: 178 → 1,108 raw; 182 → 698 gzip.
- Shared lazy wizard chunk: 29,859 raw / 9,687 gzip. The wrappers are not the whole
  route cost: they also load the shared wizard, form/validation and location chunks.

Inspected Vite's production manifest static dependency graph: neither the wizard
nor its image compressor is in the entry static-import closure. The compressor's
`createImageBitmap` implementation is in the shared lazy wizard chunk only.
