import { useState, useEffect, useRef, useCallback } from "react";
import * as db from "../db";
import { Product } from "./CatalogProductCard";

export interface Category { id: string; name: string; active: boolean; }
export interface CatData { ids: string[]; offset: number; hasMore: boolean; loading: boolean; }

export function useCatalogData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [, setTick] = useState(0);
  const flush = useCallback(() => setTick(t => t + 1), []);
  const poolRef = useRef<Map<string, Product>>(new Map());
  const catDataRef = useRef<Record<string, CatData>>({});
  const catsRef = useRef<Category[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCat = useCallback((catId: string) => {
    const d = catDataRef.current[catId] ?? { ids: [], offset: 0, hasMore: true, loading: false };
    if (d.loading || !d.hasMore) return;
    catDataRef.current[catId] = { ...d, loading: true };
    flush();
    db.query("product_templates", {
      filters: [
        { column: "active", op: "eq", value: true },
        { column: "sale_ok", op: "eq", value: true },
        { column: "categ_id", op: "eq", value: catId },
      ],
      offset: d.offset,
    }).then(res => {
      const batch: Product[] = Array.isArray(res) ? res : [];
      for (const p of batch) poolRef.current.set(p.id, p);
      const next: CatData = {
        ids: [...d.ids, ...batch.map(p => p.id)],
        offset: d.offset + batch.length,
        hasMore: batch.length > 0, loading: false,
      };
      catDataRef.current[catId] = next;
      if (next.hasMore) setTimeout(() => fetchCat(catId), 0);
    }).catch(() => {
      catDataRef.current[catId] = { ...(catDataRef.current[catId] ?? d), loading: false };
    }).finally(flush);
  }, [flush]);

  useEffect(() => {
    db.query("product_categories")
      .then(res => {
        const raw = (Array.isArray(res) ? res : []).filter((c: any) => c.active !== false);
        const seen = new Set<string>(); const unique: Category[] = [];
        for (const c of raw) { if (!seen.has(c.name)) { seen.add(c.name); unique.push(c); } }
        catsRef.current = unique;
        setCategories(unique);
        for (const cat of unique) {
          catDataRef.current[cat.id] = { ids: [], offset: 0, hasMore: true, loading: false };
          fetchCat(cat.id);
        }
      }).finally(() => setCatLoading(false));
  }, [fetchCat]);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults(null); return; }
    searchTimer.current = setTimeout(() => {
      setSearchLoading(true);
      db.query("product_templates", {
        filters: [
          { column: "active", op: "eq", value: true },
          { column: "sale_ok", op: "eq", value: true },
          { column: "name", op: "ilike", value: `%${val.trim()}%` },
        ],
      }).then(res => {
        const results: Product[] = Array.isArray(res) ? res : [];
        for (const p of results) poolRef.current.set(p.id, p);
        setSearchResults(results);
      }).catch(() => setSearchResults([])).finally(() => setSearchLoading(false));
    }, 400);
  }, []);

  return { categories, activeCat, setActiveCat, search, handleSearch, searchResults, searchLoading, catLoading, poolRef, catDataRef, catsRef };
}
