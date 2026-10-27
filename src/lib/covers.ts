// RAWG's originals are often 1-2MB each. Re-decoding ~200 of them when the tab
// regains focus is what froze the page; RAWG's resize path serves ~30KB versions.
export function smallCover(url: string) {
  return url.replace("media.rawg.io/media/games/", "media.rawg.io/media/resize/420/-/games/")
    .replace("media.rawg.io/media/screenshots/", "media.rawg.io/media/resize/420/-/screenshots/");
}