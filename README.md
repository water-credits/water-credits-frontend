<div align="center">

# 🎨 water-credits-frontend

### *Angular dashboard for the Water Quality & Replenishment Credits protocol*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)](https://typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4)](https://tailwindcss.com)
[![Stellar](https://img.shields.io/badge/Stellar-Freighter-7B2FBE)](https://freighter.app)
[![Status](https://img.shields.io/badge/Status-Beta-orange)](ROADMAP.md)

**A full-featured web application for registering projects, monitoring sensors in real time, trading credits, and retiring them with verifiable on-chain certificates.**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Feature Modules](#-feature-modules)
  - [Dashboard](#1-dashboard)
  - [Projects](#2-projects)
  - [Sensors](#3-sensors)
  - [Credits](#4-credits)
  - [Marketplace](#5-marketplace)
  - [Retirement](#6-retirement)
  - [Farmers Portal](#7-farmers-portal)
  - [Governance](#8-governance)
  - [Admin Panel](#9-admin-panel)
- [Component Library](#-component-library)
- [Route Map](#-route-map)
- [State Management (NgRx)](#-state-management-ngrx)
- [WebSocket Integration](#-websocket-integration)
- [Stellar Wallet Integration](#-stellar-wallet-integration)
- [Design System](#-design-system)
- [Environment Configuration](#-environment-configuration)
- [Build & Deploy](#-build--deploy)
- [Testing Strategy](#-testing-strategy)
- [Performance](#-performance)
- [Accessibility](#-accessibility)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌊 Overview

The frontend is the primary interface for every participant in the Water Quality & Replenishment Credits ecosystem. It provides:

- **📊 Real-time dashboards** — Live sensor readings, credit volumes, market prices
- **🗺️ Interactive mapping** — Leaflet-powered project explorer with sensor overlays
- **👛 Stellar wallet integration** — Freighter browser extension for authentication and transactions
- **📈 Data visualization** — Chart.js time-series for sensor data and credit trends
- **📜 Certificate management** — View and download immutable retirement certificates
- **🌾 Farmer portal** — Register parcels, enroll in regenerative practices, track earnings

### Who Uses This Application

| Role | Primary Tasks |
|---|---|
| **Project Developer** | Register projects, deploy sensors, monitor data, issue credits |
| **Farmer** | Register parcels, adopt BMPs, earn & sell credits |
| **Credit Buyer** | Browse marketplace, purchase, retire credits, download ESG reports |
| **Oracle Operator** | Monitor oracle node health, view submission history |
| **Administrator** | Manage users, configure fees, whitelist oracles, oversee protocol |
| **General Public** | Explore projects, view total retired credits, verify certificates |

---

## 🏗️ Architecture

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         App Component                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Router Outlet                               │   │
│  │                                                               │   │
│  │  ┌──────────────┐  ┌──────────────────────────────────────┐  │   │
│  │  │  Auth Layout  │  │         Default Layout               │  │   │
│  │  │  (login,      │  │  ┌──────────┐ ┌──────────────────┐  │  │   │
│  │  │   register)   │  │  │  Header  │ │  Router Outlet   │  │  │   │
│  │  │               │  │  └──────────┘ │  (feature pages)  │  │  │   │
│  │  └──────────────┘  │  ┌──────────┐ └──────────────────┘  │  │   │
│  │                    │  │  Sidebar  │                       │  │   │
│  │                    │  └──────────┘                       │  │   │
│  │                    └──────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   Core Services                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │   │
│  │  │  Auth    │ │  API     │ │  Wallet  │ │  WebSocket     │  │   │
│  │  │ Service  │ │  Service │ │  Service │ │  Service       │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/
│   ├── app.module.ts                      # Root module
│   ├── app.routes.ts                      # Route definitions (lazy-loaded)
│   ├── app.component.ts                   # Root component
│   ├── app.component.html
│   ├── app.component.scss
│   │
│   ├── core/                              # Singleton services & models
│   │   ├── services/
│   │   │   ├── api.service.ts             # Axios HTTP client (JWT interceptor)
│   │   │   ├── auth.service.ts            # Login, register, token management
│   │   │   ├── wallet.service.ts          # Freighter wallet integration
│   │   │   ├── projects.service.ts        # Project CRUD
│   │   │   ├── sensors.service.ts         # Sensor data + WebSocket
│   │   │   ├── credits.service.ts         # Credit operations
│   │   │   ├── marketplace.service.ts     # Buy/sell orders
│   │   │   ├── retirement.service.ts      # Retirement flow
│   │   │   ├── farmers.service.ts         # Farmer operations
│   │   │   ├── governance.service.ts      # Proposals & voting
│   │   │   ├── admin.service.ts           # Admin operations
│   │   │   ├── websocket.service.ts       # Socket.IO client
│   │   │   ├── notification.service.ts    # Toast/in-app notifications
│   │   │   ├── analytics.service.ts       # Dashboard data
│   │   │   └── error-handler.service.ts   # Global error handling
│   │   ├── guards/
│   │   │   ├── auth.guard.ts              # Redirect if unauthenticated
│   │   │   └── role.guard.ts              # Role-based access
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── project.model.ts
│   │       ├── sensor-reading.model.ts
│   │       ├── credit.model.ts
│   │       ├── marketplace.model.ts
│   │       ├── retirement.model.ts
│   │       ├── proposal.model.ts
│   │       └── pagination.model.ts
│   │
│   ├── shared/                            # Reusable components, directives, pipes
│   │   ├── components/
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts
│   │   │   │   ├── header.component.html
│   │   │   │   └── header.component.scss
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   ├── sidebar.component.html
│   │   │   │   └── sidebar.component.scss
│   │   │   ├── wallet-connect/
│   │   │   │   ├── wallet-connect.component.ts
│   │   │   │   ├── wallet-connect.component.html
│   │   │   │   └── wallet-connect.component.scss
│   │   │   ├── data-table/
│   │   │   │   ├── data-table.component.ts
│   │   │   │   ├── data-table.component.html
│   │   │   │   └── data-table.component.scss
│   │   │   ├── sensor-chart/
│   │   │   │   ├── sensor-chart.component.ts
│   │   │   │   ├── sensor-chart.component.html
│   │   │   │   └── sensor-chart.component.scss
│   │   │   ├── credit-card/
│   │   │   │   ├── credit-card.component.ts
│   │   │   │   ├── credit-card.component.html
│   │   │   │   └── credit-card.component.scss
│   │   │   ├── map-view/
│   │   │   │   ├── map-view.component.ts
│   │   │   │   ├── map-view.component.html
│   │   │   │   └── map-view.component.scss
│   │   │   ├── retire-credits-modal/
│   │   │   │   ├── retire-credits-modal.component.ts
│   │   │   │   ├── retire-credits-modal.component.html
│   │   │   │   └── retire-credits-modal.component.scss
│   │   │   ├── loading-spinner/
│   │   │   ├── empty-state/
│   │   │   ├── confirm-dialog/
│   │   │   ├── status-badge/
│   │   │   ├── search-input/
│   │   │   ├── filter-panel/
│   │   │   └── pagination-controls/
│   │   ├── directives/
│   │   │   ├── tooltip.directive.ts
│   │   │   ├── click-outside.directive.ts
│   │   │   └── copy-to-clipboard.directive.ts
│   │   └── pipes/
│   │       ├── truncate.pipe.ts
│   │       ├── stellar-address.pipe.ts     # GABC…XXXX formatting
│   │       ├── date-format.pipe.ts         # Configurable date display
│   │       ├── number-abbreviate.pipe.ts   # 1,234 → 1.2K
│   │       ├── duration.pipe.ts            # Unix ts → "2h ago"
│   │       └── credit-amount.pipe.ts       # Fixed-point formatting
│   │
│   ├── features/                           # Lazy-loaded feature modules
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts
│   │   │   ├── dashboard.component.html
│   │   │   ├── dashboard.component.scss
│   │   │   ├── dashboard.module.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── widgets/
│   │   │       ├── total-credits-widget/
│   │   │       ├── projects-map-widget/
│   │   │       ├── recent-retirements-widget/
│   │   │       ├── sensor-summary-widget/
│   │   │       └── price-chart-widget/
│   │   │
│   │   ├── projects/
│   │   │   ├── projects-list/
│   │   │   ├── project-detail/
│   │   │   ├── project-form/
│   │   │   ├── projects.module.ts
│   │   │   └── projects.routes.ts
│   │   │
│   │   ├── sensors/
│   │   │   ├── sensor-dashboard/
│   │   │   ├── sensor-config/
│   │   │   ├── sensors.module.ts
│   │   │   └── sensors.routes.ts
│   │   │
│   │   ├── credits/
│   │   │   ├── credits-portfolio/
│   │   │   ├── credit-detail/
│   │   │   ├── credits.module.ts
│   │   │   └── credits.routes.ts
│   │   │
│   │   ├── marketplace/
│   │   │   ├── marketplace-listings/
│   │   │   ├── marketplace-order-book/
│   │   │   ├── marketplace-create-listing/
│   │   │   ├── marketplace.module.ts
│   │   │   └── marketplace.routes.ts
│   │   │
│   │   ├── retirement/
│   │   │   ├── retirement-list/
│   │   │   ├── retirement-form/
│   │   │   ├── retirement-certificate/
│   │   │   ├── retirement.module.ts
│   │   │   └── retirement.routes.ts
│   │   │
│   │   ├── farmers/
│   │   │   ├── farmer-dashboard/
│   │   │   ├── farmer-parcels/
│   │   │   ├── farmer-practices/
│   │   │   ├── farmer-earnings/
│   │   │   ├── farmers.module.ts
│   │   │   └── farmers.routes.ts
│   │   │
│   │   ├── governance/
│   │   │   ├── governance-dashboard/
│   │   │   ├── proposal-detail/
│   │   │   ├── proposal-form/
│   │   │   ├── governance.module.ts
│   │   │   └── governance.routes.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── admin-dashboard/
│   │   │   ├── admin-oracles/
│   │   │   ├── admin-fees/
│   │   │   ├── admin-users/
│   │   │   ├── admin.module.ts
│   │   │   └── admin.routes.ts
│   │   │
│   │   └── auth/
│   │       ├── login/
│   │       ├── register/
│   │       ├── auth.module.ts
│   │       └── auth.routes.ts
│   │
│   ├── layouts/
│   │   ├── default-layout/
│   │   │   ├── default-layout.component.ts
│   │   │   ├── default-layout.component.html
│   │   │   └── default-layout.component.scss
│   │   └── auth-layout/
│   │       ├── auth-layout.component.ts
│   │       ├── auth-layout.component.html
│   │       └── auth-layout.component.scss
│   │
│   └── store/                              # NgRx state
│       ├── index.ts
│       ├── auth/
│       │   ├── auth.actions.ts
│       │   ├── auth.reducer.ts
│       │   ├── auth.effects.ts
│       │   └── auth.selectors.ts
│       ├── projects/
│       │   ├── projects.actions.ts
│       │   ├── projects.reducer.ts
│       │   ├── projects.effects.ts
│       │   └── projects.selectors.ts
│       ├── sensors/
│       ├── credits/
│       ├── marketplace/
│       ├── wallet/
│       └── ui/
│
├── assets/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-white.svg
│   │   ├── favicon.ico
│   │   ├── hero-water.jpg
│   │   └── empty-states/
│   │       ├── no-projects.svg
│   │       ├── no-credits.svg
│   │       └── no-sensors.svg
│   └── icons/
│       ├── water-drop.svg
│       ├── sensor.svg
│       ├── credit.svg
│       ├── farmer.svg
│       ├── factory.svg
│       └── certificate.svg
│
├── environments/
│   ├── environment.ts                      # Development
│   ├── environment.prod.ts                 # Production
│   └── environment.staging.ts              # Staging
│
├── theme/                                  # Design tokens
│   ├── _variables.scss                     # Colors, spacing, typography, shadows
│   ├── _mixins.scss                        # Responsive breakpoints, gradients
│   └── _utilities.scss                     # Tailwind extensions
│
├── index.html
├── main.ts                                 # App bootstrap
├── styles.scss                             # Global styles
├── tailwind.config.js
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── package.json
└── .browserslistrc
```

---

## 📦 Feature Modules

### 1. Dashboard

The landing page after login. Provides a bird's-eye view of the entire protocol.

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Welcome back, {{user.name}}                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Total     │ │ Active   │ │Credits   │ │Retired   │            │
│  │Projects  │ │ Projects │ │Minted    │ │Total     │            │
│  │    42    │ │    12    │ │ 1.2M     │ │   840K   │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                  │
│  ┌───────────────────────────────────┐ ┌──────────────────────┐  │
│  │       Projects Map                │ │   Recent Retirements │  │
│  │       (Leaflet)                   │ │   ┌────────────────┐ │  │
│  │                                    │ │   │ Acme Corp      │ │  │
│  │   🟢 12 Active    🟡 8 Baseline   │ │   │ 50k credits    │ │  │
│  │   🔴 6 Completed  ⚪ 16 Registered │ │   │ 2h ago         │ │  │
│  │                                    │ │   └────────────────┘ │  │
│  └───────────────────────────────────┘ └──────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────┐ ┌──────────────────────┐  │
│  │  Credits Over Time (Chart.js)     │ │  Sensor Alerts       │  │
│  │  ┌───────────┐                    │ │  ⚠️ pH spike at     │  │
│  │  │           │                    │ │     Green Valley    │  │
│  │  │  ▁▃▅▇█▇▅▃▁ │  Minted           │ │  ✅ Oracle nodes    │  │
│  │  │  ▁▂▄▆█▆▄▂▁ │  Retired          │ │     all healthy     │  │
│  │  └───────────┘                    │ │                      │  │
│  └───────────────────────────────────┘ └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Widgets:**

| Widget | Source | Update Frequency |
|---|---|---|
| **Stats Cards** | `GET /analytics/overview` | On page load |
| **Projects Map** | `GET /projects?limit=100` | On page load |
| **Recent Retirements** | `GET /credits/retirements?limit=10` | Every 30s |
| **Credits Over Time** | `GET /analytics/credits-over-time` | On page load |
| **Price Chart** | `GET /marketplace/prices` | On page load |
| **Sensor Alerts** | WebSocket `sensor:alert` | Real-time |
| **Active Oracles** | `GET /oracle/status` | Every 60s |
| **My Portfolio** | `GET /credits/portfolio` | On page load |

---

### 2. Projects

Full CRUD for watershed restoration projects, with map exploration and detailed data views.

#### Projects List View

```
┌─────────────────────────────────────────────────────────────────┐
│  Projects  [🔍 Search...] [🌾 Methodology ▼] [📍 Status ▼]      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  🗺️  Map View  |  📋  Table View  [Toggle]                  │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Leaflet Map with project markers                      │  │ │
│  │  │  🟢 Active  🟡 Baseline  🔴 Completed  ⚪ Registered   │  │ │
│  │  │  Click marker → popup with project summary             │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  Project Cards (grid, 3 columns)                       │  │ │
│  │  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │  │ │
│  │  │  │ Green Valley │ │ Blue River   │ │ Clear Creek  │   │  │ │
│  │  │  │ 🌊 Active    │ │ 🌊 Baseline  │ │ 🌊 Completed │   │  │ │
│  │  │  │ 120K credits │ │ 45K credits  │ │ 890K credits │   │  │ │
│  │  │  └──────────────┘ └──────────────┘ └──────────────┘   │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [← Prev]  Page 1 of 5  [Next →]                                │
└─────────────────────────────────────────────────────────────────┘
```

#### Project Detail View (Tabbed)

| Tab | Content |
|---|---|
| **Overview** | Project name, location map, status badge, methodology, area, owner, description |
| **Sensors** | Live sensor readings, historical charts, device list, alerts |
| **Credits** | Minted/retired totals, price history, token contract link |
| **Documents** | Uploaded methodology docs, verification reports, permits |

#### Project Registration Form (Wizard)

| Step | Fields |
|---|---|
| **1. Basic Info** | Name, description, methodology dropdown |
| **2. Location** | Interactive map pin drop + polygon drawing |
| **3. Details** | Area (hectares), expected annual credits, verifier |
| **4. Documents** | Upload methodology docs, permits, environmental assessment |
| **5. Review** | Preview all info, submit for approval |

---

### 3. Sensors

Real-time sensor monitoring with historical data analysis.

#### Sensor Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Sensor Dashboard — Green Valley Wetland                         │
│  [📅 Last 24h ▼] [🔄 Auto-refresh] [📊 Export CSV]              │
│                                                                  │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│
│  │ pH           │ │ Turbidity    │ │ Dissolved O2 │ │ Flow     ││
│  │ 7.2          │ │ 12.4 NTU     │ │ 6.8 mg/L     │ │ 1.83 m³/s││
│  │ ✅ Normal    │ │ ✅ Normal    │ │ ✅ Good      │ │ —        ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  pH — Last 24 Hours (SensorChart component)               │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  ▁▃▅▇█▇▅▃▁▁▃▅▇█▇▅▃▁▁▃▅▇█▇▅▃▁▁▃▅▇█▇▅▃▁              │  │   │
│  │  │  7.5 ─────────────────────────────────── Threshold  │  │   │
│  │  │  7.0 ───────────────────────────────────            │  │   │
│  │  │  6.5 ─────────────────────────────────── Threshold  │  │   │
│  │  │  00:00    06:00    12:00    18:00    23:00          │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Multi-parameter overlay (configurable)                   │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  📈 pH  📈 Turbidity  📈 DO  📈 Temperature        │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Raw Data Table (DataTable component)                     │   │
│  │  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────────┐  │   │
│  │  │ Time │ pH   │ Turb │ DO   │ N    │ P    │ Verified │  │   │
│  │  ├──────┼──────┼──────┼──────┼──────┼──────┼──────────┤  │   │
│  │  │ 12:00│ 7.2  │ 12.4 │ 6.8  │ 2.45 │ 0.125│ ✅       │  │   │
│  │  │ 11:45│ 7.1  │ 13.1 │ 6.7  │ 2.50 │ 0.130│ ✅       │  │   │
│  │  │ ...  │ ...  │ ...  │ ...  │ ...  │ ...  │ ...      │  │   │
│  │  └──────┴──────┴──────┴──────┴──────┴──────┴──────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### Alert Configuration

| Parameter | Low Threshold | High Threshold | Severity |
|---|---|---|---|
| pH | 6.5 | 8.5 | High |
| Turbidity | — | 50 NTU | Medium |
| DO | 5.0 mg/L | — | High |
| Temperature | — | Baseline + 2°C | Medium |

---

### 4. Credits

Portfolio management for credit holders.

#### Portfolio View

```
┌─────────────────────────────────────────────────────────────────┐
│  My Credit Portfolio                                              │
│  Total Balance: 250,000 credits  |  Total Retired: 50,000        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Holdings by Project                                         │ │
│  │  ┌────────────────┬──────────┬──────────┬──────────┬──────┐ │ │
│  │  │ Project        │ Balance  │ Retired  │ Price    │ Value│ │ │
│  │  ├────────────────┼──────────┼──────────┼──────────┼──────┤ │ │
│  │  │ Green Valley   │ 150,000  │ 30,000   │ $2.50    │ $375K│ │ │
│  │  │ Blue River     │ 80,000   │ 15,000   │ $1.80    │ $144K│ │ │
│  │  │ Clear Creek    │ 20,000   │ 5,000    │ $3.20    │ $64K │ │ │
│  │  └────────────────┴──────────┴──────────┴──────────┴──────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Retire Credits] [Sell on Marketplace] [Download Report]        │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Marketplace

Browse, buy, and sell credits on the Stellar DEX.

| Feature | Description |
|---|---|
| **Order Book** | Live buy/sell orders with depth chart |
| **Create Listing** | Set price, quantity, expiry |
| **Price History** | Candlestick or line chart |
| **My Orders** | Active and filled order history |

---

### 6. Retirement

Initiate and verify credit retirements.

#### Retirement Wizard

```
Step 1: Select Project ──▶ Step 2: Enter Amount ──▶ Step 3: Set Purpose ──▶ Step 4: Review & Confirm

  ┌─────────────────────────────────────────────────────────────────┐
  │  Retire Credits                                                  │
  │                                                                  │
  │  Project: [Green Valley Wetland ▼]                               │
  │  Balance: 150,000 credits                                       │
  │                                                                  │
  │  Amount: [ 50,000 ] credits    (Available: 150,000)             │
  │                                                                  │
  │  Purpose:                                                        │
  │  ○ Compliance (regulatory requirement)                          │
  │  ● Voluntary (ESG commitment)                                   │
  │  ○ Community (local watershed program)                          │
  │  ○ Custom: [________________________]                           │
  │                                                                  │
  │  Certificate Notes:                                              │
  │  [FY2025 ESG compliance — Acme Beverage Corp]                    │
  │                                                                  │
  │  ┌─────────────────────────────────────────────────────────────┐ │
  │  │  📄 Preview Certificate                                      │ │
  │  │  ┌────────────────────────────────────────────────────────┐ │ │
  │  │  │  50,000 credits from Green Valley Wetland               │ │ │
  │  │  │  Retired by: GABC...DEF                                 │ │ │
  │  │  │  Purpose: Voluntary ESG                                 │ │ │
  │  │  │  Certificate: WQC-2025-001-0042                        │ │ │
  │  │  │  Status: ⏳ Pending transaction...                      │ │ │
  │  │  └────────────────────────────────────────────────────────┘ │ │
  │  └─────────────────────────────────────────────────────────────┘ │
  │                                                                  │
  │  💰 Estimated fee: 0 credits (retirement is free)                │
  │                                                                  │
  │  [Cancel]                                      [Confirm Retire]  │
  └─────────────────────────────────────────────────────────────────┘
```

---

### 7. Farmers Portal

Specialized portal for regenerative agriculture participants.

| Page | Description |
|---|---|
| **Dashboard** | Parcel overview, total credits earned, active practices |
| **Parcel Registration** | Draw field boundaries on map, enter area, crop type |
| **Practice Enrollment** | Select BMPs (cover crops, no-till, buffer strips) |
| **Earnings** | Credit balance, payout history, projected earnings |
| **Sensor Data** | Edge-of-field monitoring charts |

---

### 8. Governance

Participate in protocol governance.

| Page | Description |
|---|---|
| **Proposals List** | Active, passed, and rejected proposals |
| **Proposal Detail** | Description, votes (for/against), deadline, execute button |
| **Create Proposal** | Form to submit a new governance proposal |
| **Protocol Config** | Current fee, weights, and threshold display |

---

### 9. Admin Panel

Protocol administration (admin role only).

| Page | Description |
|---|---|
| **Dashboard** | System health, queue depths, user counts |
| **Oracle Management** | Add/remove oracles, view submission history |
| **Fee Configuration** | Update protocol fee, weights, thresholds |
| **User Management** | List users, change roles, manage KYC status |
| **Contract Management** | View deployed contract addresses, upgrade path |

---

## 🧩 Component Library

### Shared Components

| Component | Inputs | Outputs | Description |
|---|---|---|---|
| **Header** | `title`, `user`, `notifications` | `(menuToggle)` | Top navigation bar with wallet connect |
| **Sidebar** | `menuItems`, `collapsed` | `(navigate)` | Collapsible role-based navigation |
| **WalletConnect** | `connected`, `address`, `network` | `(connect)`, `(disconnect)` | Freighter wallet button |
| **DataTable** | `columns`, `data`, `loading`, `pagination` | `(sort)`, `(page)`, `(rowClick)` | Sortable, paginated table |
| **SensorChart** | `data`, `parameters`, `timeRange` | `(rangeChange)` | Multi-line time-series chart |
| **CreditCard** | `project`, `balance`, `price` | `(click)` | Project credit summary card |
| **MapView** | `projects`, `center`, `zoom` | `(projectClick)` | Leaflet map with markers |
| **RetireModal** | `projects`, `balances` | `(retire)`, `(close)` | Multi-step retirement wizard |
| **LoadingSpinner** | `size`, `overlay` | — | Animated loading indicator |
| **EmptyState** | `icon`, `title`, `message`, `actionLabel` | `(action)` | Illustrated empty state |
| **ConfirmDialog** | `title`, `message`, `confirmLabel`, `cancelLabel` | `(confirm)`, `(cancel)` | Confirmation modal |
| **StatusBadge** | `status`, `type` | — | Colored status indicator |
| **SearchInput** | `placeholder`, `value` | `(search)` | Debounced search field |
| **FilterPanel** | `filters`, `appliedFilters` | `(filterChange)` | Multi-filter sidebar |
| **PaginationControls** | `page`, `totalPages`, `total` | `(pageChange)` | Page navigation |

---

## 🗺️ Route Map

### Public Routes (No Auth)

| Path | Component | Description |
|---|---|---|
| `/auth/login` | `LoginComponent` | Stellar wallet login |
| `/auth/register` | `RegisterComponent` | Create account |
| `/explore` | `ExploreComponent` | Public project browser |

### Authenticated Routes

| Path | Module | Role |
|---|---|---|
| `/dashboard` | DashboardModule | Any |
| `/projects` | ProjectsModule | Any |
| `/projects/new` | ProjectsModule | Developer, Admin |
| `/projects/:id` | ProjectsModule | Any |
| `/projects/:id/sensors` | SensorsModule | Developer, Oracle |
| `/sensors/:projectId` | SensorsModule | Developer, Oracle |
| `/credits` | CreditsModule | Any |
| `/credits/:projectId` | CreditsModule | Any |
| `/credits/retire` | RetirementModule | Any |
| `/credits/retirements` | RetirementModule | Any |
| `/credits/retirements/:id` | RetirementModule | Any |
| `/marketplace` | MarketplaceModule | Any |
| `/marketplace/listings/new` | MarketplaceModule | Any |
| `/farmers` | FarmersModule | Farmer |
| `/farmers/parcels/new` | FarmersModule | Farmer |
| `/farmers/parcels/:id` | FarmersModule | Farmer |
| `/governance` | GovernanceModule | Any |
| `/governance/proposals/new` | GovernanceModule | Any |
| `/governance/proposals/:id` | GovernanceModule | Any |
| `/admin` | AdminModule | Admin |
| `/admin/oracles` | AdminModule | Admin |
| `/admin/fees` | AdminModule | Admin |
| `/admin/users` | AdminModule | Admin |

### Route Configuration

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
      { path: 'projects', loadChildren: () => import('./features/projects/projects.module').then(m => m.ProjectsModule) },
      { path: 'sensors', loadChildren: () => import('./features/sensors/sensors.module').then(m => m.SensorsModule) },
      { path: 'credits', loadChildren: () => import('./features/credits/credits.module').then(m => m.CreditsModule) },
      { path: 'marketplace', loadChildren: () => import('./features/marketplace/marketplace.module').then(m => m.MarketplaceModule) },
      { path: 'retirement', loadChildren: () => import('./features/retirement/retirement.module').then(m => m.RetirementModule) },
      { path: 'farmers', loadChildren: () => import('./features/farmers/farmers.module').then(m => m.FarmersModule), canActivate: [RoleGuard], data: { roles: ['farmer'] } },
      { path: 'governance', loadChildren: () => import('./features/governance/governance.module').then(m => m.GovernanceModule) },
      { path: 'admin', loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule), canActivate: [RoleGuard], data: { roles: ['admin'] } },
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
```

---

## 🗃️ State Management (NgRx)

### Store Shape

```typescript
interface AppState {
  auth: AuthState;
  projects: ProjectsState;
  sensors: SensorsState;
  credits: CreditsState;
  marketplace: MarketplaceState;
  wallet: WalletState;
  ui: UIState;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

interface ProjectsState {
  entities: Record<string, Project>;
  selectedProjectId: string | null;
  filters: ProjectFilters;
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

interface SensorsState {
  readings: Record<string, SensorReading[]>;  // keyed by projectId
  latestReadings: Record<string, SensorReading>;
  alerts: SensorAlert[];
  realTimeBuffer: SensorReading[];            // last 100 from WS
  loading: boolean;
}

interface CreditsState {
  portfolio: CreditHolding[];
  retirements: Retirement[];
  selectedCredit: CreditDetail | null;
  loading: boolean;
}

interface MarketplaceState {
  listings: MarketplaceListing[];
  orderBook: OrderBook;
  myOrders: Order[];
  priceHistory: PricePoint[];
  loading: boolean;
}

interface WalletState {
  connected: boolean;
  address: string | null;
  network: 'testnet' | 'public' | null;
  balance: string | null;
}

interface UIState {
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  activeModal: string | null;
  notifications: Notification[];
}
```

### Key Actions & Effects

```typescript
// Auth
login({ wallet, signature })      → Effect: call API, store token
logout()                          → Reducer: clear state
refreshToken()                    → Effect: silent refresh

// Projects
loadProjects({ filters })         → Effect: GET /projects
loadProjectDetail({ id })         → Effect: GET /projects/:id
createProject({ data })           → Effect: POST /projects

// Sensors
subscribeProject({ projectId })   → Effect: WebSocket subscribe
receiveSensorReading({ data })    → Reducer: append to buffer
receiveSensorAlert({ data })      → Effect: show notification

// Credits
loadPortfolio()                   → Effect: GET /credits/portfolio
retireCredits({ data })           → Effect: POST /credits/retire

// Wallet
connectWallet()                   → Effect: Freighter connect
disconnectWallet()                → Reducer: clear wallet state
```

---

## 🔌 WebSocket Integration

### Service Architecture

```typescript
@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket;

  constructor(private authService: AuthService) {
    this.socket = io(environment.wsUrl, {
      auth: { token: this.authService.getToken() },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => console.log('WS connected'));
    this.socket.on('disconnect', (reason) => console.warn('WS disconnected:', reason));
    this.socket.on('error', (error) => console.error('WS error:', error));
  }

  subscribeToProject(projectId: string): void {
    this.socket.emit('subscribe:project', { projectId });
  }

  unsubscribeFromProject(projectId: string): void {
    this.socket.emit('unsubscribe:project', { projectId });
  }

  onSensorReading(callback: (data: SensorReading) => void): void {
    this.socket.on('sensor:reading', callback);
  }

  onSensorAlert(callback: (data: SensorAlert) => void): void {
    this.socket.on('sensor:alert', callback);
  }

  onCreditMinted(callback: (data: CreditEvent) => void): void {
    this.socket.on('credit:minted', callback);
  }

  onCreditRetired(callback: (data: RetirementEvent) => void): void {
    this.socket.on('credit:retired', callback);
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
```

### Connection Lifecycle

```
1. User logs in → JWT stored in memory
2. WebsocketService connects with JWT in auth handshake
3. Server validates JWT → upgrades to WS connection
4. User navigates to sensor dashboard → subscribeToProject()
5. Server sends sensor:reading events in real time
6. User navigates away → unsubscribeFromProject()
7. JWT expires → server closes WS connection
8. AuthService refreshes token → WebsocketService reconnects
```

---

## 👛 Stellar Wallet Integration

### Freighter Connection

```typescript
@Injectable({ providedIn: 'root' })
export class WalletService {
  private freighter: FreighterApi = window.phantom?.stellar?.freighter;

  get isInstalled(): boolean {
    return !!this.freighter;
  }

  async connect(): Promise<{ address: string; network: string }> {
    try {
      const { address } = await this.freighter.connect();
      const network = await this.freighter.getNetwork();
      return { address, network };
    } catch (error) {
      throw new Error('Failed to connect Freighter wallet');
    }
  }

  async signChallenge(challenge: string): Promise<string> {
    const { signedMessage } = await this.freighter.signMessage(challenge);
    return signedMessage;
  }

  async signTransaction(tx: string): Promise<string> {
    const { signedTx } = await this.freighter.signTransaction(tx, {
      network: await this.freighter.getNetwork(),
    });
    return signedTx;
  }

  getAddress(): Promise<string> {
    return this.freighter.getAddress();
  }

  onNetworkChange(callback: (network: string) => void): void {
    this.freighter.onNetworkChange(callback);
  }

  onAddressChange(callback: (address: string) => void): void {
    this.freighter.onAddressChange(callback);
  }
}
```

### Authentication Flow in UI

```
  User clicks "Connect Wallet"
         │
         ▼
  Freighter extension opens
         │
         ▼
  User approves connection
         │
         ▼
  Backend sends challenge message
         │
         ▼
  Freighter signs challenge
         │
         ▼
  Backend verifies signature → issues JWT
         │
         ▼
  User is authenticated → redirects to dashboard
```

---

## 🎨 Design System

### Color Palette

```scss
// theme/_variables.scss

// Primary — Stellar Blue
$color-primary-50:  #E8F4FF;
$color-primary-100: #D1E9FF;
$color-primary-200: #A3D3FF;
$color-primary-300: #66B0FF;
$color-primary-400: #3399FF;
$color-primary-500: #0A84FF;    // Primary action color
$color-primary-600: #0066CC;
$color-primary-700: #004C99;
$color-primary-800: #003366;
$color-primary-900: #001A33;

// Secondary — Environmental Green
$color-secondary-50:  #E8F8E8;
$color-secondary-100: #C5F0C5;
$color-secondary-200: #A7E8A7;
$color-secondary-300: #6DD86D;
$color-secondary-400: #4AC84A;
$color-secondary-500: #30D158;   // Success, active
$color-secondary-600: #24A844;
$color-secondary-700: #1A7E33;
$color-secondary-800: #105522;
$color-secondary-900: #082B11;

// Accent — Credit Gold
$color-accent-50:  #FFF4E5;
$color-accent-100: #FFE8CC;
$color-accent-200: #FFD199;
$color-accent-300: #FFBA66;
$color-accent-400: #FFA333;
$color-accent-500: #FF9F0A;     // Warning, credits, alerts
$color-accent-600: #CC7F00;
$color-accent-700: #995F00;
$color-accent-800: #664000;
$color-accent-900: #332000;

// Danger — Retirement Red
$color-danger-50:   #FFEBEE;
$color-danger-100:  #FFCDD2;
$color-danger-200:  #EF9A9A;
$color-danger-300:  #E57373;
$color-danger-400:  #EF5350;
$color-danger-500:  #FF453A;     // Critical, retired
$color-danger-600:  #D32F2F;
$color-danger-700:  #C62828;
$color-danger-800:  #B71C1C;
$color-danger-900:  #7F0000;

// Neutrals (Dark Mode Default)
$color-surface:     #1C1C1E;
$color-surface-50:  #2C2C2E;
$color-surface-100:#3A3A3C;
$color-surface-200:#48484A;
$color-background:  #000000;
$color-text:        #F5F5F7;
$color-text-muted:  #86868B;
$color-border:      #38383A;
```

### Typography

```
Headings:
  h1 — Inter Semi-Bold, 32px, 1.2 line-height
  h2 — Inter Semi-Bold, 24px, 1.3 line-height
  h3 — Inter Semi-Bold, 20px, 1.4 line-height
  h4 — Inter Semi-Bold, 16px, 1.4 line-height

Body:
  body — Inter Regular, 14px, 1.5 line-height
  body-sm — Inter Regular, 12px, 1.5 line-height
  caption — Inter Regular, 11px, 1.4 line-height

Monospace:
  code — JetBrains Mono, 13px, 1.4 line-height (for addresses, hashes, contract IDs)
```

### Spacing Scale

```
$space-1:  4px;
$space-2:  8px;
$space-3:  12px;
$space-4:  16px;
$space-5:  20px;
$space-6:  24px;
$space-8:  32px;
$space-10: 40px;
$space-12: 48px;
$space-16: 64px;
$space-20: 80px;
```

### Dark Mode (Default)

The entire UI is **dark-mode first** with an optional light toggle. This aligns with the Stellar ecosystem aesthetic and provides comfortable viewing for long dashboard monitoring sessions.

```scss
// CSS Custom Properties
:root {
  --bg-primary: #000000;
  --bg-secondary: #1C1C1E;
  --bg-tertiary: #2C2C2E;
  --text-primary: #F5F5F7;
  --text-secondary: #86868B;
  --border: #38383A;
  --shadow: rgba(0, 0, 0, 0.3);
}

[data-theme="light"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F7;
  --bg-tertiary: #E8E8ED;
  --text-primary: #1D1D1F;
  --text-secondary: #86868B;
  --border: #D2D2D7;
  --shadow: rgba(0, 0, 0, 0.1);
}
```

---

## 🔧 Environment Configuration

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  name: 'development',

  // API
  apiUrl: 'http://localhost:3000/api/v1',
  wsUrl: 'http://localhost:3000',

  // Stellar
  stellarNetwork: 'testnet',                    // testnet | public
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',

  // Contract addresses (deployed on Stellar)
  contracts: {
    creditFactory: 'CABCDEF1234567890ABCDEF1234567890ABCDEF12345',
    verificationOracle: 'CDEFGH4567890ABCDEF1234567890ABCDEF123456',
    retirementRegistry: 'CGHIJK78901234567890ABCDEF1234567890ABCDEF',
    governance: 'CKLMNO01234567890ABCDEF1234567890ABCDEF12345',
  },

  // Maps
  map: {
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    defaultZoom: 5,
    defaultCenter: [20, 0] as [number, number],
  },

  // Features
  features: {
    marketplace: true,
    farmersPortal: true,
    governance: true,
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
  },
};
```

---

## 🚢 Build & Deploy

### Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4200)
ng serve

# Start with specific port
ng serve --port 4200 --host 0.0.0.0
```

### Production Build

```bash
# Build for production
ng build --configuration production

# Output: dist/water-credits-frontend/
# Serve with any static file server (nginx, Caddy, Cloudflare Pages)
```

### Docker

```dockerfile
# Dockerfile (multi-stage)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist/water-credits-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name app.water-credits.io;
    root /usr/share/nginx/html;
    index index.html;

    # Angular SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional — or use separate subdomain)
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket proxy
    location /socket.io/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|svg|ico)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Deployment Targets

| Platform | Instructions |
|---|---|
| **Vercel** | `vercel --prod` (auto-detects Angular) |
| **Netlify** | `npm run build` → deploy `dist/` with `_redirects` file for SPA routing |
| **Cloudflare Pages** | Connect repo, build command: `npm run build`, output: `dist/` |
| **AWS S3 + CloudFront** | `aws s3 sync dist/ s3://bucket` + CloudFront invalidation |
| **Docker + VPS** | `docker build -t frontend . && docker run -p 80:80 frontend` |

---

## 🧪 Testing Strategy

### Test Pyramid

```
         ╱╲
        ╱ E2E ╲           ← 5% — Playwright full-page tests
       ╱───────╲
      ╱Integration╲        ← 20% — Component + service interaction
     ╱─────────────╲
    ╱   Unit Tests   ╲    ← 75% — Isolated component/service tests
   ╱───────────────────╲
```

### Running Tests

```bash
# Unit tests (Jest)
ng test

# Watch mode
ng test --watch

# With coverage
ng test --code-coverage
open coverage/water-credits-frontend/index.html

# E2E tests (Playwright)
ng e2e
```

### Testing Example

```typescript
// wallet-connect.component.spec.ts
describe('WalletConnectComponent', () => {
  let component: WalletConnectComponent;
  let walletService: jest.Mocked<WalletService>;

  beforeEach(async () => {
    walletService = {
      isInstalled: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [WalletConnectComponent],
      providers: [{ provide: WalletService, useValue: walletService }],
    }).compileComponents();

    component = TestBed.createComponent(WalletConnectComponent).componentInstance;
  });

  it('should show "Connect Wallet" when not connected', () => {
    component.connected = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connect Wallet');
  });

  it('should show wallet address when connected', () => {
    component.connected = true;
    component.address = 'GABC...DEF';
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('GABC…DEF');
  });

  it('should call walletService.connect on button click', async () => {
    walletService.connect.mockResolvedValue({ address: 'GABC...DEF', network: 'testnet' });
    component.onConnect();
    expect(walletService.connect).toHaveBeenCalled();
  });
});
```

---

## ⚡ Performance

| Technique | Implementation |
|---|---|
| **Lazy loading** | Every feature module lazy-loaded via Angular Router |
| **OnPush change detection** | All components use `ChangeDetectionStrategy.OnPush` |
| **Virtual scrolling** | `@angular/cdk/scrolling` for long lists (sensor readings, retirements) |
| **TrackBy functions** | Every `*ngFor` has a `trackBy` for optimal DOM updates |
| **Image optimization** | WebP format, lazy loading with `loading="lazy"` |
| **Preload strategy** | Quicklink preloading for likely next routes |
| **Service worker** | PWA with Angular service worker for offline dashboard |
| **Tree-shaking** | Production builds with `"optimization": true` |
| **Bundle budgets** | `maximumError: "500kb"` initial, `"2mb"` total |
| **CDN** | Chart.js, Leaflet, fonts loaded from CDN |

### Bundle Analysis

```bash
# Analyze bundle size
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/water-credits-frontend/stats.json
```

---

## ♿ Accessibility

| Standard | Target |
|---|---|
| **WCAG** | 2.1 AA |
| **Contrast ratio** | 4.5:1 minimum (text), 3:1 (large text) |
| **Keyboard navigation** | Full tab order, visible focus indicators, skip-to-content link |
| **Screen readers** | ARIA labels on all interactive elements, semantic HTML |
| **Reduced motion** | `prefers-reduced-motion` disables non-essential animations |
| **Color blindness** | Charts use patterns + labels, not just color |
| **High contrast** | `prefers-contrast: high` mode with enhanced borders |
| **Form labels** | All inputs have associated `<label>` or `aria-label` |
| **Live regions** | `aria-live="polite"` for real-time sensor updates |
| **Focus trapping** | Modals and sidebars trap focus correctly |

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for full details.

### Quick Start

```bash
git clone https://github.com/water-credits/water-credits-frontend
cd water-credits-frontend
git checkout -b feat/your-feature

npm install
cp src/environments/environment.ts.example src/environments/environment.ts
ng serve

# Make changes, then:
ng lint
ng test

git commit -m "feat: add real-time sensor gauge component"
git push origin feat/your-feature
```

### Code Style

- **Angular style guide** — Follow the [official conventions](https://angular.dev/style-guide)
- **TypeScript** — Strict mode enabled, no `any` unless absolutely necessary
- **Naming** — `feature.component.ts`, `feature.service.ts`, `feature.model.ts`
- **File structure** — One component per folder with co-located template and styles
- **SCSS** — Use design tokens from `theme/_variables.scss`, avoid magic values
- **Lint** — `ng lint` must pass with zero warnings

---

## 🗺️ Project Status & Roadmap

The project is currently in **Beta**. Core modules are scaffolded and functional against the testnet backend; API wiring and test coverage are in progress.

See [ROADMAP.md](ROADMAP.md) for the full breakdown of what's done, what's in progress, and what's planned for v1.0 and beyond.

---

## 💬 Contact & Community

| Channel | Link |
|---|---|
| **GitHub Issues** | [Bug reports & feature requests](https://github.com/water-credits/water-credits-frontend/issues) |
| **GitHub Discussions** | [Questions, ideas, general discussion](https://github.com/water-credits/water-credits-frontend/discussions) |
| **Pull Requests** | [Contribute code](https://github.com/water-credits/water-credits-frontend/pulls) |
| **Telegram** | [@Escelit](https://t.me/Escelit) — direct maintainer contact |
| **Email** | [ogazipromise81@gmail.com](mailto:ogazipromise81@gmail.com) |

For security vulnerabilities, **do not open a public issue**. Email the maintainer directly at [ogazipromise81@gmail.com](mailto:ogazipromise81@gmail.com).

For general questions, Telegram ([@Escelit](https://t.me/Escelit)) is the fastest way to reach the maintainer. GitHub Discussions is preferred for questions that benefit the whole community — they stay searchable and visible to everyone.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
  <strong>Built with Angular 🅰️ + Stellar ✨</strong>
</div>
