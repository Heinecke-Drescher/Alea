const RUDE_ADJECTIVES = [
  "Dumb",
  "Clueless",
  "Lazy",
  "Smelly",
  "Hopeless",
  "Useless",
  "Clumsy",
  "Pathetic",
  "Brainless",
  "Witless",
  "Bumbling",
  "Incompetent",
  "Daft",
  "Dopey",
  "Feeble",
  "Sloppy",
];

const PLAIN_ADJECTIVES = [
  "Supreme",
  "Serious",
  "Certified",
  "Professional",
  "Majestic",
  "Mighty",
  "Glorious",
  "Grumpy",
  "Royal",
  "Legendary",
  "Honorable",
  "Distinguished",
  "Ancient",
  "Fearless",
  "Official",
  "Magnificent",
];

const RUDE_NOUNS = [
  "Idiot",
  "Moron",
  "Buffoon",
  "Nitwit",
  "Dork",
  "Clown",
  "Dimwit",
  "Numbskull",
  "Doofus",
  "Dingbat",
  "Nincompoop",
  "Halfwit",
  "Bonehead",
  "Blockhead",
  "Knucklehead",
  "Dunce",
];

const PLAIN_NOUNS = [
  "Snake",
  "Toad",
  "Potato",
  "Noodle",
  "Goblin",
  "Turnip",
  "Pigeon",
  "Walrus",
  "Badger",
  "Pickle",
  "Llama",
  "Hamster",
  "Cabbage",
  "Platypus",
  "Penguin",
  "Mushroom",
];

function combine(adjectives: string[], nouns: string[]) {
  return adjectives.flatMap((adjective) =>
    nouns.map((noun) => `${adjective} ${noun}`),
  );
}

// At least one word is rude, so there is no plain "Supreme Snake".
export const PLAYER_NAMES = [
  ...combine(RUDE_ADJECTIVES, [...RUDE_NOUNS, ...PLAIN_NOUNS]),
  ...combine(PLAIN_ADJECTIVES, RUDE_NOUNS),
];

export const RUDE_WORDS = new Set([...RUDE_ADJECTIVES, ...RUDE_NOUNS]);

export function randomPlayerName() {
  const name = PLAYER_NAMES[Math.floor(Math.random() * PLAYER_NAMES.length)];
  if (name === undefined) throw new Error("No player names to pick from");
  return name;
}
