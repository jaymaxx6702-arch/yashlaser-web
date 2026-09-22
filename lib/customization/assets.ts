export type DesignAssetRole =
  | "original"
  | "processed"
  | "preview"
  | "proof"
  | "production";

export type DesignAssetState =
  | "draft"
  | "generated"
  | "approved"
  | "superseded"
  | "rejected";

export type DesignAssetRef = {
  id: string;
  role: DesignAssetRole;
  state: DesignAssetState;
  sha256: string;
  mimeType: string;
  bytes: number;
  parentId: string | null;
  createdAt: string;
};

const transitions: Record<DesignAssetState, readonly DesignAssetState[]> = {
  draft: ["generated", "rejected"],
  generated: ["approved", "superseded", "rejected"],
  approved: ["superseded"],
  superseded: [],
  rejected: [],
};

export function canTransitionDesignAsset(
  from: DesignAssetState,
  to: DesignAssetState,
) {
  return from === to || transitions[from].includes(to);
}

export function validateDesignAssetRef(asset: DesignAssetRef) {
  if (
    !/^[A-Za-z0-9_-]{8,100}$/.test(asset.id) ||
    !/^[a-f0-9]{64}$/.test(asset.sha256) ||
    !Number.isInteger(asset.bytes) ||
    asset.bytes < 1 ||
    asset.mimeType.length < 3 ||
    asset.mimeType.length > 100 ||
    !Number.isFinite(Date.parse(asset.createdAt))
  )
    throw new Error("Invalid design asset metadata.");

  if (asset.role === "original" && asset.parentId !== null)
    throw new Error("Original artwork cannot have a parent asset.");
  if (asset.role !== "original" && !asset.parentId)
    throw new Error("Derived design assets must reference their source.");

  return asset;
}
