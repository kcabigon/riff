# Riff

A private essay-sharing platform for creatives to connect through long-form writing.

## Overview

Riff is a social platform designed for trendy creatives to share and discuss their own essays with friends. Think of it as a modern book club, but for your own writing.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: (TBD - PostgreSQL with Prisma)
- **Authentication**: (TBD - NextAuth.js)
- **Deployment**: (TBD - Vercel)

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install --cache .npm-cache
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
riff/
├── src/
│   └── app/           # Next.js App Router pages
│       ├── layout.tsx # Root layout
│       ├── page.tsx   # Home page
│       └── globals.css # Global styles
├── public/            # Static assets
└── ...config files
```

## License

Private - All rights reserved
