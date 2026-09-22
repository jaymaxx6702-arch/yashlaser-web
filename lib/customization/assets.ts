export type AssetStage =
  | "original"
  | "processed"
  | "preview"
  | "proof"
  | "production";

export type DesignAssetVersion = {
  id: string;
  stage: AssetStage;
  sourceId: string | null;
  mimeType: string;
  bytes: number;
  sha256: string;
  width: number | null;
  height: number | null;
  createdAt: string;
  approvedAt: string | null;
  locked: boolean;
};

const transitions: Record<AssetStage, readonly AssetStage[]> = {
  original: ["processed", "preview"],
  processed: ["processed", "preview"],
  preview: ["proof"],
  proof: ["proof", "production"],
  production: [],
};

export function canTransitionAsset(
  from: AssetStage,
  to: AssetStage,
): boolean {
  return transitions[from].includes(to);
}

export function assertAssetTransition(
  from: AssetStage,
  to: AssetStage,
) {
  if (!canTransitionAsset(from, to))
    throw new Error(`Invalid design asset transition: ${from} -> ${to}`);
}

export function validateDesignAssetVersion(asset: DesignAssetVersion) {
  if (!/^[A-Za-z0-9._:-]{1,160}$/.test(asset.id))
    throw new Error("Invalid asset version ID.");
  if (!/^[a-f0-9]{64}$/.test(asset.sha256))
    throw new Error("Invalid asset hash.");
  if (!Number.isInteger(asset.bytes) || asset.bytes < 1)
    throw new Error("Invalid asset size.");
  if (
    (asset.width !== null && (!Number.isInteger(asset.width) || asset.width < 1)) ||
    (asset.height !== null && (!Number.isInteger(asset.height) || asset.height < 1))
  )
    throw new Error("Invalid asset dimensions.");
  if (asset.stage === "original" && asset.sourceId !== null)
    throw new Error("Original assets cannot have a source asset.");
  if (asset.stage === "production" && (!asset.approvedAt || !asset.locked))
    throw new Error("Production assets must be approved and locked.");
  return asset;
}
