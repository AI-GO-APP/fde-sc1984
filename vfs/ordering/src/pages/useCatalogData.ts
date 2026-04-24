import { useState, useCallback } from "react";
import { Product } from "./CatalogProductCard";

export interface Category { id: string; name: string; active: boolean; }

export function useCatalogData(allTemplates: Product[], categories: Category[]) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const handleSearch = useCallback((v: string) => setSearch(v), []);

  const visibleProducts: Product[] = search.trim()
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

  return { categories, activeCat, setActiveCat, search, handleSearch, visibleProducts };
}
