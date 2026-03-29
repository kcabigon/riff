import LeaderboardPage from "@/components/leaderboard/LeaderboardPage";
import { LeaderboardUser } from "@/app/api/leaderboard/route";

async function getLeaderboardData(): Promise<LeaderboardUser[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];

  const REPO = "kcabigon/riff";
  const BRANCH = "develop";
  const PER_PAGE = 100;
  const MAX_PAGES = 20;

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

  const allCommits: GitHubCommit[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/commits?sha=${BRANCH}&per_page=${PER_PAGE}&page=${page}`,
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
    if (commits.length < PER_PAGE) break;
  }

  // Merge aliases — map variant emails/names to a canonical identity
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
      });
    }

    const user = userMap.get(key)!;
    user.commitsByDay[date] = (user.commitsByDay[date] || 0) + 1;
    user.totalCommits += 1;
    if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
    }
  }

  return Array.from(userMap.values()).sort(
    (a, b) => b.totalCommits - a.totalCommits
  );
}

export default async function Page() {
  const users = await getLeaderboardData();

  return <LeaderboardPage users={users} />;
}
