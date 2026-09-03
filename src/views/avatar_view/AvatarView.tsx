import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Box,
  Button,
  Callout,
  Flex,
  Select,
  Spinner,
  Text,
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
  disabled,
  onRerender,
  onDelete,
}: {
  avatar: GeneratedAvatar;
  disabled: boolean;
  onRerender: () => void;
  onDelete: () => void;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  return (
    <article className="avatar-card is-latest">
      <div className="avatar-image-stage">
        <img
          src={avatar.imageDataUrl}
          alt={`Generated avatar for @${avatar.username}`}
        />
        <span>
          @{avatar.username} · {new Date(avatar.createdAt).toLocaleDateString()}
        </span>
      </div>
      <div className="avatar-card-actions">
        <a
          className="plain-button"
          href={avatar.imageDataUrl}
          download={`${avatar.username}-avatar.png`}
        >
          Download ↓
        </a>
        <button
          className="plain-button"
          disabled={disabled}
          onClick={onRerender}
        >
          Re-render image
        </button>
      </div>
      <details className="avatar-image-details">
        <summary>Prompt & image details</summary>
        <p className="quiet-note">
          {avatar.numTweets.toLocaleString()} tweets · {avatar.imageModel}
          <br />
          Prompt by {avatar.textModel}
          {typeof avatar.cost === "number" && avatar.cost > 0
            ? ` · $${avatar.cost.toFixed(3)}`
            : ""}
        </p>
        <button
          className="plain-button"
          aria-expanded={showPrompt}
          onClick={() => setShowPrompt(!showPrompt)}
        >
          {showPrompt ? "Hide generated prompt" : "Show generated prompt"}
        </button>
        {showPrompt && <p className="avatar-prompt">{avatar.description}</p>}
        <button
          className="plain-button delete-avatar"
          disabled={disabled}
          onClick={onDelete}
        >
          Delete this avatar
        </button>
      </details>
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
  const [previewId, setPreviewId] = useState<string | null>(null);
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
    accountHistory.find((a) => a.id === previewId) ??
    (latestAvatar?.accountId === selectedAccountId
      ? latestAvatar
      : accountHistory[0]);

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
      {!account ? (
        <ChooseArchive />
      ) : (
        <>
          <div className="avatar-layout">
            <div>
              {currentAvatar ? (
                <AvatarCard
                  avatar={currentAvatar}
                  key={currentAvatar.id}
                  disabled={busy}
                  onRerender={() => {
                    setPreviewId(null);
                    regenerateAvatarImage(currentAvatar);
                  }}
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
              <h2>An impression, in image form.</h2>
              <p className="quiet-note">
                Distill turns their tweets into a prompt, then makes an image
                from it. See what comes out.
              </p>
              <Button
                className="avatar-generate"
                size="3"
                disabled={busy || !account || accountTweets.length === 0}
                onClick={() => {
                  setPreviewId(null);
                  if (account) generateAvatar(account, accountTweets);
                }}
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
              <details className="avatar-models">
                <summary>AI models</summary>
                <Flex direction="column" gap="2">
                  <Text size="2" id="avatar-text-model-label">
                    Text model
                  </Text>
                  <Select.Root
                    value={String(selectedConfigIndex)}
                    onValueChange={(value) =>
                      setSelectedConfigIndex(Number(value))
                    }
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
              </details>
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
                  Generation is in progress. You can keep this page open while
                  it finishes.
                </span>
              )}
              {avatarError && (
                <Callout.Root color="red" role="alert">
                  <Callout.Text>{avatarError}</Callout.Text>
                </Callout.Root>
              )}
            </div>
          </div>
          {accountHistory.length > 1 && (
            <section className="avatar-history" aria-label="Previous avatars">
              <h2>Previous avatars</h2>
              <p className="quiet-note">
                Pick one to view, download or re-render.
              </p>
              <div className="avatar-history-grid">
                {accountHistory.map((avatar) => (
                  <button
                    key={avatar.id}
                    className="avatar-thumbnail"
                    aria-label={`View avatar from ${new Date(avatar.createdAt).toLocaleString()}`}
                    aria-pressed={currentAvatar?.id === avatar.id}
                    onClick={() => setPreviewId(avatar.id)}
                  >
                    <img src={avatar.imageDataUrl} alt="" />
                    <span>
                      {new Date(avatar.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageContent>
  );
}
