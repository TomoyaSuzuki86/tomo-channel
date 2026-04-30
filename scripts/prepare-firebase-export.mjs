import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";

const articlesDir = path.join(process.cwd(), "out", "articles");

async function copyIfPresent(source, destination) {
  try {
    await copyFile(source, destination);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

async function main() {
  let entries = [];

  try {
    entries = await readdir(articlesDir, { withFileTypes: true });
  } catch {
    return;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const articleDir = path.join(articlesDir, entry.name);
        const rscDir = path.join(articleDir, "__next.articles");
        const slugToken = "$d$slug";

        await Promise.all([
          copyIfPresent(
            path.join(rscDir, `${slugToken}.txt`),
            path.join(articleDir, `__next.articles.${slugToken}.txt`)
          ),
          copyIfPresent(
            path.join(rscDir, slugToken, "__PAGE__.txt"),
            path.join(articleDir, `__next.articles.${slugToken}.__PAGE__.txt`)
          )
        ]);
      })
  );
}

await main();
