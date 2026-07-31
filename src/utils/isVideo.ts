const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".avi", ".webm", ".mkv", ".3gp", ".m4v"]);

export function isVideoUrl(url: string): boolean {
  const clean = url.split("?").shift()?.toLowerCase() ?? "";
  const ext = "." + clean.split(".").pop();
  return VIDEO_EXTENSIONS.has(ext);
}
