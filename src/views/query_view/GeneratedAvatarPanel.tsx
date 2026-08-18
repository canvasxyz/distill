import { useState } from "react";
import {
  Box,
  Button,
  Callout,
  Flex,
  Text,
  TextField,
  Spinner,
} from "@radix-ui/themes";
import type { QueryResult } from "./ai_utils";
import { useStore } from "../../state/store";

/**
 * Shows a "Generate avatar" action for a query result and any avatars that
 * have already been generated from it.
 */
export function GeneratedAvatarPanel({
  queryResult,
}: {
  queryResult: QueryResult;
}) {
  const { generateAvatar, isGeneratingAvatar, avatarError } = useStore();
  const [styleHint, setStyleHint] = useState("");
  const images = queryResult.generatedImages || [];
  const handle = (queryResult.queriedHandle || "avatar").replace(/^@/, "");

  return (
    <Box pt="3" pb="2" style={{ borderTop: "1px solid var(--gray-a5)" }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2" wrap="wrap">
          <Button
            size="2"
            variant="solid"
            disabled={isGeneratingAvatar}
            onClick={() => generateAvatar(queryResult, styleHint.trim() || undefined)}
          >
            {isGeneratingAvatar ? (
              <>
                <Spinner /> Generating avatar…
              </>
            ) : images.length > 0 ? (
              "Generate another avatar"
            ) : (
              "Generate avatar from this answer"
            )}
          </Button>
          <TextField.Root
            size="2"
            placeholder="Optional style (e.g. pixel art, watercolor, anime)"
            value={styleHint}
            disabled={isGeneratingAvatar}
            onChange={(e) => setStyleHint(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
        </Flex>
        <Text size="1" color="gray">
          Uses this answer, the account bio and current avatar as inputs to an
          image model.
        </Text>
        {avatarError && (
          <Callout.Root color="red">
            <Callout.Text>{avatarError}</Callout.Text>
          </Callout.Root>
        )}
        {images.length > 0 && (
          <Flex gap="3" wrap="wrap">
            {images.map((src, idx) => (
              <Flex key={idx} direction="column" gap="1" align="center">
                <img
                  src={src}
                  alt={`Generated avatar ${idx + 1}`}
                  style={{
                    width: 200,
                    height: 200,
                    objectFit: "cover",
                    borderRadius: "50%",
                    border: "1px solid var(--gray-a6)",
                  }}
                />
                <a
                  href={src}
                  download={`${handle}-avatar-${idx + 1}.png`}
                  style={{ fontSize: 12 }}
                >
                  Download
                </a>
              </Flex>
            ))}
          </Flex>
        )}
      </Flex>
    </Box>
  );
}
