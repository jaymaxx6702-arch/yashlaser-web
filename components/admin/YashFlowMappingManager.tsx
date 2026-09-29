"use client";

import { useMemo, useState } from "react";

import type {
  YashFlowMappingSnapshot,
  YashFlowProductMapping,
  YashFlowTargetProduct,
} from "@/lib/yashflow-mappings";

type ShopProduct = {
  id: string;
  name: string;
  categoryId: string;
};

type StatusFilter = "all" | "active" | "quarantined" | "unmapped";

function mappingStatus(mapping?: YashFlowProductMapping) {
  if (!mapping) return "unmapped" as const;
  return mapping.isActive && mapping.workflowReady
    ? ("active" as const)
    : ("quarantined" as const);
}

function MappingEditor({
  shopProduct,
  mapping,
  targets,
  onSaved,
}: {
  shopProduct: ShopProduct;
  mapping?: YashFlowProductMapping;
  targets: YashFlowTargetProduct[];
  onSaved: (mapping: YashFlowProductMapping) => void;
}) {
  const [targetId, setTargetId] = useState(
    mapping?.yashflowProductId || targets.find((item) => item.workflowReady)?.id || "",
  );
  const [active, setActive] = useState(Boolean(mapping?.isActive));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const target = targets.find((item) => item.id === targetId);
  const unsafeActivation = active && !target?.workflowReady;

  async function save() {
    if (!targetId || unsafeActivation) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        "/api/admin/integrations/yashflow-mappings",
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            shopProductId: shopProduct.id,
            yashflowProductId: targetId,
            isActive: active,
          }),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        mapping?: YashFlowProductMapping;
      };
      if (!response.ok || !result.mapping) {
        throw new Error(result.error || "Mapping update failed.");
      }
      onSaved(result.mapping);
      setMessage(active ? "Active mapping saved." : "Quarantined mapping saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mapping update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="admin-card">
      <div className="admin-top">
        <div>
          <strong>{shopProduct.name}</strong>
          <span>
            {shopProduct.id} · {shopProduct.categoryId}
          </span>
        </div>
        <span>
          Status:{" "}
          <strong>
            {mappingStatus(mapping) === "active"
              ? "Active"
              : mapping
                ? "Quarantined"
                : "Unmapped"}
          </strong>
        </span>
      </div>

      <label>
        YashFlow product
        <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          <option value="">Select target product</option>
          {targets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.workflowReady
                ? ` · ready (${item.workflowStageCount} stages)`
                : " · no usable workflow"}
            </option>
          ))}
        </select>
      </label>

      <label>
        <input
          type="checkbox"
          checked={active}
          onChange={(event) => setActive(event.target.checked)}
        />{" "}
        Active for Shop → YashFlow routing
      </label>

      {unsafeActivation && (
        <p role="alert">
          This target has no active workflow stages. Keep it quarantined until
          the YashFlow workflow is configured.
        </p>
      )}

      {mapping && (
        <small>
          Current: {mapping.yashflowProductName} ·{" "}
          {mapping.workflowStageCount} workflow stages
        </small>
      )}

      <div>
        <button
          type="button"
          disabled={busy || !targetId || unsafeActivation}
          onClick={() => void save()}
        >
          {busy ? "Saving…" : "Save mapping"}
        </button>
      </div>

      {message && <small role="status">{message}</small>}
    </article>
  );
}

export function YashFlowMappingManager({
  shopProducts,
  snapshot,
}: {
  shopProducts: ShopProduct[];
  snapshot: YashFlowMappingSnapshot;
}) {
  const [mappings, setMappings] = useState(snapshot.mappings);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");

  const mappingByShop = useMemo(
    () => new Map(mappings.map((item) => [item.shopProductId, item])),
    [mappings],
  );

  const counts = useMemo(() => {
    let active = 0;
    let quarantined = 0;
    let unmapped = 0;
    for (const product of shopProducts) {
      const state = mappingStatus(mappingByShop.get(product.id));
      if (state === "active") active += 1;
      else if (state === "quarantined") quarantined += 1;
      else unmapped += 1;
    }
    return { active, quarantined, unmapped };
  }, [mappingByShop, shopProducts]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return shopProducts.filter((product) => {
      const mapping = mappingByShop.get(product.id);
      const state = mappingStatus(mapping);
      if (status !== "all" && status !== state) return false;
      if (!needle) return true;
      return (
        product.name.toLowerCase().includes(needle) ||
        product.id.toLowerCase().includes(needle) ||
        (mapping?.yashflowProductName || "").toLowerCase().includes(needle)
      );
    });
  }, [mappingByShop, search, shopProducts, status]);

  function updateLocal(next: YashFlowProductMapping) {
    setMappings((current) => {
      const without = current.filter(
        (item) => item.shopProductId !== next.shopProductId,
      );
      return [...without, next];
    });
  }

  return (
    <>
      <section className="admin-card">
        <div className="admin-top">
          <div>
            <h2>Product mapping maintenance</h2>
            <p className="muted">
              Map Shop products to YashFlow production products. Unsafe targets
              cannot be activated until an active workflow with stages exists.
            </p>
          </div>
        </div>

        <div className="admin-metrics">
          <article className="admin-card">
            <small>Route-ready</small>
            <strong>{counts.active}</strong>
          </article>
          <article className="admin-card">
            <small>Quarantined</small>
            <strong>{counts.quarantined}</strong>
          </article>
          <article className="admin-card">
            <small>Unmapped</small>
            <strong>{counts.unmapped}</strong>
          </article>
        </div>

        <div className="admin-top">
          <label>
            Search
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Product name or ID"
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="quarantined">Quarantined</option>
              <option value="unmapped">Unmapped</option>
            </select>
          </label>
        </div>
        <small>
          Showing {visible.length} of {shopProducts.length} Shop products.
        </small>
      </section>

      <div className="admin-list">
        {visible.slice(0, 150).map((product) => (
          <MappingEditor
            key={product.id}
            shopProduct={product}
            mapping={mappingByShop.get(product.id)}
            targets={snapshot.products}
            onSaved={updateLocal}
          />
        ))}
      </div>

      {visible.length > 150 && (
        <p className="muted">
          Refine search or status filter to edit products beyond the first 150
          matches.
        </p>
      )}
    </>
  );
}
