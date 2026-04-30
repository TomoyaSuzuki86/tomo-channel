import type { Category } from "@/lib/types";

type CategoryPillProps = {
  category: Category;
};

export function CategoryPill({ category }: CategoryPillProps) {
  return (
    <span className="inline-flex rounded-md bg-tomo-pink px-3 py-1 text-xs font-black text-white">
      {category}
    </span>
  );
}
