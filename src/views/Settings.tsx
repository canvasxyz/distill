import {
  Box,
  Text,
  Flex,
  Switch,
  TextField,
  RadioGroup,
  Tooltip,
  IconButton,
  Card,
} from "@radix-ui/themes";
import {
  GearIcon,
  EyeOpenIcon,
  EyeClosedIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { Header } from "../components/Header";
import { useTheme } from "../components/ThemeProvider";
import { useState, useEffect } from "react";
import type { LLMQueryProvider } from "../constants";
import {
  getStoredApiKey,
  setStoredApiKey,
  getSelectedProvider,
  setSelectedProvider,
  hasProviderApiKey,
} from "../utils/provider";

const PROVIDER_INFO = [
  {
    key: "cerebras",
    label: "Cerebras",
    color: "violet",
    description: "Fast, open weights. API key required.",
  },
  {
    key: "deepinfra",
    label: "Deep Infra",
    color: "pink",
    description: "Selection of leading open models. API key required.",
  },
  {
    key: "openrouter",
    label: "OpenRouter",
    color: "blue",
    description: "Multi-backend router for various models.",
  },
  {
    key: "groq",
    label: "Groq",
    color: "orange",
    description: "Very fast inference for Llama and Mixtral. API key required.",
  },
  {
    key: "fireworks",
    label: "Fireworks",
    color: "yellow",
    description: "Fast inference, lots of open models. API key required.",
  },
];

export function Settings() {
  const { appearance, toggleTheme } = useTheme();

  const [cerebrasKey, setCerebrasKey] = useState("");
  const [deepinfraKey, setDeepinfraKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [fireworksKey, setFireworksKey] = useState("");
  const [selectedProvider, setSelectedProviderState] =
    useState<LLMQueryProvider | null>(null);

  // Reveal API-key visibility
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCerebrasKey(getStoredApiKey("cerebras"));
    setDeepinfraKey(getStoredApiKey("deepinfra"));
    setOpenrouterKey(getStoredApiKey("openrouter"));
    setGroqKey(getStoredApiKey("groq"));
    setFireworksKey(getStoredApiKey("fireworks"));
    setSelectedProviderState(getSelectedProvider());
  }, []);

  const handleApiKeyChange =
    (provider: LLMQueryProvider, setter: (val: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setter(value);
      setStoredApiKey(provider, value);
    };

  const handleProviderChange = (value: string) => {
    const provider = value === "default" ? null : (value as LLMQueryProvider);
    setSelectedProviderState(provider);
    setSelectedProvider(provider);
  };

  const toggleKeyVisibility = (provider: LLMQueryProvider) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  // For highlights & smooth-UI, separate provider choice visually
  return (
    <Box width="100%">
      <Header
        leftContent={
          <Flex align="center" gap="2">
            <GearIcon />
            <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: 0.5 }}>
              Settings
            </span>
          </Flex>
        }
      />
      <Box
        style={{
          maxWidth: "575px",
          margin: "36px auto 0 auto",
          width: "100%",
          boxSizing: "border-box",
          padding: "0 20px 20px",
        }}
      >
        <Card
          size="2"
          style={{
            overflow: "hidden",
            boxShadow: "0 2px 12px 0 rgba(30, 35, 74, 0.08)",
          }}
        >
          {/* Appearance */}
          <Box mb="5">
            <Flex
              align="center"
              justify="between"
              style={{
                background: "var(--gray-2)",
                borderRadius: 10,
                padding: "18px 20px",
              }}
            >
              <Flex direction="column">
                <Text size="4" weight="medium">
                  Theme
                </Text>
                <Text size="2" color="gray" mt="1">
                  <span style={{ verticalAlign: "middle" }}>
                    {appearance === "dark" ? "Dark" : "Light"}
                  </span>{" "}
                  mode
                </Text>
              </Flex>
              <Flex align="center" gap="3">
                <Text size="2" color="gray">
                  {appearance === "dark" ? "🌙" : "☀️"}
                </Text>
                <Switch
                  checked={appearance === "dark"}
                  onCheckedChange={toggleTheme}
                  size="3"
                />
              </Flex>
            </Flex>
          </Box>
          {/* Provider */}
          <Box mb="5">
            <Box mb="2">
              <Text size="4" weight="medium" as="span">
                LLM Provider
              </Text>
              <Text size="2" color="gray" ml="2">
                (choose preferred cloud API, or use fast built-in default)
              </Text>
            </Box>
            <RadioGroup.Root
              value={selectedProvider || "default"}
              onValueChange={handleProviderChange}
            >
              <Flex
                direction="column"
                gap="2"
                style={{ marginLeft: 2, marginTop: 5 }}
              >
                <Card
                  variant={selectedProvider === null ? "classic" : "surface"}
                  style={{
                    borderLeft: "4px solid var(--accent-8)",
                    background:
                      selectedProvider === null
                        ? "var(--accent-a2)"
                        : undefined,
                    padding: "13px",
                  }}
                >
                  <Text
                    as="label"
                    size="3"
                    weight={selectedProvider === null ? "bold" : "medium"}
                  >
                    <Flex align="center" gap="3">
                      <RadioGroup.Item value="default" />
                      <Box>
                        <Text size="3">Default (Proxy Server)</Text>
                        <Text as="div" size="2" color="gray" mt="0.5">
                          No setup needed • Fastest for most users
                        </Text>
                      </Box>
                    </Flex>
                  </Text>
                </Card>
                {PROVIDER_INFO.map((prov) => (
                  <Card
                    key={prov.key}
                    variant={
                      selectedProvider === prov.key ? "classic" : "surface"
                    }
                    style={{
                      borderLeft: `4px solid var(--${prov.color}-8)`,
                      background:
                        selectedProvider === prov.key
                          ? `var(--${prov.color}-a2)`
                          : undefined,
                      padding: "13px",
                    }}
                  >
                    <Text
                      as="label"
                      size="3"
                      weight={selectedProvider === prov.key ? "bold" : "medium"}
                    >
                      <Flex align="center" gap="3">
                        <RadioGroup.Item value={prov.key} />
                        <Box>
                          <Flex gap="1" align="center">
                            <Text size="3">{prov.label}</Text>
                            {hasProviderApiKey(
                              prov.key as LLMQueryProvider,
                            ) && (
                              <Tooltip content="API key set">
                                <CheckCircledIcon
                                  color="var(--green-9)"
                                  width={16}
                                  height={16}
                                />
                              </Tooltip>
                            )}
                          </Flex>
                          <Text as="div" size="2" color="gray" mt="0.5">
                            {prov.description}
                          </Text>
                        </Box>
                      </Flex>
                    </Text>
                  </Card>
                ))}
              </Flex>
            </RadioGroup.Root>
          </Box>
          {/* API Keys */}
          <Box mb="2">
            <Box mb="2">
              <Text size="4" weight="medium" as="span">
                API Keys
              </Text>
              <Text size="2" color="gray" ml="2">
                (optional; private to your browser)
              </Text>
            </Box>
            <Flex direction="column" gap="4">
              {PROVIDER_INFO.map((prov) => {
                const keyValue = (() => {
                  switch (prov.key) {
                    case "cerebras":
                      return cerebrasKey;
                    case "deepinfra":
                      return deepinfraKey;
                    case "openrouter":
                      return openrouterKey;
                    case "groq":
                      return groqKey;
                    case "fireworks":
                      return fireworksKey;
                    default:
                      return "";
                  }
                })();
                const setter = (() => {
                  switch (prov.key) {
                    case "cerebras":
                      return setCerebrasKey;
                    case "deepinfra":
                      return setDeepinfraKey;
                    case "openrouter":
                      return setOpenrouterKey;
                    case "groq":
                      return setGroqKey;
                    case "fireworks":
                      return setFireworksKey;
                    default:
                      return () => {};
                  }
                })();
                const label = prov.label + " API Key";
                return (
                  <Flex key={prov.key} align="center" gap="3">
                    <Box flexGrow="1">
                      <Text size="2" weight="medium">
                        {label}
                      </Text>
                      <TextField.Root
                        type={visibleKeys[prov.key] ? "text" : "password"}
                        placeholder={`Enter ${prov.label} API Key`}
                        value={keyValue}
                        onChange={handleApiKeyChange(
                          prov.key as LLMQueryProvider,
                          setter,
                        )}
                        style={{
                          width: "100%",
                          marginTop: 4,
                        }}
                        autoComplete="off"
                      />
                    </Box>
                    <Tooltip
                      content={visibleKeys[prov.key] ? "Hide key" : "Show key"}
                    >
                      <IconButton
                        size="2"
                        variant="soft"
                        color="gray"
                        style={{ marginTop: 22 }}
                        onClick={() =>
                          toggleKeyVisibility(prov.key as LLMQueryProvider)
                        }
                        aria-label="Toggle visibility"
                      >
                        {visibleKeys[prov.key] ? (
                          <EyeOpenIcon />
                        ) : (
                          <EyeClosedIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Flex>
                );
              })}
            </Flex>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
