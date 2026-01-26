# Riff - Architecture Documentation

## Project Overview

**Riff** is a private essay-sharing platform designed for creative communities to connect through long-form writing. It combines features of a collaborative text editor, essay showcase, book club functionality, and a social feed with notifications. The platform enables users to create "clubs" (groups), launch "riffs" (writing prompts/challenges within clubs), share essays with granular permission controls, and participate in threaded comments with text-level selections.

**Application Type**: Full-stack web application (Next.js-based SPA with REST API backend)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.7 (React 19.2.1)
- **Language**: TypeScript 5
- **Styling**: 
  - Tailwind CSS 4.0.0 with PostCSS
  - Custom CSS variables for theme
- **Rich Text Editor**: 
  - Tiptap 3.11.1 (headless editor framework)
  - Extensions: starter-kit, character-count, image, link, text-align, YouTube, Spotify (custom), image-resize
- **Type Safety**: TypeScript with strict mode enabled

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **ORM**: Prisma 6.1.0 (with Postgres adapter)
- **Authentication**: NextAuth.js 5.0.0-beta.30
- **Password Hashing**: bcryptjs 3.0.3
- **Session Management**: JWT-based sessions

### Database
- **Primary DB**: PostgreSQL (via Supabase)
- **Connection Pooling**: PgBouncer (configured for connection limits)
- **Schema Management**: Prisma migrations
- **Authentication Adapter**: Prisma adapter for NextAuth

### Development Tools
- **Linting**: ESLint 9 with Next.js config
- **Code Formatting**: Prettier 3.1.0
- **Package Manager**: npm (with lock file)
- **Module Resolution**: TypeScript bundler mode

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (Next.js/React)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages: Home, Test Pages (Auth, Editor, Comments)    │  │
│  │  Components: Editor, Comments, Pieces, etc.          │  │
│  │  Hooks: useTextSelection, custom React hooks         │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│              API Routes (Next.js Routes Handler)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ /api/clubs          - Club CRUD & membership         │  │
│  │ /api/riffs          - Riff management & participants │  │
│  │ /api/pieces         - Essay creation & versioning    │  │
│  │ /api/comments       - Threaded comments              │  │
│  │ /api/circles        - DEPRECATED circle endpoints    │  │
│  │ /api/auth           - Authentication (NextAuth)      │  │
│  │ /api/upload/image   - Image upload handler           │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Prisma ORM Layer                          │
│              (Type-safe DB access, migrations)              │
├─────────────────────────────────────────────────────────────┤
│                   PostgreSQL Database                        │
│  (Supabase-hosted with PgBouncer connection pooling)       │
└─────────────────────────────────────────────────────────────┘
```

### Data Model Architecture

The application uses a **hierarchical, multi-tenant model** with gradual migration from deprecated Circle to new Club architecture:

**New Architecture (Clubs/Riffs)**:
- **Clubs**: User groups with admin/moderator roles
- **Riffs**: Writing prompts/challenges scoped to clubs
- **Shares**: Multi-level sharing (CLUB, RIFF, INDIVIDUAL, PUBLIC)
- **Comments**: Club/Riff-contextual with text selection support

**Legacy Architecture (Circles)** - Maintained for backward compatibility:
- **Circles**: Deprecated group model
- **CirclePrompts**: Deprecated prompt system
- **PieceShare**: Deprecated sharing mechanism

**Core Entities**:
- **Users**: Identity + authentication
- **Pieces**: Essays with versioning
- **PieceVersions**: Frozen snapshots when shared
- **Collections**: Organizational groupings of pieces
- **Notifications**: Event system for user activities
- **Comments**: Threaded discussions with character-level anchoring

### Authentication Flow

```
User Input (Credentials) 
    ↓
NextAuth Credentials Provider
    ↓
bcryptjs password comparison
    ↓
PrismaAdapter (stores session/tokens)
    ↓
JWT token generation
    ↓
Session stored in JWT (client + server)
    ↓
requireAuth() middleware validates on API routes
```

### API Route Structure

API routes follow Next.js file-based routing:

```
src/app/api/
├── auth/
│   ├── [...nextauth]/       # NextAuth handler
│   └── register/             # User registration
├── clubs/                    # Club management
│   ├── route.ts             # List/create clubs
│   ├── [id]/                # Get/update/delete club
│   ├── [id]/members/        # Manage club members
│   └── [id]/riffs/          # Riffs in club
├── riffs/                   # Riff management
│   ├── [id]/                # Get/update/delete riff
│   ├── [id]/participants/   # Join/leave riff
│   └── [id]/pieces/         # Submit pieces to riff
├── pieces/                  # Essay management
│   ├── route.ts             # Create piece
│   ├── [id]/                # Get/update piece
│   ├── [id]/versions/       # Piece versioning
│   ├── [id]/autosave/       # Auto-save functionality
│   ├── [id]/share/          # Share piece
│   └── [id]/unshare/        # Remove share
├── comments/                # Comment management
│   ├── route.ts             # List comments
│   ├── create/              # Create comment
│   └── [id]/                # Update/delete comment
├── circles/                 # DEPRECATED endpoints
│   └── [various paths]/
└── upload/image/            # Image upload
```

---

## Project Structure & Organization

```
riff/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (fonts, metadata)
│   │   ├── page.tsx                  # Home page
│   │   ├── globals.css               # Global styles
│   │   ├── api/                      # API routes (see above)
│   │   └── test-*/                   # Test pages (editor, auth, comments)
│   │
│   ├── components/                   # Reusable React components
│   │   ├── editor/                   # Rich text editor
│   │   │   ├── TiptapEditor.tsx      # Main editor component
│   │   │   ├── EditorToolbar.tsx     # Formatting toolbar
│   │   │   └── extensions/           # Custom Tiptap extensions
│   │   │       └── Spotify.ts        # Spotify embed extension
│   │   │
│   │   ├── comments/                 # Comment system components
│   │   │   ├── CommentThread.tsx     # Thread display
│   │   │   ├── CommentItem.tsx       # Single comment
│   │   │   ├── CommentComposer.tsx   # Create/edit comment
│   │   │   ├── CommentButton.tsx     # Trigger comment
│   │   │   └── CommentHighlights.tsx # Text selection UI
│   │   │
│   │   └── pieces/                   # Essay/piece components
│   │       ├── PieceViewer.tsx       # Display piece
│   │       ├── PieceStatus.tsx       # Status indicator
│   │       ├── VersionTimeline.tsx   # Version history UI
│   │       └── ShareModal.tsx        # Share dialog
│   │
│   ├── hooks/                        # Custom React hooks
│   │   └── useTextSelection.ts       # Text selection detection
│   │
│   ├── lib/                          # Utility libraries
│   │   ├── prisma.ts                 # Prisma singleton
│   │   ├── auth.ts                   # NextAuth configuration
│   │   └── auth-utils.ts             # Auth helpers (requireAuth)
│   │
│   └── types/                        # TypeScript type definitions
│       └── index.ts                  # Central type hub (domain types)
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   └── migrations/                   # Database migrations
│
├── public/
│   ├── uploads/                      # User-uploaded files
│   └── [static assets]/
│
├── .claude/                          # Claude IDE settings
├── docs/                             # Documentation
├── .env                              # Runtime environment variables
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore rules
├── .prettierrc                       # Prettier config
├── eslint.config.mjs                 # ESLint rules
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── postcss.config.mjs                # PostCSS configuration
├── package.json                      # npm dependencies
├── package-lock.json                 # Locked dependency versions
├── README.md                         # Project README
└── TEST_REPORT_COMMENT_SYSTEM.md     # Testing documentation
```

---

## Common Development Commands

### Setup & Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev           # Run migrations in dev
npx prisma generate             # Generate Prisma client
npx prisma db push              # Push schema to database

# Generate auth secret (for .env)
openssl rand -base64 32
```

### Development

```bash
# Start development server (with hot reload)
npm run dev
# App runs at http://localhost:3000

# Run type checking
npx tsc --noEmit

# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint
```

### Building & Deployment

```bash
# Build production bundle
npm run build

# Start production server
npm start

# Run built app locally (after build)
npm start
```

### Database Management

```bash
# View/edit data with Prisma Studio
npx prisma studio

# Create migration from schema changes
npx prisma migrate dev --name <migration_name>

# Reset database (destructive)
npx prisma migrate reset

# Generate new Prisma client after schema updates
npx prisma generate

# Seed database (if seed.ts exists)
npx prisma db seed
```

---

## Important Configuration Files

### Environment Variables (.env)

```
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[db]?pgbouncer=true&connection_limit=1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[generated-secret]
```

### Key Config Files

| File | Purpose |
|------|---------|
| `tsconfig.json` | TypeScript compiler options; path alias `@/*` → `src/*` |
| `next.config.ts` | Next.js build and runtime configuration |
| `tailwind.config.ts` | CSS utility framework configuration |
| `postcss.config.mjs` | CSS post-processor plugins (@tailwindcss/postcss) |
| `eslint.config.mjs` | Code linting rules (extends Next.js config) |
| `.prettierrc` | Code formatter rules (80 char line width, semicolons) |
| `prisma/schema.prisma` | Database schema definition and relationships |

---

## Database Schema Highlights

### Key Models

**Multi-Tenant Organization**:
- Club (group with admin)
- ClubMember (role-based: ADMIN, MODERATOR, MEMBER)
- Riff (writing prompt scoped to club)
- RiffParticipant (users in riff)

**Content Management**:
- Piece (essay/article)
- PieceVersion (frozen snapshot for sharing)
- PieceRiff (piece submission to riff)
- Share (multi-level sharing with types: CLUB, RIFF, INDIVIDUAL, PUBLIC)

**Collaboration**:
- Comment (threaded, with text selection anchors: selectionStart, selectionEnd)
- Collection (organize pieces)
- CollectionPiece (junction table)

**Engagement**:
- Notification (event system with types: CLUB_INVITATION, RIFF_CREATED, NEW_COMMENT, etc.)

### Relationships

- One-to-many: User → Pieces, Clubs, Riffs
- Many-to-many: Clubs ↔ Users (via ClubMember)
- Many-to-many: Riffs ↔ Users (via RiffParticipant)
- Hierarchical: Piece → PieceVersion → Comment
- Contextual: Comments tied to Club/Riff context (new) or Circle (deprecated)

---

## Authentication & Authorization

### Auth Strategy
- **Provider**: NextAuth.js with Credentials provider
- **Session Type**: JWT (stored client-side)
- **Password Security**: bcryptjs hashing
- **Adapter**: PrismaAdapter for NextAuth

### Protected Routes
API routes use `requireAuth()` middleware:

```typescript
import { requireAuth } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const user = await requireAuth(); // Throws if unauthorized
  // ... rest of handler
}
```

### User Model Fields
- `id` (CUID): Unique identifier
- `email`: Unique, used for login
- `username`: Unique display name
- `password`: Hashed (bcryptjs)
- `name`: Full name
- `bio`, `avatarUrl`: Profile info

---

## Testing & Documentation

### Test Pages Available
- `/test-editor`: Rich text editor functionality
- `/test-editor-v2`, `/test-editor-v3`: Editor iterations
- `/test-auth`: Authentication flow testing
- `/test-comments`: Comment system testing
- `/test-clubs-api`: Club API testing

### Documentation Files
- `README.md`: High-level project overview
- `TEST_REPORT_COMMENT_SYSTEM.md`: Detailed comment system testing

---

## Key Features & Architecture Patterns

### Rich Text Editing
- **Tiptap Editor**: Headless editor with configurable extensions
- **Auto-save**: Debounced saves to DB
- **Media Support**: Images (resizable), YouTube, Spotify embeds
- **Text Alignment & Formatting**: Bold, italic, lists, quotes, etc.

### Comment System
- **Threaded Replies**: Parent-child relationships
- **Text Selection**: Anchor comments to specific text (selectionStart/End)
- **Context Awareness**: Comments tied to Club/Riff context
- **User Attribution**: Author tracking with timestamps

### Multi-Level Sharing
- **Club-level**: All club members can see
- **Riff-level**: Only riff participants can see
- **Individual**: Share with specific users
- **Public**: View-only with link (no editing/comments)

### Version Control
- **Piece Versions**: Frozen snapshots when sharing
- **Version History**: Track all shared versions
- **Comments per Version**: Comments tied to specific version

### Role-Based Access
- **Club Admin**: Creator, permanent role
- **Club Moderator**: Rotatable role among members
- **Club Member**: Default role
- **Riff Participant**: Users who joined the riff

---

## Development Best Practices

1. **Type Safety**: Use TypeScript strictly; define types in `src/types/index.ts`
2. **API Patterns**: Follow REST conventions in `src/app/api/`
3. **Component Structure**: Separate concerns (editor, comments, pieces)
4. **Database Access**: Use Prisma ORM exclusively; no raw SQL
5. **Authentication**: Always use `requireAuth()` on protected routes
6. **Code Style**: Run `npm run format` before committing
7. **Linting**: Run `npm run lint` to catch issues

---

## Migration Status

The application is in **transition** from deprecated Circle architecture to new Club/Riff architecture:

- **New Models**: Club, ClubMember, Riff, RiffParticipant, Share (with shareType)
- **Active Development**: Club/Riff features, multi-level sharing
- **Legacy Support**: Circle, CirclePrompt, PieceShare models still available
- **Deprecation Path**: Old circle endpoints exist but new features use Club/Riff

---

## Resources & References

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs/
- **NextAuth.js Docs**: https://next-auth.js.org/
- **Tiptap Docs**: https://www.tiptap.dev/
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
