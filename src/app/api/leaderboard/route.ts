import { NextResponse } from "next/server";

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

export interface LeaderboardUser {
  name: string;
  email: string;
  githubUsername: string;
  avatarUrl: string;
  commitsByDay: Record<string, number>;
  totalCommits: number;
}

const REPO = "kcabigon/riff";
const BRANCH = "develop";
const PER_PAGE = 100;
const MAX_PAGES = 20;

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    const allCommits: GitHubCommit[] = [];

    // Paginate through commits
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/commits?sha=${BRANCH}&per_page=${PER_PAGE}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
          next: { revalidate: 300 }, // cache for 5 minutes
        }
      );

      if (!res.ok) {
        if (res.status === 409) break; // empty repo
        throw new Error(`GitHub API error: ${res.status}`);
      }

      const commits: GitHubCommit[] = await res.json();
      if (commits.length === 0) break;

      allCommits.push(...commits);
      if (commits.length < PER_PAGE) break;
    }

    // Group by author
    const userMap = new Map<string, LeaderboardUser>();

    for (const commit of allCommits) {
      const email = commit.commit.author.email;
      const name = commit.commit.author.name;
      const date = commit.commit.author.date.split("T")[0]; // YYYY-MM-DD
      const githubUsername = commit.author?.login || "";
      const avatarUrl = commit.author?.avatar_url || "";

      if (!userMap.has(email)) {
        userMap.set(email, {
          name,
          email,
          githubUsername,
          avatarUrl,
          commitsByDay: {},
          totalCommits: 0,
        });
      }

      const user = userMap.get(email)!;
      user.commitsByDay[date] = (user.commitsByDay[date] || 0) + 1;
      user.totalCommits += 1;

      // Update avatar if we got a better one
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
      }
    }

    // Sort by total commits descending
    const users = Array.from(userMap.values()).sort(
      (a, b) => b.totalCommits - a.totalCommits
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commit data" },
      { status: 500 }
    );
  }
}
