# Cooperative KYC Verification & Approval System

A React + TypeScript web application for cooperative member KYC onboarding, SMS/OTP verification, manager review and approval, and official KYM printing. Built for Nepal cooperatives and available in English and Nepali.

## Features

- Member portal: invite-code entry, OTP verification, multi-step KYC form (general details, address, document uploads).
- Manager portal: dashboard with KPIs and fiscal-year filtering, member management (manual + CSV import), offline KYC entry, submission review, approval/rejection, signature and thumbprint verification, KYM printing and reprinting.
- Organization settings: name, registration/PAN, address, contact, logo, cooperative type.
- CSV export of filtered submissions.
- Demonstration sandbox with seeded members and sample documents.
- Client-side persistence via browser `localStorage` (no backend required).

## Tech Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- lucide-react

## Getting Started

Prerequisites: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Production build:

```bash
npm run build
npm run preview
```

## Demo Access

- Manager login: `manager@demo.com` / `Manager@123`
- Member login: invite code `ABC123`, OTP `123456`
- Additional demo members and invite codes are listed on the landing page.

## Project Structure

```text
src/
  components/   Shared UI components
  config/       Demo data, defaults, KYC options
  lib/          State store, routing, i18n, types, utilities
  pages/
    admin/      Manager portal pages
    member/     Member KYC flow
    print/      KYM print view
```

## Data & Persistence

Application state is stored in the browser under `localStorage` key `coop-kyc-state-v7`. Clearing browser storage resets the app to the seeded demo data.
