import { useState } from "react";
import { EyeOpenIcon, EyeClosedIcon } from "@radix-ui/react-icons";
import { useTheme } from "../components/ThemeContext";
import { PageContent } from "../components/PageContent";
import type { LLMQueryProvider } from "../constants";
import {
  getStoredApiKey,
  setStoredApiKey,
  getSelectedProvider,
  setSelectedProvider,
} from "../utils/provider";

const providers: { key: LLMQueryProvider; label: string }[] = [
  { key: "cerebras", label: "Cerebras" },
  { key: "deepinfra", label: "Deep Infra" },
  { key: "openrouter", label: "OpenRouter" },
  { key: "groq", label: "Groq" },
  { key: "fireworks", label: "Fireworks" },
];

export function Settings() {
  const { appearance, toggleTheme } = useTheme();
  const [provider, updateProvider] = useState(getSelectedProvider);
  const [keys, updateKeys] = useState(() =>
    Object.fromEntries(providers.map((p) => [p.key, getStoredApiKey(p.key)])),
  );
  const [visible, setVisible] = useState(false);
  const label = providers.find((p) => p.key === provider)?.label;
  return (
    <PageContent>
      <div className="page-intro">
        <h1>Make yourself at home.</h1>
        <p className="intro-copy">
          A few preferences. Everything else is ready to go.
        </p>
      </div>
      <section className="settings-section" aria-labelledby="appearance-title">
        <h2 id="appearance-title">Appearance</h2>
        <p>Fluorescent green, two ways.</p>
        <div className="theme-choices" aria-label="Theme">
          {(["light", "dark"] as const).map((theme) => (
            <button
              key={theme}
              aria-pressed={appearance === theme}
              onClick={() => {
                if (appearance !== theme) toggleTheme();
              }}
            >
              <span className={`theme-swatch ${theme}`} aria-hidden="true">
                <i />
              </span>
              {theme === "light" ? "Pale violet" : "After dark"}
            </button>
          ))}
        </div>
      </section>
      <section className="settings-section" aria-labelledby="connection-title">
        <h2 id="connection-title">AI connection</h2>
        <p className="connection-status">
          <span className="status-dot" aria-hidden="true" />
          {provider
            ? `${label} · your connection`
            : "Built-in service · no setup needed"}
        </p>
        <details
          className="connection-options"
          open={provider ? true : undefined}
        >
          <summary>Advanced connection options</summary>
          <label className="field-label" htmlFor="ai-provider">
            Connection
          </label>
          <select
            id="ai-provider"
            value={provider ?? "default"}
            onChange={(e) => {
              const next =
                e.target.value === "default"
                  ? null
                  : (e.target.value as LLMQueryProvider);
              updateProvider(next);
              setSelectedProvider(next);
              setVisible(false);
            }}
          >
            <option value="default">Built-in service</option>
            {providers.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
          {provider && (
            <>
              <label className="field-label" htmlFor="provider-key">
                {label} API key
              </label>
              <div className="api-key-input">
                <input
                  id="provider-key"
                  type={visible ? "text" : "password"}
                  autoComplete="off"
                  spellCheck={false}
                  value={keys[provider]}
                  onChange={(e) => {
                    updateKeys({ ...keys, [provider]: e.target.value });
                    setStoredApiKey(provider, e.target.value);
                  }}
                />
                <button
                  className="icon-button"
                  aria-label={visible ? "Hide API key" : "Show API key"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
              {!keys[provider] && (
                <p className="quiet-note">
                  Add a key to use this connection, or switch back to the
                  built-in service.
                </p>
              )}
            </>
          )}
          <p className="quiet-note">
            Keys are saved in this browser and sent to the selected provider
            with requests. Choose a compatible model under “Which posts?” when
            asking a question. Avatar image generation uses its own image
            service.
          </p>
        </details>
      </section>
      <section className="settings-section" aria-labelledby="data-title">
        <h2 id="data-title">Your archives and answers</h2>
        <p>
          Saved in this browser. Use the person picker to browse, refresh or
          remove an archive; past questions and avatars have their own delete
          controls.
        </p>
        <p className="quiet-note">
          Asking sends the selected posts to the AI service. Avatar generation
          also uses profile details and, if enabled, the current avatar image.
          Clearing browser data removes local archives, answers and saved keys.
        </p>
      </section>
    </PageContent>
  );
}
