export function videoSource(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);
  if (["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be"].includes(host)) {
    const videoId = host === "youtu.be" ? segments[0] : segments[0] === "watch" ? url.searchParams.get("v") : ["embed", "shorts", "live"].includes(segments[0]) ? segments[1] : null;
    if (!/^[\w-]{11}$/.test(videoId ?? "")) return null;
    return { type: "embed", src: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&playsinline=1` };
  }
  if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(host)) {
    const videoId = host === "player.vimeo.com" && segments[0] === "video" ? segments[1] : segments[0];
    if (!/^\d+$/.test(videoId ?? "")) return null;
    const embed = new URL(`https://player.vimeo.com/video/${videoId}`);
    const hash = url.searchParams.get("h") || (host !== "player.vimeo.com" ? segments[1] : null);
    if (hash && /^[a-zA-Z0-9]+$/.test(hash)) embed.searchParams.set("h", hash);
    return { type: "embed", src: embed.href };
  }
  if (/\.(mp4|webm|ogv|ogg)$/i.test(url.pathname)) return { type: "file", src: url.href };
  return null;
}
