/**
 * Replace Next.js version string in build files
 * Reads versions from package.json and env variable
 */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";

const projectRoot = process.cwd();

// Get current Next.js version from package.json
function getCurrentVersion() {
  const packageJson = JSON.parse(
    readFileSync(join(projectRoot, "package.json"), "utf-8")
  );
  const versionString =
    packageJson.dependencies?.next || packageJson.devDependencies?.next || null;

  if (!versionString) {
    throw new Error("Next.js version not found in package.json");
  }

  // Extract version number (remove ^, ~, >=, etc.)
  const match = versionString.match(/(\d+\.\d+\.\d+)/);
  if (!match) {
    throw new Error(`Invalid Next.js version format: ${versionString}`);
  }

  return match[1];
}
// Get target version from env or use default
const CURRENT_VERSION = getCurrentVersion();
const TARGET_VERSION = process.env.NEXT_TARGET_VERSION || "14.3.0";

// Escape dots for regex
const escapeVersion = (v) => v.replace(/\./g, "\\.");

// Generate replacement patterns dynamically
function generateReplacements() {
  const current = escapeVersion(CURRENT_VERSION);
  const target = TARGET_VERSION;

  return [
    // next@X.Y.Z_@babel+core (with hash)
    {
      pattern: new RegExp(
        `next@${current}_@babel\\+core@\\d+\\.\\d+_[0-9a-f]{32}`,
        "g"
      ),
      replacement: `next@${target}_@babel+core`,
    },
    // next@X.Y.Z_@babel+core (without hash)
    {
      pattern: new RegExp(`next@${current}_@babel\\+core`, "g"),
      replacement: `next@${target}_@babel+core`,
    },
    // @next+env@X.Y.Z
    {
      pattern: new RegExp(`@next\\+env@${current}`, "g"),
      replacement: `@next+env@${target}`,
    },
    // "version":"X.Y.Z" (in JSON)
    {
      pattern: new RegExp(`"version"\\s*:\\s*"${current}"`, "g"),
      replacement: `"version":"${target}"`,
    },
    // version:"X.Y.Z" (without quotes around key)
    {
      pattern: new RegExp(`version\\s*:\\s*"${current}"`, "g"),
      replacement: `version:"${target}"`,
    },
    // Any next@X.Y.Z pattern (catch-all)
    {
      pattern: new RegExp(`next@${current}`, "g"),
      replacement: `next@${target}`,
    },
  ];
}

const REPLACEMENTS = generateReplacements();

// Find all text files recursively
async function findFiles(dir) {
  const files = [];
  try {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await findFiles(fullPath)));
      } else if (
        [".js", ".mjs", ".json", ".html", ".txt", ".map"].some((ext) =>
          fullPath.endsWith(ext)
        )
      ) {
        files.push(fullPath);
      }
    }
  } catch {
    // Ignore errors
  }
  return files;
}

// Replace version in file
function replaceVersionInFile(filePath) {
  try {
    let content = readFileSync(filePath, "utf-8");
    const original = content;

    for (const { pattern, replacement } of REPLACEMENTS) {
      content = content.replace(pattern, replacement);
    }

    if (content !== original) {
      writeFileSync(filePath, content, "utf-8");
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Main function
async function main() {
  console.log(
    `[next-fingerprint-guard] 🔍 Replacing Next.js ${CURRENT_VERSION} -> ${TARGET_VERSION}...`
  );

  const nextDir = join(projectRoot, ".next");

  if (!existsSync(nextDir)) {
    console.log(
      "[next-fingerprint-guard] ⚠️  .next directory not found. Run 'pnpm build' first."
    );
  }

  const files = await findFiles(nextDir);
  const modified = files.filter(replaceVersionInFile);

  if (modified.length > 0) {
    console.log(
      `[next-fingerprint-guard] ✅ Replaced in ${modified.length} file(s)`
    );
  } else {
    console.log(`[next-fingerprint-guard] ⚠️  No replacements found`);
  }
}

main().catch((error) => {
  console.error("[next-fingerprint-guard] ❌ Error:", error.message);
});
