// Keeping the imports behind functions leaves both large decoders out of pages
// that only import the public components entry and never mount a VideoPlayer.
export async function loadArtplayer() {
  return (await import("artplayer")).default;
}

export async function loadHls() {
  return (await import("hls.js")).default;
}
