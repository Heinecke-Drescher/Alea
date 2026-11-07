import { notifications } from "@mantine/notifications";

function roomLink() {
  return window.location.origin + window.location.pathname;
}

function showLinkError(title: string, link: string) {
  notifications.show({
    color: "red",
    title,
    message: link,
    // Long enough to copy the link by hand.
    autoClose: false,
  });
}

// Browsers offer the clipboard only over HTTPS or on localhost, not in a home network over http.
export function copyRoomLink() {
  const link = roomLink();
  if (!("clipboard" in navigator)) {
    showLinkError("Could not copy the link", link);
    return;
  }
  navigator.clipboard.writeText(link).then(
    () => notifications.show({ message: "Room link copied" }),
    () => showLinkError("Could not copy the link", link),
  );
}

// Desktop Firefox and plain http lack it.
export function canShareRoomLink() {
  return typeof navigator.share === "function";
}

// Closing the share sheet rejects with an AbortError, which needs no message.
export function shareRoomLink() {
  const link = roomLink();
  navigator.share({ title: "Alea room", url: link }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    showLinkError("Could not share the link", link);
  });
}
