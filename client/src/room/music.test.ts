import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Y from "yjs";
import { createRoom, type Room } from "./createRoom";
import {
  currentPosition,
  embedUrl,
  MUSIC_KEY,
  validMusic,
  videoIdFromUrl,
} from "./music";

const ID = "dQw4w9WgXcQ";

describe("videoIdFromUrl", () => {
  it("reads the id from the usual YouTube links", () => {
    expect(videoIdFromUrl(`https://www.youtube.com/watch?v=${ID}&t=42`)).toBe(
      ID,
    );
    expect(videoIdFromUrl(`https://youtu.be/${ID}?si=abc`)).toBe(ID);
    expect(videoIdFromUrl(`https://m.youtube.com/watch?v=${ID}`)).toBe(ID);
    expect(videoIdFromUrl(`https://www.youtube.com/shorts/${ID}`)).toBe(ID);
    expect(videoIdFromUrl(`  https://www.youtube.com/embed/${ID}  `)).toBe(ID);
  });

  it("rejects other sites, broken ids and text", () => {
    expect(videoIdFromUrl(`https://example.com/watch?v=${ID}`)).toBeNull();
    expect(videoIdFromUrl("https://www.youtube.com/watch?v=short")).toBeNull();
    expect(videoIdFromUrl("https://www.youtube.com/@channel")).toBeNull();
    expect(videoIdFromUrl("tavern music")).toBeNull();
  });
});

describe("validMusic", () => {
  const music = { videoId: ID, playing: true, position: 3, at: 1000 };

  it("accepts well-formed music", () => {
    expect(validMusic(music)).toBe(music);
  });

  it("rejects music that could break the iframe address", () => {
    expect(validMusic({ ...music, videoId: `${ID}"><x` })).toBeNull();
    expect(validMusic({ ...music, position: Number.NaN })).toBeNull();
    expect(validMusic({ ...music, playing: "yes" })).toBeNull();
    expect(validMusic(undefined)).toBeNull();
  });
});

describe("currentPosition", () => {
  it("moves on while playing and stays while stopped", () => {
    const playing = { videoId: ID, playing: true, position: 10, at: 1000 };
    expect(currentPosition(playing, 4000)).toBe(13);
    expect(currentPosition({ ...playing, playing: false }, 4000)).toBe(10);
  });

  it("does not go back when another clock is behind", () => {
    const playing = { videoId: ID, playing: true, position: 10, at: 5000 };
    expect(currentPosition(playing, 4000)).toBe(10);
  });
});

describe("embedUrl", () => {
  it("starts playing at the current second", () => {
    const playing = { videoId: ID, playing: true, position: 10, at: 1000 };
    expect(embedUrl(playing, 3500)).toBe(
      `https://www.youtube-nocookie.com/embed/${ID}?start=12&autoplay=1`,
    );
  });

  it("only shows a stopped video", () => {
    const stopped = { videoId: ID, playing: false, position: 10, at: 1000 };
    expect(embedUrl(stopped, 3500)).toBe(
      `https://www.youtube-nocookie.com/embed/${ID}?start=10`,
    );
  });
});

describe("room music", () => {
  let room: Room;

  beforeEach(() => {
    room = createRoom(new Y.Doc());
    vi.useFakeTimers({ now: 1000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function music() {
    return room.musicMap.get(MUSIC_KEY);
  }

  it("starts stopped and resumes where it was stopped", () => {
    room.setMusic(ID);
    expect(music()).toEqual({
      videoId: ID,
      playing: false,
      position: 0,
      at: 1000,
    });
    room.playMusic();
    vi.setSystemTime(6000);
    room.stopMusic();
    expect(music()).toEqual({
      videoId: ID,
      playing: false,
      position: 5,
      at: 6000,
    });
    vi.setSystemTime(9000);
    room.playMusic();
    expect(music()).toEqual({
      videoId: ID,
      playing: true,
      position: 5,
      at: 9000,
    });
  });

  it("refuses invalid ids and playing without music", () => {
    expect(() => room.setMusic("nope")).toThrow();
    expect(() => room.playMusic()).toThrow();
  });

  it("is not part of undo", () => {
    room.setMusic(ID);
    room.undoManager.undo();
    expect(music()).toMatchObject({ videoId: ID });
  });
});
