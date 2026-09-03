import { useRef, type ReactNode } from "react";
import { Flex, Box, IconButton, Dialog } from "@radix-ui/themes";

export function Modal({
  open,
  onClose,
  title,
  children,
  initialFocus,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  initialFocus?: string;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Content
        style={{
          maxWidth: 560,
          maxHeight: "calc(100dvh - 48px)",
          borderRadius: 5,
        }}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          returnFocus.current = document.activeElement as HTMLElement;
          if (initialFocus) {
            event.preventDefault();
            document.querySelector<HTMLElement>(initialFocus)?.focus();
          }
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (
            returnFocus.current?.isConnected &&
            returnFocus.current.getClientRects().length
          )
            returnFocus.current.focus();
          else
            (
              document.querySelector<HTMLElement>(".account-context button") ??
              document.querySelector<HTMLElement>(".mobile-sidebar-toggle")
            )?.focus();
        }}
      >
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center">
            <Dialog.Title size="5" style={{ margin: 0, fontWeight: 500 }}>
              {title}
            </Dialog.Title>
            <Dialog.Close>
              <IconButton variant="ghost" size="2" aria-label="Close">
                ×
              </IconButton>
            </Dialog.Close>
          </Flex>
          <Box>{children}</Box>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
