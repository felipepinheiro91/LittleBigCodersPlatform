import assert from "node:assert/strict";
import test from "node:test";
import { materialSource } from "./materialSource.js";

test("OneDrive short URLs are preserved without inventing embed parameters", () => {
  const link = "https://1drv.ms/v/c/3a1aad13c09d1cfe/IQD-HJ3AE60aIIA6puMBAAAAAT8XJDTSDBCq62xcgtWoJjI?e=cnYcM2";
  const source = materialSource(link);
  assert.equal(source.kind, "video");
  assert.equal(source.type, "embed");
  const embed = new URL(source.src);
  assert.equal(embed.pathname, new URL(link).pathname);
  assert.equal(embed.searchParams.get("e"), "cnYcM2");
  assert.equal(embed.searchParams.get("embed"), null);
  assert.deepEqual(materialSource(source.src), source);
});

test("the supplied OneDrive iframe source works without embed=1", () => {
  const src = "https://1drv.ms/b/c/3a1aad13c09d1cfe/IQT-HJ3AE60aIIA6nwMCAAAAAWCqAYk-lO4VfD3ruv1NcJI";
  const source = materialSource(src, "answer_key");
  assert.equal(source.type, "embed");
  assert.equal(source.kind, "document");
  assert.equal(source.src, src);
  assert.equal(new URL(source.src).search, "");
});

test("generated OneDrive embed links preserve the resource and authorization key", () => {
  const source = materialSource("https://onedrive.live.com/embed?resid=ABC!123&authkey=!secret", "video");
  assert.equal(source.type, "embed");
  assert.equal(new URL(source.src).pathname, "/embed");
  assert.equal(new URL(source.src).searchParams.get("authkey"), "!secret");
});

test("explicit short embeds and SharePoint embeds use the iframe", () => {
  assert.equal(materialSource("https://1drv.ms/b/c/abc/token?embed=1").type, "embed");
  assert.equal(materialSource("https://school.sharepoint.com/sites/test/_layouts/15/embed.aspx?UniqueId=abc", "video").type, "embed");
  assert.equal(materialSource("https://school.sharepoint.com/:v:/s/test/abc", "video").type, "sharing");
  assert.equal(materialSource("https://onedrive.live.com/?resid=ABC!123").type, "sharing");
});

test("other media and lookalike domains retain their own handling", () => {
  assert.equal(materialSource("https://example.com/video.mp4").type, "file");
  assert.equal(materialSource("https://example.com/file.pdf?token=abc").kind, "pdf");
  assert.equal(materialSource("https://1drv.ms.example.com/v/test").kind, "page");
  assert.equal(materialSource("javascript:alert(1)"), null);
  assert.equal(materialSource("https://user:pass@1drv.ms/v/test"), null);
});
