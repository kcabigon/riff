# Riff — Design System

**Last Updated**: March 31, 2026

This is the single source of truth for Riff's visual design. Read this before building any UI.

---

## Design Philosophy

**Aesthetic: Neo-Brutalist**
- Heavy borders (no border-radius except avatars)
- Hard shadows (no blur, no spread)
- High contrast (black on white)
- Sharp, geometric forms
- Playful accent colors

**Principles:**
1. Clarity over decoration — every element has purpose
2. High contrast — excellent readability
3. Bold interactions — clear feedback on all interactive elements
4. Consistent spacing — 4px base unit
5. Reading-first — optimized typography for long-form content

---

## Colors

### Core Palette
| Name | Hex | Usage |
|------|-----|-------|
| `black` | `#000000` | Primary text, borders, shadows |
| `white` | `#FFFFFF` | Backgrounds, button fills |
| `accent-green` | `#00FF66` | Primary CTA shadows, focus states, success |
| `accent-cyan` | `#01EFFC` | Secondary CTA shadows |
| `accent-yellow` | `#EECF01` | Badges, highlights |
| `accent-orange` | `#FF6B35` | Accent (sparingly) |
| `accent-pink` | `#C01582` | Accent (sparingly) |
| `accent-purple` | `#955CB5` | Accent (sparingly) |

### Grays
| Name | Hex | Usage |
|------|-----|-------|
| `gray-light` | `#E6E6E6` | Disabled backgrounds, dividers, separators, tab borders |
| `gray-mid` | `#CCCCCC` | Placeholder icons, dashed borders |
| `gray` | `#808080` | Secondary text, helper text, inactive tabs, metadata, muted labels |
| `gray-disabled` | `#9C9C9C` | Disabled text, inactive form fields, placeholders |
| `gray-hover` | `#F5F5F5` | Hover backgrounds (dropdown items, drop zones) |

### Semantic Colors
| Name | Hex | Usage |
|------|-----|-------|
| `destructive` | `#DC2626` | All negative signals: errors, form validation, destructive actions, deadline warnings, remove buttons |

### Color Rules
- **Success**: Use black text (no special success color)
- **Warning**: Use black text unless deadline-related (then `destructive`)
- **Focus state**: Always green `#00FF66` border
- **Disabled state**: Gray `#9C9C9C` text on `#E6E6E6` background

---

## Typography

### Font Families
| Family | CSS Variable | Usage |
|--------|-------------|-------|
| DM Serif Text | `--font-dm-serif-text` | UI headings, avatar initials, landing hero |
| DM Sans | `--font-dm-sans` | All UI text, buttons, labels, body |
| Playfair Display | `--font-playfair` | Navbar wordmark, editor content |
| Over the Rainbow | `--font-over-the-rainbow` | Handwriting accent (welcome notes) |

### Type Scale
| Element | Size | Font | Weight | Line Height |
|---------|------|------|--------|-------------|
| Hero | 96px | DM Serif Text | 400 | 1.0 |
| h1 | 32px | DM Serif Text | 400 | 1.2 |
| h2 | 24px | DM Serif Text | 400 | 1.2 |
| h3 | 20px | DM Serif Text | 400 | 1.2 |
| h4 | 16px | DM Serif Text | 400 | 1.2 |
| h5 | 12px | DM Serif Text | 400 | 1.4 |
| Body | 16px | DM Sans | 300 | 1.6 |
| Body bold | 16px | DM Sans | 700 | 1.6 |
| Small | 12px | DM Sans | 300 | 1.4 |
| Small bold | 12px | DM Sans | 700 | 1.4 |
| Tiny | 11px | DM Sans | 700 | 1.4 |
| Editor | 18px | Playfair Display | 400 | 1.6 |

### Font Weight Reference
- **300** (Light) — most UI text, buttons, labels
- **400** (Regular) — DM Serif Text headings
- **500** (Medium) — active tab labels
- **700** (Bold) — emphasis, numbers, badges

---

## Spacing

### Scale (4px base unit)
```
1  = 4px   — Small gaps (metadata spacing)
2  = 8px   — Between rows, small padding
3  = 12px  — Gaps, button spacing, countdown gaps
4  = 16px  — Between sections
5  = 20px  — Between cards
6  = 24px  — Content padding, modal body padding
8  = 32px  — Card padding
10 = 40px  — Large spacing, modal padding
12 = 48px  — Button horizontal padding, drop zones
14 = 56px  — Between major sections
```

### Layout Constraints
- **Mobile**: 320–767px, 24px side padding
- **Tablet**: 768–1023px
- **Desktop**: 1024px+, max-width 1000px, centered

---

## Borders & Shadows

### Borders
| Style | Usage |
|-------|-------|
| `2px solid #000` | Primary borders (buttons, cards, inputs, modals) |
| `1px solid #E6E6E6` | Separators, tab borders, dividers |
| `2px dashed #CCCCCC` | Upload drop zones |
| **Radius**: `0px` everywhere | Except avatars: `64px` (fully round) |

### Shadows (Neo-Brutalist)
| Name | Value | Usage |
|------|-------|-------|
| `brutal-sm` | `2px 2px 0px 0px #000000` | Avatars, small elements |
| `brutal-sm-white` | `2px 2px 0px 0px #FFFFFF` | Nav dropdown on dark bg |
| `brutal` | `8px 8px 0px 0px #000000` | Cards, modals |
| `brutal-green` | `8px 8px 0px 0px #00FF66` | Primary CTA hover/default |
| `brutal-cyan` | `8px 8px 0px 0px #01EFFC` | Secondary CTA hover/default |
| `brutal-half` | `4px 4px 0px 0px #000000` | Dropdown menus, pressed buttons |

---

## Interaction States

### Primary Button (PrimaryButton)
For modals, forms, and login flows — anywhere on a noisy or modal background.
| State | Background | Border | Shadow | Text |
|-------|-----------|--------|--------|------|
| Default | Green `#00FF66` | 2px solid black | `8px 8px 0 0 #000000` | Black, DM Sans 300 16px |
| Hover | White | 2px solid black | `8px 8px 0 0 #00FF66` | Black |
| Active/Pressed | Green `#00FF66` | 2px solid black | `4px 4px 0 0 #00FF66` + translate(4px,4px) | Black |
| Disabled | White | 2px solid `#9C9C9C` | None | `#9C9C9C` |

### Secondary Button (SecondaryButton)
For join flows and secondary CTAs (e.g. landing page, about page, onboarding). Same as PrimaryButton but cyan.
| State | Background | Border | Shadow | Text |
|-------|-----------|--------|--------|------|
| Default | Cyan `#01EFFC` | 2px solid black | `8px 8px 0 0 #000000` | Black, DM Sans 300 16px |
| Hover | White | 2px solid black | `8px 8px 0 0 #01EFFC` | Black |
| Active/Pressed | Cyan `#01EFFC` | 2px solid black | `4px 4px 0 0 #01EFFC` + translate(4px,4px) | Black |
| Disabled | White | 2px solid `#9C9C9C` | None | `#9C9C9C` |

### RiffCTA Button (RiffCTAButton)
For in-context card and page actions — club page, riff page, editor (anything on a clean white surface).
| State | Background | Border | Shadow | Text |
|-------|-----------|--------|--------|------|
| Default | White | 2px solid black | `8px 8px 0 0 #00FF66` | Black, DM Sans 300 16px |
| Hover | Green `#00FF66` | 2px solid black | `8px 8px 0 0 #000000` | Black |

### Form Inputs (TextInput)
| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | White | 2px solid black | Black |
| Focus | White | 2px solid green `#00FF66` | Black |
| Error | White | 2px solid `#DC2626` | Black + destructive helper text below |
| Disabled | `#E6E6E6` | 2px solid `#9C9C9C` | `#9C9C9C` |
| Placeholder | — | — | `#9C9C9C` |

### Focus State (Global)
All interactive elements: border/outline changes to green `#00FF66`.

---

## Shared Component Catalog

**IMPORTANT: Always reuse these components before building anything new.**

### Buttons & Inputs (`src/components/`)
| Component | File | Use for |
|-----------|------|---------|
| **PrimaryButton** | `PrimaryButton.tsx` | Primary actions in modals/forms. Green bg at rest. Props: `loading`, `disabled` |
| **SecondaryButton** | `SecondaryButton.tsx` | Secondary CTAs, join flows. Cyan bg at rest. Same props as PrimaryButton |
| **CTAButton** | `CTAButton.tsx` | RiffCTA visual pattern — white bg + green shadow at rest, green bg on hover. Use for any in-context page/card action. Props: standard button props |
| **RiffCTAButton** | `riffs/RiffCTAButton.tsx` | Smart wrapper around CTAButton for riff actions (Join, Start/Continue Writing, View Submission). Handles join API, draft creation, and navigation. Props: `riffId`, `isJoined`, `hasDraft`, `hasSubmitted`, `existingPieceId`, `onJoin`, `stopPropagation` |
| **TextInput** | `TextInput.tsx` | All form inputs. Props: `error`, `multiline`, `rows` |

### Navigation & Actions (`src/components/`)
| Component | File | Use for |
|-----------|------|---------|
| **BackButton** | `BackButton.tsx` | Back navigation. Props: `href`, `onClick`, `size` |
| **CloseButton** | `CloseButton.tsx` | Close/dismiss actions. Props: `onClick`, `size` |

### Layout & Display (`src/components/` and `src/components/shared/`)
| Component | File | Use for |
|-----------|------|---------|
| **Modal** | `shared/Modal.tsx` | All modals/dialogs. Props: `isOpen`, `onClose`, `title`, `size` ("sm" 400px \| "md" 480px \| "lg" 600px), `footer` |
| **Avatar** | `shared/Avatar.tsx` | User avatars everywhere. Props: `user` (AvatarUser), `size` (24\|32\|40\|48), `badge` ("admin"\|"moderator") |
| **AvatarStack** | `shared/AvatarStack.tsx` | Overlapping avatar groups. Props: `users`, `size`, `onAvatarClick` |
| **Dropdown** | `shared/Dropdown.tsx` | All dropdown menus. Props: `trigger`, `items`, `align` ("left"\|"right"). Styling: 2px black border, 4px black shadow, `#F5F5F5` hover, `#E6E6E6` dividers |
| **ImageUploadModal** | `shared/ImageUploadModal.tsx` | **Go-to for all image uploads.** Crop, drag-drop, HEIC/GIF support. Use as a building block — wrap in a Modal, embed in a tab, or use standalone. Props: `isOpen`, `onClose`, `onSelect`, `title`, `aspectRatio` (16/9 covers, 1 avatars, 3/1 banners), `cropShape` ("rect"\|"round"), `currentImage`, `existingImages` |
| **AdminBadge** | `shared/AdminBadge.tsx` | Host/moderator role indicator. Props: `type`, `size` |
| **EnvironmentBadge** | `shared/EnvironmentBadge.tsx` | Dev/staging/prod label |

### Decorative (`src/components/`)
| Component | File | Use for |
|-----------|------|---------|
| **NoiseBackground** | `NoiseBackground.tsx` | Fractal noise SVG backdrop. Props: `fillMode` |
| **Tagline** | `Tagline.tsx` | Colored vector highlight text. Props: `text`, `color` |
| **WelcomeNote** | `WelcomeNote.tsx` | Handwriting-font message box |

### Logo Assets (`public/images/`)
| Asset | File | Use for |
|-------|------|---------|
| **Riff logo (black shadow)** | `riff_logo_black_shadow.svg` | Logo on white backgrounds |

### Auth & Onboarding
| Component | File | Use for |
|-----------|------|---------|
| **AuthCard** | `auth/AuthCard.tsx` | Full-screen auth layout with noise background and logo |
| **OnboardingCard** | `onboarding/OnboardingCard.tsx` | Full-screen onboarding layout. Props: `showLogo`, `headerContent` |
| **OnboardingProgress** | `onboarding/OnboardingProgress.tsx` | Step dots. Props: `currentStep`, `totalSteps` |

---

## Component Patterns

### Cards
- Container: white background, 2px solid black border
- Padding: 32px
- Hover: shadow changes color (e.g., black → cyan or green)
- No border-radius

### Modals
- Backdrop: `rgba(0,0,0,0.4)`
- Container: white background, 2px solid black border, 8px black shadow
- Padding: 40px
- Title: DM Serif Text 24px
- Sizes: sm (400px), md (480px), lg (600px)
- Close: CloseButton in top-right
- Focus trap + ESC to close

### Tabs
- Active tab: `fontWeight: 500`, color `#000`, 2px solid black bottom border
- Inactive tab: `fontWeight: 300`, color `#808080`, 2px solid transparent bottom border
- Divider below tabs: 1px solid `#E6E6E6`

### Upload Drop Zones
- Border: 2px dashed `#CCCCCC`
- Drag-over: border `#000`, background `#F5F5F5`
- Icon: 32px image placeholder
- Text: "Drop an image here or click to upload" (DM Sans 14px `#808080`)
- Subtext: file types + max size (DM Sans 12px `#808080`)

---

## Responsive Patterns

### Breakpoints
- **Mobile**: 320–767px
- **Tablet**: 768–1023px
- **Desktop**: 1024px+

### Layout Changes
- **Cards**: Stack vertically on mobile (flex-col), horizontal on desktop (flex-row)
- **Padding**: 24px mobile → 32px desktop
- **Content width**: Full width – 48px on mobile, max 1000px centered on desktop
- **Banner**: 200px height mobile, 320px desktop

---

## Still To Decide
- Toast notification styles
- Loading states / spinner component
- Dark mode strategy
- Additional card variants (comment card)
