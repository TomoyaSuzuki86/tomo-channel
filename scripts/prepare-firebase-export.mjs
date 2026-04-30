import { copyFile, readdir } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "out");
const articlesDir = path.join(outDir, "articles");

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
  await Promise.all(
    [
      ["search", "__next.search"],
      ["archive", "__next.archive"]
    ].map(async ([routeName, token]) => {
      const routeDir = path.join(outDir, routeName);
      await copyIfPresent(
        path.join(routeDir, token, "__PAGE__.txt"),
        path.join(routeDir, `${token}.__PAGE__.txt`)
      );
    })
  );

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
