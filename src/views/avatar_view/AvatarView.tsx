import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  Select,
  Spinner,
  Text,
  Separator,
  Checkbox,
} from "@radix-ui/themes";
import { useStore } from "../../state/store";
import { db } from "../../db";
import { Header } from "../../components/Header";
import { LoadingView } from "../LoadingView";
import { SelectUser } from "../SelectUser";
import { IMAGE_GEN_MODELS } from "../../constants";
import { AVAILABLE_LLM_CONFIGS, getLlmConfigLabel } from "../../state/llm_query";
import type { GeneratedAvatar } from "../../state/avatar";
import { useTheme } from "../../components/ThemeContext";
import { IconButton } from "@radix-ui/themes";

const ACCOUNT_STORAGE_KEY = "llm:lastSelectedAccountId";

function AvatarCard({
  avatar,
  isLatest,
  disabled,
  onRerender,
  onDelete,
}: {
  avatar: GeneratedAvatar;
  isLatest?: boolean;
  disabled: boolean;
  onRerender: () => void;
  onDelete: () => void;
}) {
  const created = new Date(avatar.createdAt);
  return (
    <Card size="2" style={{ width: "100%" }}>
      <Flex gap="4" wrap="wrap">
        <Flex direction="column" align="center" gap="2">
          <img
            src={avatar.imageDataUrl}
            alt={`Generated avatar for @${avatar.username}`}
            style={{
              width: isLatest ? 256 : 160,
              height: isLatest ? 256 : 160,
              objectFit: "cover",
              borderRadius: "50%",
              border: "1px solid var(--gray-a6)",
            }}
          />
          <a
            href={avatar.imageDataUrl}
            download={`${avatar.username}-avatar.png`}
            style={{ fontSize: 12 }}
          >
            Download
          </a>
        </Flex>
        <Flex direction="column" gap="2" style={{ flex: 1, minWidth: 240 }}>
          <Text size="1" color="gray">
            {created.toLocaleString()} · {avatar.imageModel} · brief by{" "}
            {avatar.textModel} from {avatar.numTweets} tweets
            {typeof avatar.cost === "number" && avatar.cost > 0
              ? ` · $${avatar.cost.toFixed(3)}`
              : ""}
          </Text>
          <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
            {avatar.description}
          </Text>
          <Flex gap="2" mt="1">
            <Button
              size="1"
              variant="soft"
              disabled={disabled}
              onClick={onRerender}
              title="Generate a new image from this same description"
            >
              Re-render image
            </Button>
            <Button size="1" variant="soft" color="red" disabled={disabled} onClick={onDelete}>
              Delete
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}

export function AvatarView() {
  const {
    appIsReady,
    accounts,
    allTweets,
    generateAvatar,
    regenerateAvatarImage,
    deleteAvatar,
    avatarStage,
    avatarError,
    avatarDescription,
    latestAvatar,
    selectedImageModel,
    setSelectedImageModel,
    useCurrentAvatarAsReference,
    setUseCurrentAvatarAsReference,
    selectedConfigIndex,
    setSelectedConfigIndex,
  } = useStore();
  const { appearance, toggleTheme } = useTheme();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    () => {
      try {
        return localStorage.getItem(ACCOUNT_STORAGE_KEY);
      } catch {
        return null;
      }
    },
  );
  useEffect(() => {
    if (!selectedAccountId) return;
    try {
      localStorage.setItem(ACCOUNT_STORAGE_KEY, selectedAccountId);
    } catch {
      // ignore
    }
  }, [selectedAccountId]);

  const account = useMemo(
    () => accounts.find((a) => a.accountId === selectedAccountId) || null,
    [accounts, selectedAccountId],
  );
  const accountTweets = useMemo(
    () => (allTweets || []).filter((t) => t.account_id === selectedAccountId),
    [allTweets, selectedAccountId],
  );

  const history = useLiveQuery(
    () =>
      selectedAccountId
        ? db.avatars.where("accountId").equals(selectedAccountId).reverse().sortBy("createdAt")
        : Promise.resolve([] as GeneratedAvatar[]),
    [selectedAccountId],
    [] as GeneratedAvatar[],
  );
  const pastAvatars = history.filter((a) => a.id !== latestAvatar?.id);

  const busy = avatarStage !== null;

  if (!appIsReady) {
    return (
      <Box style={{ width: "100%" }}>
        <LoadingView />
      </Box>
    );
  }

  return (
    <Box style={{ width: "100%" }}>
      <Header
        leftContent={<div style={{ fontWeight: 600 }}>Avatar Generator</div>}
        rightContent={
          <IconButton
            onClick={toggleTheme}
            variant="outline"
            size="2"
            style={{ padding: "0 2px" }}
            title={appearance === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {appearance === "dark" ? "☀️" : "🌙"}
          </IconButton>
        }
      />
      <Box style={{ maxWidth: "800px", margin: "auto", width: "100%", boxSizing: "border-box", padding: "0 16px" }}>
        <Flex direction="column" gap="4" pb="6">
          <Box mt="6">
            <SelectUser
              selectedAccountId={selectedAccountId}
              setSelectedAccountId={setSelectedAccountId}
            />
          </Box>

          <Text size="2" color="gray">
            Generates a profile avatar from this account's tweets, bio, and current
            avatar. The tweets are summarised into a description of what the image
            should contain — no style direction is given, so the image model's own
            look comes through.
          </Text>

          <Flex align="center" gap="3" wrap="wrap">
            <Button
              size="3"
              disabled={busy || !account || accountTweets.length === 0}
              onClick={() => account && generateAvatar(account, accountTweets)}
            >
              {avatarStage === "analysing" ? (
                <>
                  <Spinner /> Reading tweets…
                </>
              ) : avatarStage === "rendering" ? (
                <>
                  <Spinner /> Rendering image…
                </>
              ) : (
                "Generate avatar"
              )}
            </Button>
            <Box style={{ flex: 1 }} />
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Text model
              </Text>
              <Select.Root
                value={String(selectedConfigIndex)}
                onValueChange={(v) => setSelectedConfigIndex(Number(v))}
                disabled={busy}
              >
                <Select.Trigger style={{ maxWidth: 260 }} />
                <Select.Content>
                  {AVAILABLE_LLM_CONFIGS.map((config, idx) => (
                    <Select.Item
                      key={`${config[0]}-${config[1]}-${config[2] || ""}`}
                      value={String(idx)}
                    >
                      {config[3] && "️⭐️ "}
                      {getLlmConfigLabel(config)}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
            <Flex direction="column" gap="1">
              <Text size="1" color="gray">
                Image model
              </Text>
              <Select.Root
                value={selectedImageModel}
                onValueChange={setSelectedImageModel}
                disabled={busy}
              >
                <Select.Trigger style={{ maxWidth: 220 }} />
                <Select.Content>
                  {IMAGE_GEN_MODELS.map((m) => (
                    <Select.Item key={m.id} value={m.id}>
                      {m.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Flex>
          </Flex>

          <Text size="2" as="label">
            <Flex align="center" gap="2">
              <Checkbox
                checked={useCurrentAvatarAsReference}
                disabled={busy}
                onCheckedChange={(c) => setUseCurrentAvatarAsReference(c === true)}
              />
              Send the current avatar to the image model as a reference (its look
              can influence the result)
            </Flex>
          </Text>

          {avatarError && (
            <Callout.Root color="red">
              <Callout.Text>{avatarError}</Callout.Text>
            </Callout.Root>
          )}

          {busy && avatarDescription && (
            <Card>
              <Text size="1" color="gray">
                Description
              </Text>
              <Text as="p" size="2" style={{ whiteSpace: "pre-wrap" }}>
                {avatarDescription}
              </Text>
            </Card>
          )}

          {latestAvatar && (
            <AvatarCard
              avatar={latestAvatar}
              isLatest
              disabled={busy}
              onRerender={() => regenerateAvatarImage(latestAvatar)}
              onDelete={() => deleteAvatar(latestAvatar.id)}
            />
          )}

          {pastAvatars.length > 0 && (
            <>
              <Separator style={{ width: "100%" }} />
              <Heading size="3">Previous avatars</Heading>
              {pastAvatars.map((a) => (
                <AvatarCard
                  key={a.id}
                  avatar={a}
                  disabled={busy}
                  onRerender={() => regenerateAvatarImage(a)}
                  onDelete={() => deleteAvatar(a.id)}
                />
              ))}
            </>
          )}
        </Flex>
      </Box>
    </Box>
  );
}
