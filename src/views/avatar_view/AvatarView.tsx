import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Box,
  Button,
  Callout,
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
import { FaceIcon } from "@radix-ui/react-icons";
import { AccountContextLine } from "../../components/AccountContextLine";
import { ChooseArchive } from "../../components/ChooseArchive";
import { useSelectedAccount } from "../../hooks/useSelectedAccount";
import { PageContent } from "../../components/PageContent";
import { LoadingView } from "../LoadingView";
import { IMAGE_GEN_MODELS } from "../../constants";
import {
  AVAILABLE_LLM_CONFIGS,
  getLlmConfigLabel,
} from "../../state/llm_query";
import type { GeneratedAvatar } from "../../state/avatar";

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
  const [showPrompt, setShowPrompt] = useState(false);
  return (
    <article className={`avatar-card${isLatest ? " is-latest" : ""}`}>
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
        <Flex direction="column" gap="2" className="avatar-card-body">
          <Text size="1" color="gray">
            {created.toLocaleString()} · {avatar.imageModel} · brief by{" "}
            {avatar.textModel} from {avatar.numTweets} tweets
            {typeof avatar.cost === "number" && avatar.cost > 0
              ? ` · $${avatar.cost.toFixed(3)}`
              : ""}
          </Text>
          {showPrompt && (
            <Text size="2" style={{ whiteSpace: "pre-wrap" }}>
              {avatar.description}
            </Text>
          )}
          <Flex gap="2" mt="1" className="avatar-card-actions">
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={() => setShowPrompt((v) => !v)}
            >
              {showPrompt ? "Hide generated prompt" : "Show generated prompt"}
            </Button>
            <Button
              size="1"
              variant="soft"
              disabled={disabled}
              onClick={onRerender}
              title="Generate a new image from this same prompt"
            >
              Re-render image
            </Button>
            <Button
              size="1"
              variant="soft"
              color="red"
              disabled={disabled}
              onClick={onDelete}
            >
              Delete
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </article>
  );
}

export function AvatarView() {
  const {
    appIsReady,
    allTweets,
    generateAvatar,
    clearCachedPrompt,
    regenerateAvatarImage,
    deleteAvatar,
    avatarStage,
    avatarError,
    latestAvatar,
    selectedImageModel,
    setSelectedImageModel,
    useCurrentAvatarAsReference,
    setUseCurrentAvatarAsReference,
    selectedConfigIndex,
    setSelectedConfigIndex,
  } = useStore();

  const { selectedAccountId, account } = useSelectedAccount();
  const accountTweets = useMemo(
    () => (allTweets || []).filter((t) => t.account_id === selectedAccountId),
    [allTweets, selectedAccountId],
  );

  const selectedTextModel = (AVAILABLE_LLM_CONFIGS[selectedConfigIndex] ||
    AVAILABLE_LLM_CONFIGS[0])[0];
  const cachedPrompt = useLiveQuery(
    async () =>
      selectedAccountId
        ? await db.avatarPromptCache.get([selectedAccountId, selectedTextModel])
        : undefined,
    [selectedAccountId, selectedTextModel],
  );

  const history = useLiveQuery(
    () =>
      selectedAccountId
        ? db.avatars
            .where("accountId")
            .equals(selectedAccountId)
            .reverse()
            .sortBy("createdAt")
        : Promise.resolve([] as GeneratedAvatar[]),
    [selectedAccountId],
    [] as GeneratedAvatar[],
  );
  // A live query can briefly retain the previous person's rows while it reloads.
  const accountHistory = history.filter(
    (avatar) => avatar.accountId === selectedAccountId,
  );
  const currentAvatar =
    latestAvatar?.accountId === selectedAccountId
      ? latestAvatar
      : accountHistory[0];
  const pastAvatars = accountHistory.filter((a) => a.id !== currentAvatar?.id);

  const busy = avatarStage !== null;

  if (!appIsReady) {
    return (
      <Box style={{ width: "100%" }}>
        <LoadingView />
      </Box>
    );
  }

  return (
    <PageContent>
      <AccountContextLine />
      <div className="page-intro">
        <h1>Put a face to the vibe.</h1>
        <p className="intro-copy">
          Something inspired by their tweets. It doesn’t have to look like them.
        </p>
      </div>
      {!account && <ChooseArchive />}
      <div className="avatar-layout">
        <div>
          {currentAvatar ? (
            <AvatarCard
              avatar={currentAvatar}
              isLatest
              disabled={busy}
              onRerender={() => regenerateAvatarImage(currentAvatar)}
              onDelete={() => deleteAvatar(currentAvatar.id)}
            />
          ) : (
            <div className="avatar-empty">
              <FaceIcon aria-hidden="true" />
              <span>
                {account
                  ? "Their next avatar could go here."
                  : "Choose someone to get started."}
              </span>
              <small>Nothing generated yet.</small>
            </div>
          )}
        </div>
        <div className="avatar-options">
          <Button
            className="avatar-generate"
            size="3"
            disabled={busy || !account || accountTweets.length === 0}
            onClick={() => account && generateAvatar(account, accountTweets)}
          >
            {avatarStage === "analysing" ? (
              <>
                <Spinner /> Looking through tweets…
              </>
            ) : avatarStage === "rendering" ? (
              <>
                <Spinner /> Making the image…
              </>
            ) : (
              "Generate avatar ↗"
            )}
          </Button>
          <Flex direction="column" gap="2">
            <Text size="2" id="avatar-text-model-label">
              Text model
            </Text>
            <Select.Root
              value={String(selectedConfigIndex)}
              onValueChange={(value) => setSelectedConfigIndex(Number(value))}
              disabled={busy}
            >
              <Select.Trigger aria-labelledby="avatar-text-model-label" />
              <Select.Content>
                {AVAILABLE_LLM_CONFIGS.map((config, index) => (
                  <Select.Item
                    key={`${config[0]}-${config[1]}-${config[2] || ""}`}
                    value={String(index)}
                  >
                    {getLlmConfigLabel(config)}
                    {config[3] ? " · recommended" : ""}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex direction="column" gap="2">
            <Text size="2" id="avatar-image-model-label">
              Image model
            </Text>
            <Select.Root
              value={selectedImageModel}
              onValueChange={setSelectedImageModel}
              disabled={busy}
            >
              <Select.Trigger aria-labelledby="avatar-image-model-label" />
              <Select.Content>
                {IMAGE_GEN_MODELS.map((model) => (
                  <Select.Item key={model.id} value={model.id}>
                    {model.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>
          <Text size="2" as="label">
            <Flex align="start" gap="2">
              <Checkbox
                checked={useCurrentAvatarAsReference}
                disabled={busy}
                onCheckedChange={(checked) =>
                  setUseCurrentAvatarAsReference(checked === true)
                }
              />
              Use the current avatar as a reference
            </Flex>
          </Text>
          <p className="quiet-note">
            The AI providers receive tweets and profile details, plus the
            current avatar if you include it. Image generation may incur
            provider charges.
          </p>
          {cachedPrompt && (
            <div className="quiet-note">
              Reusing the prompt from{" "}
              {new Date(cachedPrompt.createdAt).toLocaleDateString()}. This
              skips straight to making the image.
              <button
                className="plain-button"
                disabled={busy}
                onClick={() => {
                  if (selectedAccountId)
                    clearCachedPrompt(selectedAccountId, selectedTextModel);
                }}
              >
                Build a fresh prompt ↗
              </button>
            </div>
          )}
          {busy && (
            <span className="quiet-note" role="status">
              Generation is in progress. You can keep this page open while it
              finishes.
            </span>
          )}
          {avatarError && (
            <Callout.Root color="red" role="alert">
              <Callout.Text>{avatarError}</Callout.Text>
            </Callout.Root>
          )}
        </div>
      </div>
      {pastAvatars.length > 0 && (
        <Flex direction="column" gap="4" pb="6">
          <Separator style={{ width: "100%" }} />
          <Heading size="4">Previous avatars</Heading>
          {pastAvatars.map((avatar) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              disabled={busy}
              onRerender={() => regenerateAvatarImage(avatar)}
              onDelete={() => deleteAvatar(avatar.id)}
            />
          ))}
        </Flex>
      )}
    </PageContent>
  );
}
