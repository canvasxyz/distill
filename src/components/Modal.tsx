import { useRef, type ReactNode } from "react";
import { Flex, Box, IconButton, Dialog } from "@radix-ui/themes";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Content
        style={{ maxWidth: 600, maxHeight: "calc(100vh - 80px)" }}
        aria-describedby={undefined}
        onOpenAutoFocus={() => {
          returnFocus.current = document.activeElement as HTMLElement;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocus.current?.focus();
        }}
      >
        <Flex direction="column" gap="4">
          <Flex justify="between" align="center" mb="4">
            <Dialog.Title size="4">{title}</Dialog.Title>
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
