import { NextResponse } from "next/server";

// Node runtime so we can use Buffer for base64 image encoding.
export const runtime = "nodejs";

const GH_API = "https://api.github.com";
const OWNER = process.env.GITHUB_REPO_OWNER || "Ketankham";
const REPO = process.env.GITHUB_REPO_NAME || "the-raising-club";
// Screenshots are committed here (kept off the production branch so they
// never trigger a deploy — see vercel.json git.deploymentEnabled).
const ASSET_BRANCH = "feedback-assets";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

// Ensure the asset branch exists; create it from the default branch if not.
async function ensureAssetBranch(token: string): Promise<boolean> {
  const existing = await fetch(
    `${GH_API}/repos/${OWNER}/${REPO}/git/ref/heads/${ASSET_BRANCH}`,
    { headers: ghHeaders(token) },
  );
  if (existing.ok) return true;

  const repoRes = await fetch(`${GH_API}/repos/${OWNER}/${REPO}`, {
    headers: ghHeaders(token),
  });
  if (!repoRes.ok) return false;
  const base = ((await repoRes.json()) as { default_branch?: string }).default_branch || "main";

  const baseRef = await fetch(
    `${GH_API}/repos/${OWNER}/${REPO}/git/ref/heads/${base}`,
    { headers: ghHeaders(token) },
  );
  if (!baseRef.ok) return false;
  const sha = ((await baseRef.json()) as { object?: { sha?: string } }).object?.sha;
  if (!sha) return false;

  const created = await fetch(`${GH_API}/repos/${OWNER}/${REPO}/git/refs`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({ ref: `refs/heads/${ASSET_BRANCH}`, sha }),
  });
  return created.ok;
}

// Commit the screenshot to the asset branch and return an inline-renderable URL.
async function uploadScreenshot(
  token: string,
  file: File,
  issueNumber: number,
): Promise<string | null> {
  try {
    if (!(await ensureAssetBranch(token))) return null;
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
    const path = `screenshots/issue-${issueNumber}-${Date.now()}.${ext}`;

    const put = await fetch(
      `${GH_API}/repos/${OWNER}/${REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: ghHeaders(token),
        body: JSON.stringify({
          message: `feedback: screenshot for #${issueNumber}`,
          content: buffer.toString("base64"),
          branch: ASSET_BRANCH,
        }),
      },
    );
    if (!put.ok) return null;
    return `https://github.com/${OWNER}/${REPO}/blob/${ASSET_BRANCH}/${path}?raw=true`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Require a signed-in session — prevents anonymous abuse of the GitHub token.
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return jsonError("Must be signed in to submit feedback.", 401);

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return jsonError(
      "Feedback isn’t configured yet — set GITHUB_TOKEN (and optionally GITHUB_REPO_OWNER / GITHUB_REPO_NAME).",
      500,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data.", 400);
  }

  const type = String(formData.get("type") || "bug");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const pageUrl = String(formData.get("pageUrl") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const screenshot = formData.get("screenshot") as File | null;

  if (!title) return jsonError("Title is required.", 400);
  if (title.length > 200) return jsonError("Title is too long.", 400);
  if (!description) return jsonError("Description is required.", 400);
  if (description.length > 5000) return jsonError("Description is too long.", 400);

  // Validate screenshot type using MIME (client-supplied but screened server-side)
  if (screenshot && screenshot.size > 0) {
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(screenshot.type)) return jsonError("Screenshot must be a PNG, JPEG, WebP, or GIF image.", 400);
    if (screenshot.size > 5 * 1024 * 1024) return jsonError("Screenshot must be under 5 MB.", 400);
  }

  const typeLabel =
    type === "bug" ? "Bug" : type === "improvement" ? "Improvement" : "Idea";

  const buildBody = (screenshotMd = "") =>
    [
      "## Description",
      description,
      "",
      `**Page:** ${pageUrl || "—"}`,
      `**Reporter:** ${email || "Anonymous"}`,
      screenshotMd,
    ]
      .join("\n")
      .trim();

  // 1) Create the issue
  const ghRes = await fetch(`${GH_API}/repos/${OWNER}/${REPO}/issues`, {
    method: "POST",
    headers: ghHeaders(token),
    body: JSON.stringify({
      title: `[${typeLabel}] ${title}`,
      body: buildBody(),
      labels: [type, "feedback"],
    }),
  });

  if (!ghRes.ok) {
    const err = await ghRes.text();
    return jsonError(`GitHub issue creation failed: ${err}`, 502);
  }

  const issue = (await ghRes.json()) as { html_url: string; number: number };

  // 2) Attach screenshot (commit to asset branch, embed in body)
  if (screenshot && screenshot.size > 0) {
    const url = await uploadScreenshot(token, screenshot, issue.number);
    if (url) {
      await fetch(
        `${GH_API}/repos/${OWNER}/${REPO}/issues/${issue.number}`,
        {
          method: "PATCH",
          headers: ghHeaders(token),
          body: JSON.stringify({
            body: buildBody(`\n## Screenshot\n![Screenshot](${url})`),
          }),
        },
      );
    }
  }

  return NextResponse.json({
    issueUrl: issue.html_url,
    issueNumber: issue.number,
  });
}
