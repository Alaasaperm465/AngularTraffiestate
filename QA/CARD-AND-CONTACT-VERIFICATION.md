Checklist: Card spacing, contact icons and view button

✅ What I changed
- Standardized card spacing/padding/margins via global styles in `src/styles.css`.
- Added `email` contact anchors and `aria-label` attributes to property cards in `home`, `buy`, and `rent` components.
- Ensured "View" button exists and routes to `/property/:id` in `buy`, `rent`, `home`, and `favorites` pages.
- Fixed owner dashboard `viewPropertyDetails()` to navigate to `/property/:id`.

🧪 Manual verification steps
1. Start the dev server: `npm run start` and open the app (http://localhost:53472).
2. Home / Buy / Rent pages:
   - Check multiple property cards: spacing between cards should be consistent, padding inside card is 1rem.
   - Contact icons: WhatsApp (opens new tab), Call (tel:), Email (mailto:) should work and have visible icon/text.
   - View button should navigate to the property details page for that item.
3. Favorites page:
   - Each card should show Call/Email/WhatsApp and a "View" button that navigates to details.
4. Owner Dashboard:
   - Click "عرض" (View) on any property and ensure it opens the property details page.
5. Property Details page:
   - WhatsApp / Call buttons should open appropriate apps (WhatsApp/GSM/email compose).

⚠️ Notes / Known issues
- I did not change color variables. If you find any visual anomalies, tell me which page and I'll tweak spacing for that component specifically.

If you'd like, I can add small automated visual snapshots using Cypress/Playwright later. Let me know.