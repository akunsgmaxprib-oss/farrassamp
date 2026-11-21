# Security Specification — RA STORE (Farrassamp)

## 1. Data Invariants
1. **Product Ownership & Integrity**: Only verified store owner (`akunsgmaxprib@gmail.com` with `email_verified == true` or `/admins/{uid}`) may create, update, or delete `/products/{productId}`. `ownerId` and `createdAt` are immutable after creation; `createdAt` and `updatedAt` must equal `request.time`.
2. **YouTube Download Integrity**: Only verified store owner may create, edit metadata/links, or delete `/youtube_downloads/{downloadId}`. Visitors may only perform an exact `+1` increment on `downloadCount` paired with `updatedAt == request.time`.
3. **Order PII Isolation**: `/orders/{orderId}` contains customer PII (`customerName`, `customerWhatsapp`, `customerNote`). Public reads (`get` or `list`) are strictly forbidden. Only the verified store admin or an authenticated buyer whose `buyerUid == request.auth.uid` may read/list orders.
4. **Order Terminal State Locking**: Once an order reaches `Selesai` or `Dibatalkan`, only the verified store admin can modify it; buyers cannot alter order status or price after creation. Orders must start in `status == 'Menunggu'`.
5. **Path Variable Hardening**: Every single-document `get`, `create`, `update`, and `delete` operation validates `isValidId(id)` (`^[a-zA-Z0-9_-]+$`, max 128 chars).

## 2. Dirty Dozen Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated user creates a document in `/products/{id}`.
2. Authenticated non-admin user (`other@gmail.com`) creates or deletes a `/products/{id}` document.
3. Unverified-email user spoofing admin email writes to `/products/{id}`.
4. Admin creates `/products/{id}` with an extra shadow field (`isVerified: true`).
5. Admin creates `/products/{id}` with a negative `price: -5000` or oversized `title` (> 120 chars).
6. Unauthenticated user updates `downloadUrl` on `/youtube_downloads/{id}`.
7. Unauthenticated user updates `downloadCount` by `+500` instead of `+1` on `/youtube_downloads/{id}`.
8. Unauthenticated user reads (`get` or `list`) `/orders/{id}` (PII leak attempt).
9. Authenticated non-admin user lists `/orders` without matching `buyerUid == request.auth.uid`.
10. Customer creates `/orders/{id}` with `status: 'Selesai'` (status shortcutting).
11. Customer creates `/orders/{id}` with `buyerUid` spoofed to another user's UID.
12. Attacker writes to `/products/invalid..id!@#` (path ID poisoning).
