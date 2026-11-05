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
import { useFogGuard } from "../fog/useFogGuard";
import { notifyError } from "../images/imageFiles";
import { PlayerColorPicker } from "../player/PlayerColorPicker";
import { usePlayer } from "../player/PlayerContext";
import { useRoom } from "../room/RoomContext";
import { addPlaceholders, MAX_PLACEHOLDERS } from "./addPlaceholders";
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
  return (
    <Modal opened={opened} onClose={onClose} title="Add placeholders" centered>
      <PlaceholderForm onDone={onClose} />
    </Modal>
  );
}

function PlaceholderForm({ onDone }: { onDone: () => void }) {
  const room = useRoom();
  const theme = useMantineTheme();
  const player = usePlayer();
  const fogGuard = useFogGuard();
  const [name, setName] = useState("");
  const [count, setCount] = useState<string | number>(1);
  const [color, setColor] = useState(player.color);
  const [content, setContent] = useState<"letter" | "icon">("letter");
  const [icon, setIcon] = useState<PlaceholderIcon>("chest");
  const [isAdding, setIsAdding] = useState(false);
  const canAdd = typeof count === "number" && !isAdding;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (typeof count !== "number") return;
        setIsAdding(true);
        addPlaceholders(
          room,
          theme,
          {
            name,
            count,
            color,
            icon: content === "icon" ? icon : null,
          },
          fogGuard.blockedSquares(),
        )
          .then(onDone, (error: unknown) =>
            notifyError("Could not add placeholders", error),
          )
          .finally(() => setIsAdding(false));
      }}
    >
      <Stack>
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
          <Button type="submit" color={color} disabled={!canAdd}>
            Add
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
