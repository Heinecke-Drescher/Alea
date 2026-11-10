import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Stack,
  TextInput,
  Tooltip,
  useMantineTheme,
} from "@mantine/core";
import {
  IconBomb,
  IconBook,
  IconCoins,
  IconDoor,
  IconFlame,
  IconFlask,
  IconKey,
  IconLock,
  IconMapPin,
  IconSkull,
  IconStairs,
  IconTreasureChest,
  type Icon,
} from "@tabler/icons-react";
import { useState } from "react";
import { notifyError } from "../images/imageFiles";
import { PlayerColorPicker } from "../player/PlayerColorPicker";
import { usePlayer } from "../player/PlayerContext";
import type { PlayerColor } from "../room/playerColors";
import { useRoom } from "../room/RoomContext";
import {
  createPlaceholders,
  MAX_PLACEHOLDERS,
  type Placeholders,
} from "./placeholders";
import { useHoldTokens } from "./holdTokens";
import { PLACEHOLDER_ICONS, type PlaceholderIcon } from "./placeholderImage";

const ICONS: Record<PlaceholderIcon, { label: string; Icon: Icon }> = {
  chest: { label: "Chest", Icon: IconTreasureChest },
  door: { label: "Door", Icon: IconDoor },
  key: { label: "Key", Icon: IconKey },
  lock: { label: "Lock", Icon: IconLock },
  stairs: { label: "Stairs", Icon: IconStairs },
  flame: { label: "Fire", Icon: IconFlame },
  bomb: { label: "Bomb", Icon: IconBomb },
  coins: { label: "Coins", Icon: IconCoins },
  flask: { label: "Potion", Icon: IconFlask },
  book: { label: "Book", Icon: IconBook },
  skull: { label: "Skull", Icon: IconSkull },
  pin: { label: "Marker", Icon: IconMapPin },
};

interface PlaceholderModalProps {
  opened: boolean;
  onClose: () => void;
}

export function PlaceholderModal({ opened, onClose }: PlaceholderModalProps) {
  const room = useRoom();
  const theme = useMantineTheme();
  const player = usePlayer();
  const holdTokens = useHoldTokens();
  return (
    <Modal opened={opened} onClose={onClose} title="Add placeholders" centered>
      <PlaceholderForm
        initialColor={player.color}
        forOneToken={false}
        errorTitle="Could not add placeholders"
        onSubmit={async (placeholders) =>
          holdTokens(await createPlaceholders(room, theme, placeholders))
        }
        onDone={onClose}
      />
    </Modal>
  );
}

interface PlaceholderFormProps {
  initialColor: PlayerColor;
  // For a new image of one token, which keeps its name.
  forOneToken: boolean;
  errorTitle: string;
  onSubmit: (placeholders: Placeholders) => Promise<void>;
  onDone: () => void;
}

export function PlaceholderForm({
  initialColor,
  forOneToken,
  errorTitle,
  onSubmit,
  onDone,
}: PlaceholderFormProps) {
  const [name, setName] = useState("");
  const [count, setCount] = useState<string | number>(1);
  const [color, setColor] = useState(initialColor);
  const [content, setContent] = useState<"letter" | "icon">("letter");
  const [icon, setIcon] = useState<PlaceholderIcon>("chest");
  const [isSaving, setIsSaving] = useState(false);
  const canSave = typeof count === "number" && !isSaving;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (typeof count !== "number") return;
        setIsSaving(true);
        onSubmit({
          name,
          count,
          color,
          icon: content === "icon" ? icon : null,
        })
          .then(onDone, (error: unknown) => notifyError(errorTitle, error))
          .finally(() => setIsSaving(false));
      }}
    >
      <Stack>
        {!forOneToken && (
          <>
            <TextInput
              label="Name"
              placeholder="Goblin"
              value={name}
              onChange={(event) => setName(event.target.value)}
              data-autofocus
            />
            <NumberInput
              label="Count"
              value={count}
              onChange={setCount}
              min={1}
              max={MAX_PLACEHOLDERS}
              allowDecimal={false}
              clampBehavior="strict"
            />
          </>
        )}
        <PlayerColorPicker value={color} onChange={setColor} />
        <SegmentedControl
          value={content}
          onChange={(value) => setContent(value === "icon" ? "icon" : "letter")}
          data={[
            { label: "Letter", value: "letter" },
            { label: "Icon", value: "icon" },
          ]}
        />
        {content === "icon" && (
          <Group gap={6}>
            {PLACEHOLDER_ICONS.map((option) => {
              const { label, Icon } = ICONS[option];
              return (
                <Tooltip key={option} label={label}>
                  <ActionIcon
                    variant={option === icon ? "filled" : "default"}
                    color={color}
                    size="lg"
                    aria-label={label}
                    onClick={() => setIcon(option)}
                  >
                    <Icon size={20} />
                  </ActionIcon>
                </Tooltip>
              );
            })}
          </Group>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" color={color} disabled={!canSave}>
            {forOneToken ? "Save" : "Add"}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
