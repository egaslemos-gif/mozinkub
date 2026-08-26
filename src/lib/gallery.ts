export function isGalleryVideo(url: string, type?: string | null) {
  if (type === "VIDEO") return true;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export function galleryMediaKind(url: string, type?: string | null): "IMAGE" | "VIDEO" {
  return isGalleryVideo(url, type) ? "VIDEO" : "IMAGE";
}
