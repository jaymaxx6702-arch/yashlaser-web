export const orderAssetKinds = [
  "original",
  "preview",
  "proof",
  "production",
] as const;

export const orderAssetStates = [
  "draft",
  "ready",
  "changes_requested",
  "approved",
  "superseded",
] as const;

export type OrderAssetKind = (typeof orderAssetKinds)[number];
export type OrderAssetState = (typeof orderAssetStates)[number];

const transitions: Record<OrderAssetState, readonly OrderAssetState[]> = {
  draft: ["ready", "superseded"],
  ready: ["changes_requested", "approved", "superseded"],
  changes_requested: ["superseded"],
  approved: ["superseded"],
  superseded: [],
};

export function isOrderAssetKind(value: unknown): value is OrderAssetKind {
  return (
    typeof value === "string" &&
    (orderAssetKinds as readonly string[]).includes(value)
  );
}

export function isOrderAssetState(value: unknown): value is OrderAssetState {
  return (
    typeof value === "string" &&
    (orderAssetStates as readonly string[]).includes(value)
  );
}

export function canTransitionOrderAsset(
  from: OrderAssetState,
  to: OrderAssetState,
) {
  return from === to || transitions[from].includes(to);
}

export function assertOrderAssetTransition(
  from: OrderAssetState,
  to: OrderAssetState,
) {
  if (!canTransitionOrderAsset(from, to))
    throw new Error(`Invalid order asset transition: ${from} -> ${to}`);
}

export function assertOrderAssetVersion(value: unknown) {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 10000
  )
    throw new Error("Invalid order asset version.");
  return value;
}

export function isCustomerApprovalAsset(kind: OrderAssetKind) {
  return kind === "proof";
}

export function isProductionAsset(kind: OrderAssetKind) {
  return kind === "production";
}
