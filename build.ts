const SITE_URL = "https://vincelabs.dev";

interface Post {
  slug: string;
  title: string;
  date: string;
  description?: string;
}

function extractDescription(markdown: string): string {
  // Skip the h1 title line, then grab the first real paragraph
  const lines = markdown.split("\n");
  let collecting = false;
  let paragraph = "";

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip h1 header
    if (trimmed.startsWith("# ")) continue;
    // Skip empty lines before first paragraph
    if (!collecting && trimmed === "") continue;
    // Stop at next heading, code block, image, or empty line after content
    if (collecting && (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith("```") || trimmed.startsWith("!"))) break;

    collecting = true;
    paragraph += (paragraph ? " " : "") + trimmed;
  }

  // Strip markdown links: [text](url) -> text
  paragraph = paragraph.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Strip other markdown formatting
  paragraph = paragraph.replace(/[*_`]/g, "");

  // Truncate to ~200 chars at a word boundary
  if (paragraph.length > 200) {
    paragraph = paragraph.slice(0, 200).replace(/\s+\S*$/, "") + "...";
  }

  return paragraph;
}

function generatePostPage(post: Post, description: string): string {
  const url = `${SITE_URL}/blog.html?p=${post.slug}`;
  const escapedTitle = post.title.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const escapedDesc = description.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta property="og:title" content="${escapedTitle}">
    <meta property="og:description" content="${escapedDesc}">
    <meta property="og:url" content="${url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Vince's Blog">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapedTitle}">
    <meta name="twitter:description" content="${escapedDesc}">
    <meta name="description" content="${escapedDesc}">
    <title>${escapedTitle} | Vince</title>
    <link rel="canonical" href="${url}">
    <meta http-equiv="refresh" content="0;url=/blog.html?p=${post.slug}">
</head>
<body>
    <p>Redirecting to <a href="/blog.html?p=${post.slug}">${escapedTitle}</a>...</p>
</body>
</html>`;
}

async function build() {
  const index: { posts: Post[] } = await Bun.file("posts/index.json").json();

  for (const post of index.posts) {
    const markdown = await Bun.file(`posts/${post.slug}.md`).text();
    const description = post.description || extractDescription(markdown);
    const html = generatePostPage(post, description);

    const dir = `p/${post.slug}`;
    await Bun.write(`${dir}/index.html`, html);
    console.log(`generated ${dir}/index.html`);
  }

  console.log(`done, ${index.posts.length} post(s)`);
}

build();
