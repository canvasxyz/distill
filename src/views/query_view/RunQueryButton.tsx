import { Button, Text } from "@radix-ui/themes";
import type { ComponentProps } from "react";

const isMacPlatform =
  typeof navigator !== "undefined" &&
  /macintosh|mac os x/i.test(navigator.userAgent);

type ButtonVariant = ComponentProps<typeof Button>["variant"];

export function RunQueryButton({
  onClick,
  disabled = false,
  showShortcut = false,
  variant,
}: {
  onClick: () => void;
  disabled?: boolean;
  showShortcut?: boolean;
  variant?: ButtonVariant;
}) {
  return (
    <Button
      type="button"
      className="ask-button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      size="2"
      variant={variant}
    >
      Ask Distill <span aria-hidden="true">↗</span>
      {showShortcut && isMacPlatform && (
        <Text size="1" style={{ opacity: 0.8 }}>
          ⌘⏎
        </Text>
      )}
    </Button>
  );
}
