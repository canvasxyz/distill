import { Button, Text } from "@radix-ui/themes";

const isMacPlatform =
  typeof navigator !== "undefined" &&
  /macintosh|mac os x/i.test(navigator.userAgent);

export function RunQueryButton({
  onClick,
  disabled = false,
  showShortcut = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  showShortcut?: boolean;
}) {
  return (
    <Button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      color="blue"
      size="2"
    >
      Query
      {showShortcut && isMacPlatform && (
        <Text size="1" style={{ marginLeft: 8, opacity: 0.8 }}>
          ⌘⏎
        </Text>
      )}
    </Button>
  );
}
