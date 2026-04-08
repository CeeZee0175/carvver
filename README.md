<div align="center">
  <img src="src/assets/carvver_icon.png" alt="Carvver icon" width="112" />

  <h1>Carvver</h1>

  <p><strong>Carve With What You Love</strong></p>

  <p>
    Carvver is a platform we created for Filipino hobbyists who offer handmade
    products, casual freelancers, and consumers who want to find their services
    more easily.
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

> Our goal is simple: to give them a dedicated platform where customers can easily
> find their services without having the need to go through multiple social media
> platforms.

## Table of Contents

- [Product Description](#product-description)
- [Product Features](#product-features)
- [Customer Benefits](#customer-benefits)
- [Unique Selling Proposition](#unique-selling-proposition)
- [App Routes](#app-routes)
- [Local Setup](#local-setup)
- [Supabase and PayMongo Setup Notes](#supabase-and-paymongo-setup-notes)
- [Founding Team](#founding-team)
- [Project Background](#project-background)

## Product Description

Carvver is a platform we created to help Filipino hobbyists who offer handmade
products or creative services, together with independent freelancers who take
small service requests, get discovered by consumers more easily.

Our goal is simple, which is to give them a dedicated platform where customers
can easily find their services without having the need to go through multiple
social media platforms.

Since we mostly cater to independent hobbyists and casual freelancers, our
platform avoids competitive features such as leaderboards. Because of that, we
grant badges and achievements instead to commemorate completed work and
milestones. This makes the experience feel rewarding without turning it into a
constant competition.

Carvver also has dedicated sections for customers looking for services and
individuals offering services. In this repository, the customer side is the one
that is more complete right now, while some service-provider ideas from the
concept paper are still shown through the product direction, the public pages,
and the platform language.

## Product Features

These are the main features we added around the concept of Carvver.

| Feature | Description | Current repo state |
| --- | --- | --- |
| Location Services | Consumers have the option to look for service providers near them. This helps customers find nearby providers more quickly. | Reflected through browse and discovery flows with location-aware UI and filtering ideas. |
| Achievements and Badges | Instead of using leaderboards, we added achievements and badges to recognize progress and milestones. | Implemented strongly on the customer profile side, with achievements, badges, and showcase slots. |
| Verified Badges | Verified signals help customers feel more at ease when choosing a provider. | Reflected in trust filters, profile language, and product direction in the app. |
| Few-Click Posting | We wanted service providers to have a simpler way to share their listings across platforms. | Still mainly represented as a product direction and brand idea, not yet a full posting workflow in this repo. |
| Escrow / Secured Transactions | We added an escrow-style payment idea so payments are held first before the order is pushed through completely. | Implemented through the cart, checkout flow, Supabase Edge Functions, and PayMongo webhook handling. |

## Customer Benefits

### Benefits for Service Providers

- Build credibility over time through badges, achievements, and verified signals.
- Gain a clearer place to show services instead of handling everything across many platforms.
- Promote services more easily through the few-click posting direction of the platform.
- Communicate more clearly with customers inside a platform built for that relationship.

### Benefits for Customers

- Find services more quickly without going through multiple social media platforms.
- Use clearer trust signals such as reviews, profiles, saved listings, and badge-based progress.
- Manage saved listings, cart items, notifications, orders, and profile activity in one place.
- Benefit from an escrow-oriented payment flow that is meant to make transactions safer and refunds easier to handle when needed.

## Unique Selling Proposition

What makes Carvver different is how we simplify discovery for customers while
also trying to make visibility better for hobbyists and casual freelancers.

For service providers, the platform direction focuses on giving them a space
where they can build credibility, get discovered more easily, and eventually
share their listings with fewer steps. For customers, the platform focuses on
safer transactions, easier browsing, and clearer trust signals when choosing
who to book.

Instead of building the platform around leaderboards and pressure, we focused on
badges, achievements, verified signals, and an escrow-oriented payment flow.

## App Routes

These are the main routes currently present in the application.

### Main routes

| Route | Purpose |
| --- | --- |
| `/` | Public homepage |
| `/about-us` | Public About Us page |
| `/community` | Public community page |
| `/sign-in` | Public sign-in page |
| `/sign-up` | Public sign-up page |
| `/auth/callback` | Social auth callback handler |
| `/dashboard/customer` | Customer dashboard home |
| `/dashboard/customer/about-us` | Dashboard-accessible About Us page |
| `/dashboard/customer/browse-services` | Browse services page |
| `/dashboard/customer/saved` | Saved listings page |
| `/dashboard/customer/cart` | Customer cart and checkout page |
| `/dashboard/customer/notifications` | Notifications page |
| `/dashboard/customer/profile` | Customer profile page |
| `/dashboard/customer/profile/achievements` | Achievement and badge page |
| `/dashboard/customer/orders` | Customer orders page |

## Local Setup

```bash
npm install
npm run dev
```

To build the project:

```bash
npm run build
```

<details>
  <summary><strong>Before running locally</strong></summary>

This project depends on Supabase configuration in your local environment. It
also expects the needed tables, policies, and product features to already be
set up on the Supabase side before the full experience can work properly.

</details>

## Supabase and PayMongo Setup Notes

Carvver uses Supabase for authentication, profile data, saved listings, cart
data, orders, notifications, achievements, and other platform features.

For payments, the project uses Supabase Edge Functions together with PayMongo.
The current checkout flow is modeled as escrow-oriented, where payment is held
first and then reconciled through the checkout and webhook flow.

The current implementation also applies a 5% platform fee internally.

<details>
  <summary><strong>What still needs to be configured outside the repo</strong></summary>

- Supabase project setup
- required tables and policies
- social auth provider setup if OAuth is needed
- deployed Edge Functions for checkout and webhook handling
- deployment-side payment configuration for PayMongo

</details>

<details>
  <summary><strong>Why this README mentions Supabase</strong></summary>

The concept paper mentioned Firebase in part of the backend discussion, but the
current repository uses Supabase. This README follows what is actually present
in the codebase now.

</details>

## Founding Team

The founder section in the app follows the same team from the concept paper.

| Name | Role |
| --- | --- |
| Carl Edray N. Cardinal | Founder & CEO |
| Shaira Brillantes | Co-founder & Chief Product Officer |
| Geoff Montua | Co-founder & Chief Technology Officer |
| Angelo Nollano | Co-founder & Chief Operations Officer |
| Jhoanis Paulo Zuniga | Co-founder & Chief Growth & Marketing Officer |
| Mark Caraballe | Co-founder & Community Partnerships Lead |

## Project Background

Carvver started as a concept paper presented to the faculty of **STI College
Las Pinas** in partial fulfillment of the course **Entrepreneurial Mind**.

The idea behind it was to create a platform for:

- Filipino hobbyists with handmade products
- casual freelancers with small-scale service offerings
- consumers who want a safer and easier way to find these services

This repository shows that idea as an actual web application with public brand
pages, customer flows, profile systems, community pages, and checkout-related
logic already in place.

---

<div align="center">
  <strong>Carvver</strong><br />
  A platform we created so creators and customers can connect more easily.
</div>
