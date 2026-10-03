import { videoSource } from "./videoSource.js";

export function materialSource(value, declaredType) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  // Sharing URLs return a viewer page, not a file playable by <video>.
  if (url.hostname === "1drv.ms") {
    url.searchParams.set("embed", "1");
    return { kind: url.pathname.startsWith("/v/") || declaredType === "video" ? "video" : "document", type: "embed", src: url.href };
  }
  if (url.hostname === "onedrive.live.com" && (url.pathname === "/embed" || url.searchParams.has("resid"))) {
    url.pathname = "/embed";
    return { kind: declaredType === "video" ? "video" : "document", type: "embed", src: url.href };
  }
  const video = videoSource(url.href);
  if (video) return { kind: "video", ...video };
  const path = url.pathname.toLowerCase();
  if (/\.pdf$/.test(path)) return { kind: "pdf", src: url.href };
  if (/\.(mp3|wav|ogg|oga|m4a|aac|flac)$/.test(path)) return { kind: "audio", src: url.href };
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp)$/.test(path)) return { kind: "image", src: url.href };
  if (url.hostname === "drive.google.com") {
    const id = url.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] || url.searchParams.get("id");
    if (id && /^[\w-]+$/.test(id)) return { kind: "document", src: `https://drive.google.com/file/d/${id}/preview` };
  }
  if (url.hostname === "docs.google.com") {
    const document = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([\w-]+)/);
    if (document) return { kind: "document", src: `https://docs.google.com/${document[1]}/d/${document[2]}/preview` };
  }
  if (declaredType === "video") return { kind: "video", type: "file", src: url.href };
  return { kind: "page", src: url.href };
}
