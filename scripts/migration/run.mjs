import { spawnSync } from "node:child_process";
const mirror = process.argv[2];
const steps = [
  ...(mirror ? [["import-mirror.mjs", mirror]] : []),
  ["map-categories.mjs"],
  ["download-images.mjs", ...(mirror ? [mirror] : [])],
  ["build-catalogue.mjs"],
  ["finalize.mjs"],
  ["check.mjs"],
];
for (const [script, ...args] of steps) {
  const result = spawnSync(
    process.execPath,
    ["scripts/migration/" + script, ...args],
    { stdio: "inherit" },
  );
  if (result.status !== 0) process.exit(result.status || 1);
}
