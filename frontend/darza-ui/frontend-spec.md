# DARZA FRONTEND SPEC (source of truth, agreed design)

Product: "Darza", Arabic (RTL), mobile-first real-estate listing platform for Palestine.
Anyone can register and publish (role PUBLISHER); ADMIN moderates. Every new/edited
property is PENDING until an admin approves it. Backend (Spring Boot) is hand-written;
the API contract is in the backend README.md. Stack: React + TypeScript + Vite + Tailwind,
react-router, @tanstack/react-query, react-hook-form + zod, lucide-react (icons only).
No SweetAlert, no UI library, no animation library.

## 0. Global rules
- Strictly component-based: pages only compose components (~40 lines JSX max). Layers:
  components/ui (generic), components/layout, features/<name>, pages, api, context, lib, routes.
- PERFORMANCE is a top priority (weak devices), even at the cost of animations: lazy-load
  pages, one Arabic font (Cairo 400/700, self-hosted), only simple color/opacity transitions,
  React.memo on PropertyCard, images lazy + fixed aspect-ratio. No inline styles.
- RTL: dir="rtl", Tailwind LOGICAL utilities only (ms-/me-/ps-/pe-/start-/end-).
- All colors are CSS variables named by MEANING in index.css (primary, accent, background,
  surface, text, text-muted, border, success/warning/danger + soft variants) so dark mode can
  be added later. Primary = petrol green; background = white smoke; terracotta accent
  (from the logo) used sparingly. No hex outside index.css.
- ONE page container defined in MainLayout (centered, max-width ~1100px, horizontal padding).
  Pages never define their own container. <Suspense> goes INSIDE MainLayout around <Outlet/>
  (never around the whole layout, so navbar/bottom nav don't flash).
- No breadcrumbs. Use a back arrow in the header; URLs carry state (filters, tab, step).

## 1. Navigation
- TopNavbar: logo at the START (right in RTL); guests see "تسجيل الدخول", logged-in users see
  "تسجيل الخروج". Privacy / terms / about / contact links live in the Footer (no burger menu).
- BottomNav: MOBILE ONLY, simple flat bar with active-item color (NOT the curved animated bar;
  that is postponed). Guest: Home + Login. User: Home, Create property, "حسابي".
  Admin: same + Dashboard. On md+ the same links appear in the TopNavbar.
- Route guards: ProtectedRoute, AdminRoute (isAdmin = isAuthenticated && role === "ADMIN"),
  GuestRoute; all pass `from` so the user returns after login.

## 2. Shared UI components
- Button: native <button>; `type` is the NATIVE "button" | "submit" (default "button");
  `variant` (primary FILLED petrol green | outline | ghost | danger) is visual only; loading
  and disabled states. Simple hover color change only (no slide effect).
  ButtonLink: <Link>/<a> styled as a button, used for navigation and WhatsApp/call.
- FormField (label + control + error + hint), Input, PasswordInput, Select (native <select>,
  options {value,label}, onChange returns the value, error prop).
- ConfirmModal on native <dialog> (no SweetAlert): used for delete account (irreversible
  warning: deletes everything including all properties), delete property, approve, etc.
  Has a children slot (e.g. rejection-reason textarea).
- Toast (minimal), Spinner, Skeleton, EmptyState, ErrorMessage.
- PhoneInput (see section 8).

## 3. Property card (ONE component for feed, search, profiles, my-properties, admin)
Props: PropertyCardResponse (+ optional `actions` slot). The card NEVER checks the user's
role; role-specific UI is injected through `actions` (admin: ModerationBar; owner:
OwnerActions = edit / delete / toggle availability).
Inner components: CardImage, CardTags, CardFooter. Whole card navigates to /properties/:id
(stretched-link pattern, no nested <a>).
- Cover image: top ~2/3 of the card, fixed aspect-ratio, loading="lazy".
- Property type badge: top-left corner of the image. Posting status badge (Arabic:
  قيد المراجعة / مقبول / مرفوض, color per status): top-right corner, shown ONLY when
  postingStatus exists in the response (owner/admin views).
- Under the image: tags in petrol green with semi-transparent background: listing type
  (بيع / إيجار) + rent period tag if RENT. Then the title. Then light-grey/white tags:
  rooms, bathrooms, area (only those present). Town + city shown.
- Footer: price + currency in green at the left, "عرض التفاصيل" button at the right.
- PublisherInfo component (avatar + name, name links to /users/:id) used in the card.
- If isAvailable is false: clear "غير متاح" badge.
- Overlay (pointer-events: none): REJECTED = light red layer (5-10% opacity), PENDING =
  grey layer, APPROVED = none.

## 4. Home / Feed
- Always-visible search bar next to a "Filters" button. Filters button opens a modal with all
  filters (propertyType, listingType, min/max price + currency [currency required when price
  is set], city/town, sortType) and an "Apply" Button.
- A bar beside the filters button shows badges of applied filters and an X that clears all.
- Filters live in the URL query. One hook (usePropertyFeed): no filters => GET /feed,
  otherwise GET /search. "Has filters" ignores empty values; sortType counts as a filter;
  currency alone does not.
- useInfiniteQuery, key ["properties", filters]; pages start at 0, use hasNext.
- INFINITE SCROLL via IntersectionObserver sentinel (rootMargin ~600px), NO "load more"
  button. When hasNext=false show "تم مشاهدة جميع العقارات المتاحة" at the end.

## 5. Property details page
- Image gallery, full details, PublisherInfo. Two SEPARATE components, WhatsAppButton
  ("التواصل على واتساب") and CallButton ("الاتصال بالمعلن"), each containing its own logic
  using the publisher's phone (toWhatsAppUrl/toTelUrl). The phone number is NEVER displayed.
- Posting status and rejection reason are shown only when present in the response (owner or
  admin). Rejection reason: burgundy, slightly transparent banner at the top of the details.
- If the viewer is admin and the property is PENDING, render ModerationBar (same component
  the card uses): Reject (modal with required reason, max 300 chars) and Approve (ConfirmModal).
  After moderating from details, go back to the admin tab that was open and invalidate queries.

## 6. Create / Edit property (one PropertyWizard component, mode="create" | "edit")
6 steps, never one big form. Each step has a lucide icon + short explanatory Arabic text.
 1. Basics: property type as selectable cards; listing type; rent period (only for RENT).
 2. Location: city + town selects, optional address text. (Map is POSTPONED.)
 3. Details: area, rooms, bathrooms, furnished, balcony. For LAND: area only.
 4. Images: 1-8; signed-URL flow (GET /api/storage/upload?count&type=PROPERTY, upload
    directly, send returned paths); compress/convert to webp client-side before upload.
 5. Title (required) + description (optional) + price + currency.
 6. Review and submit.
- Back/Next use Button. A progress map at the bottom: passed stations colored, others grey.
  CREATE: user can jump back or to completed steps only. EDIT: all stations colored and open.
- Step number lives in the URL (?step=3); wizard state in one reducer/context.
- Edit shows a warning before saving ("تعديل العقار سيعيده للمراجعة ولن يظهر للزوار حتى
  الموافقة") and after saving "تم إرسال تعديلك للمراجعة". After create: "عقارك قيد المراجعة".
- Forms: react-hook-form + zod, schemas in separate files mirroring the README rules.

## 7. Profile, account, my properties
- /users/:id is the single profile route: if id === logged-in userId show the personal view
  (or redirect to /profile), otherwise the public view. Layout is simple: header (avatar, name,
  town, joined date) + the user's PropertyCards with infinite scroll.
- Personal view adds a Settings entry: edit account, delete account (ConfirmModal). Delete
  account is HIDDEN for admins (API requires PUBLISHER).
- Edit account: Instagram-style form: avatar centered on top, pre-filled fields below, Save and
  Cancel at the bottom. "Remove photo" removes it LOCALLY only. On Save: new profileImagePath
  => PUT only. Image removed and no new one => PUT then DELETE /api/users/me/profile/image
  SEQUENTIALLY (never in parallel). PUT with null path = no change.
- /my-properties: infinite list of PropertyCards with status + OwnerActions.

## 8. Phone number
- PhoneInput = code Select (+970 / +972) + digits-only field. Stored and sent value is
  "+{code}{9 digits}" exactly as the user chose (WhatsApp treats +970 and +972 as different
  accounts). Israeli prefixes (50,52,53,54,55,58) force +972; prefixes 56/59 require the user
  to choose a code (NO default, validation error if empty). Hint under the field:
  "اكتب رقمك مثل ما هو مسجّل في واتساب". Pasting a full number splits the code automatically.
  Used in register and edit account. Mobile numbers only.

## 9. Auth, session, API
- Login (email + password) and Register (displayName, email, password, PhoneInput, city->town
  selects, optional address) in AuthLayout; backend `fieldErrors` mapped onto form fields.
  No Forgot Password yet (backend not built).
- AuthStorage class is the only code touching localStorage. AuthContext initializes
  synchronously and drops an expired session. logout is idempotent and STABLE (navigate and
  toast through refs); the expired-session message shows once. Auto-logout timer on expiresAt
  plus a re-check on visibilitychange/focus.
- API client: ApiError class; ONE response handler (read res.text(), empty bodies allowed);
  token sent on every request including public ones. onUnauthorized fires only for 401 AND a
  token was sent AND it is still the current token AND the path is not /api/auth/**.
  403 never logs out.

## 10. Admin
- /admin: tabs Pending and Rejected only (no Approved tab; admins use the feed). Tabs are
  sticky and the PAGE scrolls (no nested scroll container). Active tab in the URL (?tab=).
  Pending cards carry ModerationBar; rejected cards show the rejection reason.
- /admin/locations: manage cities and towns (create/update/delete).

## 11. Explicitly postponed
Map picker, curved animated bottom bar, Forgot Password, removeProfileImage flag in the API,
orphan-image cleanup, feed virtualization, breadcrumbs.

## Implementation clarifications
- Select keeps the native change event (react-hook-form register compatibility).
- The first card's image is eager (LCP), all others lazy.
- Login/Register use AuthCard as the auth layout.
- Kept extras: ShareButton, Google Maps link when coordinates exist, auto-login after register.
- Feed error state keeps a retry button.
