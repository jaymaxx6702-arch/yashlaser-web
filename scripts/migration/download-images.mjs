import fs from "node:fs/promises";
import crypto from "node:crypto";
import sharp from "sharp";
import path from "node:path";

const mirrorRoot = process.argv[2] ? path.resolve(process.argv[2]) : null;
async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(path.join(directory, entry.name))
          : path.join(directory, entry.name),
      ),
    )
  ).flat();
}
const mirrorFiles = mirrorRoot ? await walk(mirrorRoot) : [];
async function imageBytes(url) {
  const maxBytes = 20 * 1024 * 1024;
  const suffix = url.hostname + decodeURIComponent(url.pathname);
  const local = mirrorFiles.find((file) =>
    file.replaceAll("\\", "/").endsWith(suffix),
  );
  if (local) {
    if ((await fs.stat(local)).size > maxBytes)
      throw new Error("Mirror image exceeds size limit");
    return fs.readFile(local);
  }
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const type = response.headers.get("content-type") || "";
  if (!/^image\/(webp|png|jpeg)/.test(type))
    throw new Error(`Unexpected media type: ${type}`);
  if (Number(response.headers.get("content-length")) > maxBytes)
    throw new Error("Image exceeds size limit");
  const chunks = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > maxBytes) throw new Error("Image exceeds size limit");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const source = JSON.parse(
  await fs.readFile("migration/source/products.json", "utf8"),
);
const queue = [
  ...new Map(
    source.flatMap((p) =>
      p.images.map((image) => [image.image_url, { image, productId: p.id }]),
    ),
  ).values(),
];
let manifest = [];
try {
  manifest = JSON.parse(
    await fs.readFile("migration/image-manifest.json", "utf8"),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const previous = new Map(manifest.map((item) => [item.sourceUrl, item]));
const result = [];
let cursor = 0;
await fs.mkdir("public/products", { recursive: true });
async function worker() {
  while (cursor < queue.length) {
    const { image, productId } = queue[cursor++];
    const sourceUrl = image.image_url;
    const old = previous.get(sourceUrl);
    if (old?.status === "downloaded") {
      try {
        const bytes = await fs.readFile("public" + old.localPath);
        if (
          crypto.createHash("sha256").update(bytes).digest("hex") === old.sha256
        ) {
          result.push(old);
          continue;
        }
      } catch {
        /* Missing or changed file is fetched again. */
      }
    }
    let error;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const url = new URL(sourceUrl);
        if (
          url.protocol !== "https:" ||
          url.hostname !== "cdn.dotpe.in" ||
          !url.pathname.startsWith("/longtail/store-items/8892470/")
        )
          throw new Error("Unexpected source host/path");
        const bytes = await imageBytes(url);
        const metadata = await sharp(bytes, {
          limitInputPixels: 100000000,
        }).metadata();
        if (
          !metadata.width ||
          !metadata.height ||
          !["webp", "png", "jpeg"].includes(metadata.format)
        )
          throw new Error("Invalid raster image");
        const localPath = `/products/${productId}-${image.image_id}.${metadata.format === "jpeg" ? "jpg" : metadata.format}`;
        // Preserve the source bytes exactly; Next Image creates delivery derivatives separately.
        await fs.writeFile("public" + localPath, bytes);
        result.push({
          sourceUrl,
          productId,
          imageId: image.image_id,
          status: "downloaded",
          localPath,
          width: metadata.width,
          height: metadata.height,
          bytes: bytes.length,
          sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        });
        error = null;
        break;
      } catch (caught) {
        error = caught.message;
      }
    }
    if (error)
      result.push({
        sourceUrl,
        productId,
        imageId: image.image_id,
        status: "failed",
        localPath: null,
        error,
      });
    if (result.length % 50 === 0)
      console.log(`Checked ${result.length}/${queue.length} images`);
  }
}
await Promise.all([worker(), worker(), worker()]);
result.sort((a, b) => a.productId - b.productId || a.imageId - b.imageId);
await fs.writeFile(
  "migration/image-manifest.json",
  JSON.stringify(result, null, 2) + "\n",
);
const hashes = Object.values(
  Object.groupBy(
    result.filter((x) => x.status === "downloaded"),
    (x) => x.sha256,
  ),
).filter((g) => g.length > 1);
await fs.writeFile(
  "migration/reports/image-duplicates.json",
  JSON.stringify(
    {
      exactByteDuplicateGroups: hashes,
      action: "All source records and files retained; no automatic deletion.",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    total: result.length,
    downloaded: result.filter((x) => x.status === "downloaded").length,
    failed: result.filter((x) => x.status === "failed").length,
    exactByteDuplicateGroups: hashes.length,
  }),
);
