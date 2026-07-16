# Roadmap

This document tracks the current status of the project and planned work. It is updated as priorities evolve — open a [discussion](https://github.com/water-credits/water-credits-frontend/discussions) if you want to propose changes or reprioritise.

---

## Current Status — Beta

The frontend is in active development. Core modules are functional against the testnet backend. The app is **not yet production-ready** — see known limitations below.

---

## ✅ Completed

### Foundation
- [x] Angular 21 project scaffold with standalone components
- [x] NgRx store (auth, projects, sensors, credits, marketplace, wallet, ui)
- [x] Tailwind CSS + SCSS design system (dark-mode first)
- [x] Routing with lazy-loaded feature modules and role guards
- [x] Freighter wallet integration (connect, sign challenge, sign transaction)
- [x] JWT authentication flow
- [x] WebSocket service (Socket.IO) with reconnection logic
- [x] ESLint + Prettier + commitlint + Husky pre-commit hooks

### Feature Modules (scaffold)
- [x] Dashboard — stats cards, projects map widget, recent retirements widget
- [x] Projects — list, detail, registration wizard
- [x] Sensors — real-time dashboard, historical charts
- [x] Credits — portfolio view, credit detail
- [x] Marketplace — listings, order book, create listing
- [x] Retirement — wizard, certificate view
- [x] Farmers Portal — parcel registration, practice enrollment, earnings
- [x] Governance — proposals list, detail, create form
- [x] Admin Panel — oracle management, fee config, user management

### Shared Components
- [x] Header, Sidebar, WalletConnect
- [x] DataTable, SensorChart, CreditCard, MapView
- [x] LoadingSpinner, EmptyState, ConfirmDialog, StatusBadge
- [x] SearchInput, FilterPanel, PaginationControls
- [x] RetireCreditsModal

---

## 🚧 In Progress

- [ ] **Wire up API calls** — replace mock/stub data with real backend integration across all feature modules
- [ ] **NgRx Effects** — implement HTTP effects for all store slices
- [ ] **WebSocket live data** — connect real-time sensor readings to the sensor dashboard and dashboard widgets
- [ ] **Stellar transaction signing** — complete the retire-credits and marketplace buy/sell transaction flows
- [ ] **Unit test coverage** — bring coverage to ≥ 80% across components, services, and store slices

---

## 📋 Planned

### v1.0 — Production Release
- [ ] End-to-end tests (Playwright) for critical user journeys: login → retire credits, marketplace buy
- [ ] PWA service worker for offline dashboard access
- [ ] Certificate PDF generation and download
- [ ] Performance: virtual scrolling for large sensor data tables
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Production environment configuration and Docker image
- [ ] CI/CD pipeline (GitHub Actions: lint → test → build → deploy)

### v1.1
- [ ] Light mode theme
- [ ] Multi-language support (i18n)
- [ ] Notifications centre (in-app and email preferences)
- [ ] Advanced marketplace: candlestick price chart, order history export
- [ ] Farmer portal: edge-of-field sensor visualisations
- [ ] Mobile-responsive layout improvements

### v1.2+
- [ ] Governance: on-chain vote submission via Freighter
- [ ] Public explorer (unauthenticated project browser)
- [ ] ESG report PDF export
- [ ] Multi-wallet support (LOBSTR, xBull)
- [ ] Analytics dashboard for oracle operators

---

## ⚠️ Known Limitations

- Most feature modules currently render scaffold/placeholder UI — backend wiring is in progress.
- The Stellar contract addresses in `environment.ts.example` are placeholders; deploy the contracts first.
- Light mode toggle exists in the store but the theme is not fully implemented.
- Mobile layout is not optimised — designed primarily for desktop dashboards.
- No CI pipeline is configured yet; all checks must be run locally.

---

## Contributing to the Roadmap

Have a feature idea or want to reprioritise something? Open a [GitHub Discussion](https://github.com/water-credits/water-credits-frontend/discussions), reach out on [Telegram (@Escelit)](https://t.me/Escelit), or email [ogazipromise81@gmail.com](mailto:ogazipromise81@gmail.com). See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get involved.
