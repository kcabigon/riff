import LeaderboardPage from "@/components/leaderboard/LeaderboardPage";
import { LeaderboardUser } from "@/app/api/leaderboard/route";

// Map variant emails to canonical keys
const EMAIL_ALIASES: Record<string, string> = {
  "kyle.cabigon@gmail.com": "kyle",
  "kyle@Kyles-MacBook-Air.local": "kyle",
  "kimberly@Kimberlys-MacBook-Air.local": "kyle",
  "51928844+kcabigon@users.noreply.github.com": "kyle",
};

const CANONICAL_USERS: Record<
  string,
  { name: string; email: string; githubUsername: string }
> = {
  kyle: {
    name: "Kyle Cabigon",
    email: "kyle.cabigon@gmail.com",
    githubUsername: "kcabigon",
  },
};

interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

interface CommitDetail {
  sha: string;
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

// Get the Monday of the week for a given date string
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday = 0
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().split("T")[0];
}

async function getLeaderboardData(): Promise<LeaderboardUser[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];

  const REPO = "kcabigon/riff";
  const BRANCH = "develop";
  const PER_PAGE = 100;
  const MAX_PAGES = 20;

  // Fetch commit list
  const allCommits = await fetchCommits(
    token,
    REPO,
    BRANCH,
    PER_PAGE,
    MAX_PAGES
  );

  // Fetch stats for each commit (in parallel batches)
  const statsMap = await fetchCommitStats(
    token,
    REPO,
    allCommits.map((c) => c.sha)
  );

  // Build user map
  const userMap = new Map<string, LeaderboardUser>();

  for (const commit of allCommits) {
    const rawEmail = commit.commit.author.email;
    const canonicalKey = EMAIL_ALIASES[rawEmail];
    const key = canonicalKey || rawEmail;

    const canonical = canonicalKey ? CANONICAL_USERS[canonicalKey] : null;
    const name = canonical?.name || commit.commit.author.name;
    const email = canonical?.email || rawEmail;
    const githubUsername =
      canonical?.githubUsername || commit.author?.login || "";
    const date = commit.commit.author.date.split("T")[0];
    const weekStart = getWeekStart(date);
    const avatarUrl = commit.author?.avatar_url || "";

    if (!userMap.has(key)) {
      userMap.set(key, {
        name,
        email,
        githubUsername,
        avatarUrl,
        commitsByDay: {},
        totalCommits: 0,
        additionsByWeek: {},
        deletionsByWeek: {},
        totalAdditions: 0,
        totalDeletions: 0,
      });
    }

    const user = userMap.get(key)!;
    user.commitsByDay[date] = (user.commitsByDay[date] || 0) + 1;
    user.totalCommits += 1;
    if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
    }

    // Add line stats from commit detail
    const stats = statsMap.get(commit.sha);
    if (stats) {
      user.additionsByWeek[weekStart] =
        (user.additionsByWeek[weekStart] || 0) + stats.additions;
      user.deletionsByWeek[weekStart] =
        (user.deletionsByWeek[weekStart] || 0) + stats.deletions;
      user.totalAdditions += stats.additions;
      user.totalDeletions += stats.deletions;
    }
  }

  return Array.from(userMap.values()).sort(
    (a, b) => b.totalCommits - a.totalCommits
  );
}

async function fetchCommits(
  token: string,
  repo: string,
  branch: string,
  perPage: number,
  maxPages: number
): Promise<GitHubCommit[]> {
  const allCommits: GitHubCommit[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/commits?sha=${branch}&per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) break;
    const commits: GitHubCommit[] = await res.json();
    if (commits.length === 0) break;
    allCommits.push(...commits);
    if (commits.length < perPage) break;
  }

  return allCommits;
}

async function fetchCommitStats(
  token: string,
  repo: string,
  shas: string[]
): Promise<Map<string, { additions: number; deletions: number }>> {
  const statsMap = new Map<string, { additions: number; deletions: number }>();
  const BATCH_SIZE = 15;

  for (let i = 0; i < shas.length; i += BATCH_SIZE) {
    const batch = shas.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (sha) => {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${repo}/commits/${sha}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github.v3+json",
              },
              next: { revalidate: 300 },
            }
          );
          if (!res.ok) return null;
          const data: CommitDetail = await res.json();
          return {
            sha,
            additions: data.stats.additions,
            deletions: data.stats.deletions,
          };
        } catch {
          return null;
        }
      })
    );

    for (const result of results) {
      if (result) {
        statsMap.set(result.sha, {
          additions: result.additions,
          deletions: result.deletions,
        });
      }
    }
  }

  return statsMap;
}

export default async function Page() {
  const users = await getLeaderboardData();

  return <LeaderboardPage users={users} />;
}
