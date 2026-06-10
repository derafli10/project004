# Project004 - Grade Optimizer & KPI Dashboard

Enterprise-scale Academic Performance Management System built for Computer Engineering Technology students at IPB University.

## Overview

This system provides real-time grading parameter transparency with predictive analytics to enable students to achieve a perfect 4.00 GPA by identifying and mitigating academic drop risks from Week 1 of the semester.

## Technology Stack

- **Framework**: Next.js 15+ (App Router, React Server Components, Server Actions)
- **Language**: TypeScript 5+ (strict mode, no implicit any)
- **Database**: PostgreSQL 16+ with row-level security
- **ORM**: Prisma 5+ with typed query builder
- **Styling**: Tailwind CSS 3+ with Industrial Brutalist design tokens
- **Validation**: Zod 3+ for runtime type safety
- **Testing**: Vitest + fast-check for property-based testing

## Architectural Guardrails

This project follows four mandatory architectural constraints:

1. **Integer-Based Precision Mathematics** - Eliminates floating-point errors
2. **Strict Multi-Tenant Data Isolation** - Prevents cross-tenant data leakage
3. **Industrial Brutalist Design System** - Maximizes information clarity
4. **Production-Ready Code Standards** - Zero placeholders, complete implementations

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 16+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Initialize Prisma and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode

## Design System

### Colors

- **Background**: #09090B (Brutal Black)
- **Accent**: #FF4500 (Brutal Orange)
- **Warning**: #FB8C00 
- **Success**: #10B981
- **Border**: #E2E8F0

### Typography

- **Headings**: Space Grotesk
- **Numeric**: Space Mono (monospace for decimal alignment)
- **Body**: Inter

### Principles

- High-contrast colors against dark background
- Thick borders (2px minimum)
- Sharp corners (0px border-radius)
- Hard shadows for depth
- Utilitarian, information-dense layouts

## License

Proprietary - All Rights Reserved
