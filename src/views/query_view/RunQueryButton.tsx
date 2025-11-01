import { Button } from "@radix-ui/themes";

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
      size="3"
      variant="solid"
      color="indigo"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      Query
      {showShortcut && isMacPlatform && (
        <span style={{ marginLeft: 8, fontSize: "0.85em", opacity: 0.8 }}>
          ⌘⏎
        </span>
      )}
    </Button>
  );
}
