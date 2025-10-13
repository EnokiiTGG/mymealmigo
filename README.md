# MyMealMigo (Web) — README

A Next.js app for MyMealMigo with **staff-only authentication**, an **Admin CMS**, and a **Nutritionist workspace** for chat reviews and recipe validation.

---

## ✨ What’s in this build

- **Public site**
  - Hero, Features, How It Works, Testimonials, **Download** section
  - **Pricing is display-only** (no purchase/upgrade flows)
  - **No user signup/profile** pages
  - **Calculators** page (guest mode banner removed)

- **Auth**
  - **Staff only** can log in (no guest accounts)
  - Roles: `admin`, `nutritionist` (stored in `users/{uid}.role`)
  - Navbar shows **Admin/Nutritionist Dashboard** when logged in
  - Navbar & admin/nutritionist headers show **Logout**
  - Footer has a **Staff** column with *Staff login* (logged out) and links to dashboards (logged in)

- **Admin Area** (`/admin/*`)
  - Dashboard, Content Editor, Users, Recipes, Settings
  - Header logout button (top-right)

- **Nutritionist Area** (`/nutritionist/*`)
  - **Dashboard** (KPIs: Open Chats, Pending Recipes)
  - **Chats**: list & reply to open chats; mark resolved
  - **Recipes**: validate/approve/reject recipes with notes
  - Header logout button (top-right)

- **Data**
  - Firebase Auth + Firestore
  - Firestore security rules configured for staff roles and collections
  - Suggested indexes for chats lists

---

## 🗂️ Project structure (key parts)

```
src/
  app/
    page.tsx                 # Home (no quiz CTA)
    calculators/page.tsx     # Guest banner removed
    login/page.tsx           # Staff login (admin + nutritionist)
    admin/
      layout.tsx             # Sidebar + header w/ Logout
      ...                    # Admin pages
    nutritionist/
      layout.tsx             # Sidebar + header w/ Logout
      dashboard/page.tsx
      chats/page.tsx
      chats/[chatId]/page.tsx
      recipes/page.tsx
  components/
    navbar.tsx               # Shows dashboards + Logout (if signed in)
    admin-sidebar.tsx
    ...
  context/
    AuthContext.tsx          # exposes { user, isAdmin, isNutritionist, loading }
  lib/
    firebase.ts              # Firebase init (client/server helpers)
```

---

## 🔧 Setup

### 1) Requirements
- Node 18+
- Yarn or npm
- Firebase project (Auth + Firestore)

### 2) Environment

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxx
```

> If you have separate admin SDK/server keys **don’t** put them in client env; this app uses client SDK only.

### 3) Install & Run

```bash
# install
npm install
# or: yarn

# dev
npm run dev
# build
npm run build
npm start
```

---

## 👤 Creating staff accounts

1. In **Firebase Auth**, create a user (email/password).
2. In **Firestore**, create `users/{uid}` with:
   ```json
   {
     "role": "admin"          // or "nutritionist"
   }
   ```
3. Sign in at `/login`.

> Email verification is **skipped for staff** (admins & nutritionists). Non-staff are blocked entirely.

---

## 🔐 Firestore rules (overview)

- **Staff** = `admin` or `nutritionist`
- **Users**
  - Users can read/update limited fields on **themselves**; cannot set role to `admin`/`nutritionist`
  - Admin can read/write all
- **Chats**
  - Staff can list/read all open chats
  - Users can read/write **their own** chat/messages
  - Nutritionists can update operational chat fields: `status`, `consultRequested`, `assignedTo`, `lastMessageAt`, and post messages with `sender:"nutritionist"`
- **Recipes**
  - Nutritionists can update validation fields only: `status` (`approved`/`rejected`), `validatedBy`, `validatedAt`, `validationNotes`
  - Admin full write

> Put the full rules from your `firestore.rules` file (the version we discussed) into your Firebase rules console and publish.

### Suggested indexes (Firestore → Indexes)
- For chats list (example):
  - Collection: `chats`
  - Fields: `status ASC, lastMessageAt DESC`

---

## 💬 Chat model (suggested)

```
chats/{chatId}
  userId            string (owner)
  status            "open" | "resolved"
  consultRequested  boolean
  assignedTo        nutritionistUid | null
  lastMessageAt     timestamp
  createdAt         timestamp

chats/{chatId}/messages/{messageId}
  sender            "user" | "ai" | "nutritionist"
  text              string
  createdAt         timestamp
```

Users can toggle “Request nutritionist” (sets `consultRequested=true`). Nutritionists see those in their **Chats** page and can reply as `sender:"nutritionist"`.

---

## 🧩 Feature toggles / notable removals

- **Removed**: guest sign-up, guest login, profile customization UI
- **Pricing**: display only (no CTA to sign up/upgrade)
- **Quiz CTA**: removed Male/Female hero buttons
- **Calculators**: guest banner (create account/log in) removed

---

## 🧠 Components touched (quick diff map)

- `src/app/page.tsx`
  - Remove `<Hero>` children (quiz CTAs), keep self-closing `<Hero />`
  - Keep `<Pricing plans={pricing} hideButtons />`

- `src/components/navbar.tsx`
  - Show **Admin Dashboard** / **Nutritionist Dashboard** links when logged in
  - Show **Logout** button in the same row (and mobile drawer)

- `src/components/LayoutWrapper.tsx`
  - Footer now has **Staff** column with Staff login / dashboards / logout
  - Footer hidden on `/admin/*` and `/nutritionist/*`

- `src/app/login/page.tsx`
  - Allow `admin` → `/admin/dashboard`
  - Allow `nutritionist` → `/nutritionist/dashboard`
  - Block all others (sign out + error)

- `src/context/AuthContext.tsx`
  - Exposes `isAdmin` and `isNutritionist`

- `src/app/admin/layout.tsx` & `src/app/nutritionist/layout.tsx`
  - Sidebar + header
  - **Logout** button in top header (same placement)

---

## 🚀 Deployment

Any Next.js friendly host will work (Vercel recommended).

1. Set env vars in your hosting provider.
2. Build: `npm run build`
3. Deploy output
4. Configure Firebase authorized domains to include your production URL

---

## 🧪 Smoke test checklist

- Home loads, **no quiz buttons** in hero.
- **Pricing** shows but no signup/upgrade flow.
- **Footer** shows **Staff login** when logged out; shows **Admin/Nutritionist Dashboard** + **Logout** when logged in.
- `/login` allows only admin/nutritionist; redirects by role.
- `/admin/dashboard` loads for admin; **top-right Logout** works.
- `/nutritionist/dashboard` loads for nutritionist; **top-right Logout** works.
- `/nutritionist/chats` lists open chats; can open a chat and send a `nutritionist` message; resolve a chat.
- `/nutritionist/recipes` lists pending recipes; can approve/reject with notes.
- Firestore rules block non-staff access to staff-only data.

---

## 🛠 Troubleshooting

- **403 / permission-denied**  
  Confirm Firestore rules are published and the user’s `role` is set correctly in `users/{uid}`.

- **Nutritionist doesn’t see dashboard**  
  Ensure `AuthContext` is returning `isNutritionist: true` (role is lowercase `"nutritionist"` in Firestore).

- **Chats list empty**  
  Make sure documents in `chats` have `status: "open"` and `lastMessageAt` set; create the index if prompted by Firebase console.

---

## License

Proprietary — MyMealMigo. All rights reserved.
