<div align="center">
  <img src="src/assets/carvver_icon.png" alt="Carvver icon" width="112" />

  <h1>Carvver</h1>

  <p><strong>Carve With What You Love</strong></p>

  <p>
    A product-first web platform for Filipino hobbyists, handmade-product makers,
    and casual freelancers who need a clearer way to get discovered and booked.
  </p>

  <p>
    <img alt="React" src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
    <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=FFD62E" />
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=ffffff" />
    <img alt="Framer Motion" src="https://img.shields.io/badge/Framer_Motion-Animation-0055FF?style=for-the-badge&logo=framer&logoColor=ffffff" />
    <img alt="React Router" src="https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=reactrouter&logoColor=ffffff" />
    <img alt="PayMongo" src="https://img.shields.io/badge/PayMongo-Escrow_Flow-6B46C1?style=for-the-badge" />
  </p>
</div>

> Carvver began as a concept paper for STI College Las Pinas and is represented here as a working React + Supabase product build with a strong customer-facing experience, public brand pages, and escrow-oriented checkout flows.

## Table of Contents

- [What Carvver Is](#what-carvver-is)
- [Why It Exists](#why-it-exists)
- [Core Features](#core-features)
- [User Experience Split](#user-experience-split)
- [Tech Stack](#tech-stack)
- [App Structure and Main Routes](#app-structure-and-main-routes)
- [Local Setup](#local-setup)
- [Supabase and PayMongo Notes](#supabase-and-paymongo-notes)
- [Founding Team](#founding-team)
- [Project Background](#project-background)

## What Carvver Is

Carvver is a discovery and transaction platform designed around people who are often underserved by larger, more competitive marketplaces:

- Filipino hobbyists offering handmade products
- casual freelancers taking small, occasional service requests
- customers who want a calmer, more trustworthy way to discover and book them

The product direction comes from a simple idea: people should not need to jump across multiple social platforms just to find a creator, compare trust signals, and complete a service transaction safely.

## Why It Exists

Carvver is shaped by a few core beliefs from the concept paper:

- discovery should feel clearer than scattered social-media searching
- trust should come from visible signals such as profiles, reviews, badges, and verification
- growth should feel rewarding without forcing people into leaderboard-style competition
- creators should have better visibility, while customers should get safer and more understandable transactions

That is why the product language centers on:

- achievements and badges over public ranking pressure
- verified and trust-oriented signals
- location-aware service discovery
- few-click promotion ideas for creator visibility
- escrow-backed payment handling to reduce scam risk

## Core Features

The repository currently represents these product surfaces:

| Area | What is currently in the repo |
| --- | --- |
| Public brand site | Homepage, About Us, and Community pages with motion-heavy marketing sections |
| Authentication | Sign in, sign up, social auth callback flow, and public-only route guards |
| Customer dashboard | Dedicated customer landing page and protected dashboard shell |
| Service discovery | Browse services, category filtering, trust-related filters, and location-aware UI |
| Saved flow | Saved listings page for bookmarked services |
| Cart and checkout | Shared cart state, PayMongo checkout initiation, and escrow-oriented flow |
| Orders | Customer orders page with real order-status views |
| Notifications | Notification center plus bell popup state |
| Profile system | Customer profile editing, achievements, badges, and showcase slots |
| Community capture | Newsletter/waitlist style email capture on public and dashboard surfaces |

### Product themes reflected in the app

- **Escrow-oriented checkout**: customer payments are modeled to be held first, then reconciled through Supabase + PayMongo functions.
- **Trust-first discovery**: the UX leans on reviews, badges, saved items, profile depth, and cleaner browsing patterns.
- **Reward without forced competition**: achievements and badges are used as progress markers instead of leaderboard pressure.

## User Experience Split

Carvver is meant to serve both customers and service providers, but the current repo is strongest on the customer-facing side.

| Audience | Current emphasis in this repo |
| --- | --- |
| Customers | Browse services, save listings, add to cart, check out, review orders, manage notifications, and maintain a richer customer profile |
| Service providers | Reflected in the product narrative and concept direction through badges, visibility, verification, and few-click posting ideas, but not yet represented as a full provider dashboard path in this build |

That split is intentional to document honestly: the concept paper is broader, while the implemented app currently leans into the customer journey and shared brand/product storytelling.

## Tech Stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, Vite 7 |
| Routing | React Router 7 |
| Motion and UI feel | Framer Motion, Lucide React, React Hot Toast |
| Backend and auth | Supabase |
| Mapping | Leaflet, React Leaflet |
| Payment flow | PayMongo via Supabase Edge Functions |
| Utilities | `clsx`, `class-variance-authority`, `tailwind-merge` |

## App Structure and Main Routes

### Main routes

| Route | Purpose |
| --- | --- |
| `/` | Public homepage |
| `/about-us` | Public About Us page |
| `/community` | Public community/waitlist page |
| `/sign-in` | Public sign-in page |
| `/sign-up` | Public sign-up page |
| `/auth/callback` | Social auth callback handler |
| `/dashboard/customer` | Customer dashboard home |
| `/dashboard/customer/about-us` | Dashboard-accessible About Us view |
| `/dashboard/customer/browse-services` | Service browsing page |
| `/dashboard/customer/saved` | Saved/bookmarked listings |
| `/dashboard/customer/cart` | Customer cart and checkout summary |
| `/dashboard/customer/notifications` | Notification center |
| `/dashboard/customer/profile` | Customer profile |
| `/dashboard/customer/profile/achievements` | Achievement and badge browser |
| `/dashboard/customer/orders` | Customer orders page |

### Component organization

```text
src/
  components/
    Auth/
      pages/
    Backend/
    Dashboard/
      hooks/
      layout/
      pages/
      shared/
    Homepage/
      layout/
      pages/
      sections/
    StartUp/
      pages/
      shared/
  lib/
  assets/
supabase/
  functions/
```

## Local Setup

```bash
npm install
npm run dev
```

To build for production:

```bash
npm run build
```

<details>
  <summary><strong>Environment variables</strong></summary>

Create a local `.env.local` with the frontend Supabase values:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

These are used by the React app for auth, profile data, cart state, notifications, and public waitlist forms.

</details>

<details>
  <summary><strong>What you need enabled for the app to feel complete</strong></summary>

- Supabase project with the required tables and policies already applied
- `newsletter_signups` table for homepage, community, and Carvver Pro waitlist capture
- customer profile and achievement tables for the profile system
- cart and checkout tables for the PayMongo flow
- optional social auth providers configured in Supabase if you want OAuth sign-in/sign-up

</details>

## Supabase and PayMongo Notes

Carvver uses Supabase both as application backend and as the execution layer for payment functions.

### Current payment architecture

- checkout initiation is handled through `supabase/functions/create-paymongo-checkout`
- webhook reconciliation is handled through `supabase/functions/paymongo-webhook`
- the current implementation uses a **5% platform fee** internally
- the customer-facing flow is presented as **escrow-oriented**, with payment held first and order records created from confirmed checkout events

<details>
  <summary><strong>Edge Function secrets</strong></summary>

The payment functions expect secrets like:

```bash
PAYMONGO_SECRET_KEY
PAYMONGO_WEBHOOK_SECRET
APP_BASE_URL
```

Supabase also provides the standard service-role and project environment values required by the functions at deploy/runtime.

</details>

<details>
  <summary><strong>Why the README says Supabase instead of Firebase</strong></summary>

The concept paper originally described Firebase in the backend discussion, but the live repo is built around Supabase and Supabase Edge Functions. This README follows the actual codebase, not the older draft implementation language.

</details>

## Founding Team

The About Us and founder presentation in the app align with the concept-paper team:

| Name | Role |
| --- | --- |
| Carl Edray N. Cardinal | Founder & CEO |
| Shaira Brillantes | Co-founder & Chief Product Officer |
| Geoff Montua | Co-founder & Chief Technology Officer |
| Angelo Nollano | Co-founder & Chief Operations Officer |
| Jhoanis Paulo Zuniga | Co-founder & Chief Growth & Marketing Officer |
| Mark Caraballe | Co-founder & Community Partnerships Lead |

## Project Background

Carvver was developed from a concept paper presented to the faculty of **STI College Las Pinas** in partial fulfillment of the course **Entrepreneurial Mind** for:

- **BSIT - 221**
- **2nd Year - 2nd Term**
- **February 2026**

The concept paper positioned Carvver as a startup-focused platform for:

- skilled hobbyists with handmade products
- casual freelancers with small-scale service offerings
- local Filipino customers looking for a safer, more discoverable service marketplace

This repository reflects that concept as an evolving product build rather than just a static academic submission.

---

<div align="center">
  <strong>Carvver</strong><br />
  Built around trust, visibility, and safer creator-to-customer transactions.
</div>
