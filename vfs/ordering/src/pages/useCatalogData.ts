import { useState, useCallback } from "react";
import { Product } from "./CatalogProductCard";

export interface Category { id: string; name: string; active: boolean; }

function sortByFavorite(list: Product[], favoriteSet: Set<string>): Product[] {
  return [...list].sort((a, b) => {
    const af = favoriteSet.has(a.id) ? 0 : 1;
    const bf = favoriteSet.has(b.id) ? 0 : 1;
    return af - bf;
  });
}

export function useCatalogData(allTemplates: Product[], categories: Category[], favoriteSet: Set<string>) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleSearch = useCallback((v: string) => setSearch(v), []);

  const filtered: Product[] = search.trim()
    ? allTemplates.filter(p => {
        const q = search.toLowerCase();
        return (p.name || "").toLowerCase().includes(q) ||
               (p.default_code || "").toLowerCase().includes(q);
      })
    : activeCat
      ? allTemplates.filter(p => {
          const raw = (p as any).categ_id;
          const cid = String(Array.isArray(raw) ? raw[0] : (raw ?? ""));
          return cid === activeCat;
        })
      : allTemplates;

  const visibleProducts = sortByFavorite(filtered, favoriteSet);

  return { categories, activeCat, setActiveCat, search, handleSearch, visibleProducts };
}
