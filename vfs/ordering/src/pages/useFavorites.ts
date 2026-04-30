import { useState, useEffect, useCallback } from "react";
import { runAction } from "../db";

export function useFavorites(customerId: string) {
  const [favoriteMap, setFavoriteMap] = useState<Record<string, string>>({});

  useEffect(() => {
    runAction("manage_favorites", { op: "list", customer_id: customerId })
      .then((d: any) => {
        const map: Record<string, string> = {};
        for (const r of (d.favorites ?? [])) map[String(r.product_tmpl_id)] = String(r.id);
        setFavoriteMap(map);
      })
      .catch(() => {});
  }, [customerId]);

  const toggleFavorite = useCallback(async (tmplId: string) => {
    const existing = favoriteMap[tmplId];
    if (existing) {
      setFavoriteMap(prev => { const n = { ...prev }; delete n[tmplId]; return n; });
      runAction("manage_favorites", { op: "remove", record_id: existing })
        .catch(() => setFavoriteMap(prev => ({ ...prev, [tmplId]: existing })));
    } else {
      setFavoriteMap(prev => ({ ...prev, [tmplId]: "pending" }));
      runAction("manage_favorites", { op: "add", customer_id: customerId, product_tmpl_id: tmplId })
        .then((d: any) => {
          const id = String(d.record?.id ?? d.id ?? "");
          setFavoriteMap(prev => ({ ...prev, [tmplId]: id }));
        })
        .catch(() => setFavoriteMap(prev => { const n = { ...prev }; delete n[tmplId]; return n; }));
    }
  }, [customerId, favoriteMap]);

  return { favoriteSet: new Set(Object.keys(favoriteMap)), toggleFavorite };
}
