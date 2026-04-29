interface GitHubRepo {
  full_name: string;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
}

interface GitHubTreeItem {
  path: string;
  type: string;
  size?: number;
}

export class GitHubClient {
  private token: string;
  private baseUrl = "https://api.github.com";

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "TeamForge-App",
      },
    });

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  async getRepo(owner: string, repo: string): Promise<GitHubRepo> {
    return this.request(`/repos/${owner}/${repo}`);
  }

  async getTree(
    owner: string,
    repo: string,
    branch: string
  ): Promise<GitHubTreeItem[]> {
    const data = await this.request<{
      tree: GitHubTreeItem[];
      truncated: boolean;
    }>(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    return data.tree;
  }

  async getRecentCommits(
    owner: string,
    repo: string,
    since?: string
  ): Promise<GitHubCommit[]> {
    const sinceParam = since ? `&since=${since}` : "";
    return this.request(
      `/repos/${owner}/${repo}/commits?per_page=50${sinceParam}`
    );
  }

  async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref?: string
  ): Promise<string> {
    const refParam = ref ? `?ref=${ref}` : "";
    const data = await this.request<{ content: string; encoding: string }>(
      `/repos/${owner}/${repo}/contents/${path}${refParam}`
    );
    if (data.encoding === "base64") {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return data.content;
  }

  async getOpenPRs(
    owner: string,
    repo: string
  ): Promise<Array<{ number: number; title: string; state: string }>> {
    return this.request(`/repos/${owner}/${repo}/pulls?state=open&per_page=20`);
  }

  async getContributors(
    owner: string,
    repo: string
  ): Promise<Array<{ login: string; contributions: number }>> {
    return this.request(`/repos/${owner}/${repo}/contributors?per_page=20`);
  }
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /github\.com[:/]([^/]+)\/([^/.]+)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}
