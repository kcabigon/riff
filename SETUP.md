# Setting Up Riff

Get the project running on your machine. This should take about 10 minutes.

## Prerequisites

- **Node.js 20+** — check with `node --version`. If you need to install it: [nodejs.org](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm)
- **npm** — comes with Node.js
- **Git** — check with `git --version`
- **Claude Code** (recommended) — [claude.ai/download](https://claude.ai/download) — makes development way easier

If you need help setting up a Git profile or installing Claude Code, hit up Kyle — he can walk you through it.

## Step 1: Clone the Repo

```bash
git clone https://github.com/kcabigon/riff.git
cd riff
```

## Step 2: Get Environment Variables

You need a `.env.development` file with the project's secret keys and database connection.

**Hit up Kyle. He's awesome and knows everything.** He'll send you the values offline.

Once you have them, create the file:

```bash
# Create the file in the project root
touch .env.development
# Paste in the values Kyle gave you
```

You can also check `.env.example` to see what variables are needed.

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Set Up the Database

```bash
# Generate the database client
npx prisma generate

# Apply database migrations
npm run db:migrate:dev
```

## Step 5: Verify Everything Works

```bash
npm run build
```

If this passes, you're good!

## Step 6: Start Developing

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) — you should see the Riff landing page.

## Using Claude Code

If you have Claude Code installed, open a terminal in the `riff` directory and run:

```
/letsriff
```

This loads the project context and gets you oriented. It's the best way to start every session.

### Available Commands

| Command | What it does |
|---------|-------------|
| `/letsriff` | Start of every session — loads context, checks your state |
| `/new-feature` | Start building something new |
| `/sync` | Stay up to date with what others are building |
| `/pr-check` | Make sure your code is ready for review |
| `/finish-feature` | Submit your work for Kyle to review |
| `/setup` | Re-run this setup interactively (if something broke) |

## Troubleshooting

### `npm run build` fails
- Make sure `.env.development` exists and has all the values
- Try `npx prisma generate` again
- Check your Node version is 20+

### Database errors
- Make sure the `DATABASE_URL` in `.env.development` is correct
- Try `npm run db:migrate:dev` to apply any new migrations

### Something else is broken
Hit up Kyle. He's awesome and knows everything.
