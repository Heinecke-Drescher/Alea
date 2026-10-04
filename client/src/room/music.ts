import type { Music, RoomStore } from "./roomStore";

export const MUSIC_KEY = "current";
const VIDEO_ID = /^[\w-]{11}$/;
const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com"];

function idInUrl(url: URL) {
  const [first, second] = url.pathname.split("/").filter(Boolean);
  if (url.hostname === "youtu.be") return first;
  if (!YOUTUBE_HOSTS.includes(url.hostname)) return null;
  if (first === "watch") return url.searchParams.get("v");
  if (first === "shorts" || first === "embed") return second;
  return null;
}

export function videoIdFromUrl(text: string) {
  if (!URL.canParse(text.trim())) return null;
  const id = idInUrl(new URL(text.trim()));
  return id && VIDEO_ID.test(id) ? id : null;
}

// Music comes from other players and ends up in an iframe address, so it is checked first.
export function validMusic(value: unknown): Music | null {
  if (typeof value !== "object" || value === null) return null;
  const { videoId, playing, position, at } = value as Partial<Music>;
  if (typeof videoId !== "string" || !VIDEO_ID.test(videoId)) return null;
  if (typeof playing !== "boolean") return null;
  if (!Number.isFinite(position) || !Number.isFinite(at)) return null;
  return value as Music;
}

export function currentPosition(music: Music, now: number) {
  return music.playing
    ? music.position + Math.max(0, now - music.at) / 1000
    : music.position;
}

export function embedUrl(music: Music, now: number) {
  const start = Math.floor(currentPosition(music, now));
  const autoplay = music.playing ? "&autoplay=1" : "";
  return `https://www.youtube-nocookie.com/embed/${music.videoId}?start=${start}${autoplay}`;
}

export function createMusic({ musicMap }: RoomStore) {
  function currentMusic() {
    const music = validMusic(musicMap.get(MUSIC_KEY));
    if (!music) throw new Error("No music is set");
    return music;
  }

  function setMusic(videoId: string) {
    if (!VIDEO_ID.test(videoId)) {
      throw new Error(`Invalid YouTube video id ${videoId}`);
    }
    musicMap.set(MUSIC_KEY, {
      videoId,
      playing: false,
      position: 0,
      at: Date.now(),
    });
  }

  function playMusic() {
    musicMap.set(MUSIC_KEY, {
      ...currentMusic(),
      playing: true,
      at: Date.now(),
    });
  }

  function stopMusic() {
    const music = currentMusic();
    const now = Date.now();
    musicMap.set(MUSIC_KEY, {
      ...music,
      playing: false,
      position: currentPosition(music, now),
      at: now,
    });
  }

  return { setMusic, playMusic, stopMusic };
}
