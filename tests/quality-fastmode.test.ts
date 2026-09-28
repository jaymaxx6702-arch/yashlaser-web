import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("private customer files stay behind ownership or secret-token checks", () => {
  const accountDetail = fs.readFileSync(
    "app/account/orders/[id]/page.tsx",
    "utf8",
  );
  const proof = fs.readFileSync("app/proof/[token]/page.tsx", "utf8");
  const project = fs.readFileSync(
    "app/api/project-requests/[requestNo]/route.ts",
    "utf8",
  );
  const support = fs.readFileSync(
    "app/api/support/[ticketNo]/route.ts",
    "utf8",
  );
  const adminFile = fs.readFileSync(
    "app/api/admin/project-files/[id]/route.ts",
    "utf8",
  );

  assert.match(accountDetail, /customer_user_id/);
  assert.match(accountDetail, /user\.id/);
  assert.match(accountDetail, /createSignedUrl/);
  assert.match(proof, /tokenHash/);
  assert.match(project, /access_token_hash/);
  assert.match(project, /tokenHash/);
  assert.match(support, /access_token_hash/);
  assert.match(support, /tokenHash/);
  assert.match(adminFile, /requireAdmin/);
  assert.match(adminFile, /createSignedUrl/);
});

test("image-heavy storefront surfaces use Next Image and responsive sizing", () => {
  const card = fs.readFileSync("components/ProductCard.tsx", "utf8");
  const gallery = fs.readFileSync("components/ProductGallery.tsx", "utf8");

  assert.match(card, /from "next\/image"/);
  assert.match(card, /sizes=/);
  assert.match(gallery, /from "next\/image"/);
  assert.match(gallery, /sizes=/);
  assert.match(gallery, /priority/);
});

test("global CSS preserves keyboard focus and reduced-motion preferences", () => {
  const css = fs.readFileSync("app/globals.css", "utf8");
  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /scroll-behavior: auto/);
});


test("mobile navigation exposes state and restores focus on Escape", () => {
  const header = fs.readFileSync("components/SiteHeader.tsx", "utf8");
  assert.match(header, /aria-expanded=\{open\}/);
  assert.match(header, /aria-controls="main-navigation"/);
  assert.match(header, /aria-label=\{open \? extra\.close : extra\.menu\}/);
  assert.match(header, /menuButton\.current\?\.focus\(\)/);
  assert.match(header, /setOpen\(false\)/);
});
