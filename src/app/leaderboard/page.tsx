import LeaderboardPage from "@/components/leaderboard/LeaderboardPage";
import { LeaderboardUser } from "@/app/api/leaderboard/route";

// Map GitHub usernames to canonical keys
const GITHUB_USERNAME_ALIASES: Record<string, string> = {
  kcabigon: "kyle",
};

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

interface GitHubContributorStats {
  author: {
    login: string;
    avatar_url: string;
  };
  total: number;
  weeks: Array<{
    w: number; // Unix timestamp (start of week)
    a: number; // Additions
    d: number; // Deletions
    c: number; // Commits
  }>;
}

async function getLeaderboardData(): Promise<LeaderboardUser[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];

  const REPO = "kcabigon/riff";
  const BRANCH = "develop";
  const PER_PAGE = 100;
  const MAX_PAGES = 20;

  // Fetch commits and contributor stats in parallel
  const [allCommits, contributorStats] = await Promise.all([
    fetchCommits(token, REPO, BRANCH, PER_PAGE, MAX_PAGES),
    fetchContributorStats(token, REPO),
  ]);

  // Build user map from commits
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
  }

  // Merge contributor stats (additions/deletions per week)
  for (const contributor of contributorStats) {
    const login = contributor.author.login;
    const canonicalKey = GITHUB_USERNAME_ALIASES[login];
    const key = canonicalKey || login;

    // Find matching user in map — match by canonical key or githubUsername
    let user: LeaderboardUser | undefined;
    if (userMap.has(key)) {
      user = userMap.get(key);
    } else {
      // Try to find by githubUsername
      for (const u of userMap.values()) {
        if (u.githubUsername === login) {
          user = u;
          break;
        }
      }
    }

    if (!user) continue;

    let totalAdditions = 0;
    let totalDeletions = 0;

    for (const week of contributor.weeks) {
      if (week.a === 0 && week.d === 0) continue;
      const weekDate = new Date(week.w * 1000).toISOString().split("T")[0];
      user.additionsByWeek[weekDate] =
        (user.additionsByWeek[weekDate] || 0) + week.a;
      user.deletionsByWeek[weekDate] =
        (user.deletionsByWeek[weekDate] || 0) + week.d;
      totalAdditions += week.a;
      totalDeletions += week.d;
    }

    user.totalAdditions = totalAdditions;
    user.totalDeletions = totalDeletions;
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

async function fetchContributorStats(
  token: string,
  repo: string
): Promise<GitHubContributorStats[]> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/stats/contributors`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 300 },
    }
  );

  // GitHub may return 202 if stats are being computed — return empty
  if (!res.ok || res.status === 202) return [];
  return res.json();
}

export default async function Page() {
  const users = await getLeaderboardData();

  return <LeaderboardPage users={users} />;
}
