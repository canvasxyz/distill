import * as st from 'simple-runtypes';

export type LLMQueryProvider = 'cerebras' | 'deepinfra' | 'openrouter' | 'groq' | 'fireworks';
export type LLMQueryConfig = [string, LLMQueryProvider, string | null, boolean];

const llmConfigsRuntype = st.array(
	st.tuple(
		st.string(),
		st.union(st.literal('cerebras'), st.literal('deepinfra'), st.literal('openrouter'), st.literal('groq'), st.literal('fireworks')),
		st.union(st.string(), st.null()),
		st.boolean()
	)
);

export function isLLMQueryConfig(value: unknown): value is LLMQueryConfig[] {
	return st.use(llmConfigsRuntype, value).ok;
}

export const getArgsForProvider = (env: Env, provider: string) => {
	const mapping: Record<string, { baseUrl: string; providerKey: string }> = {
		deepinfra: {
			baseUrl: env.DEEPINFRA_URL,
			providerKey: (env as any).DEEPINFRA_KEY,
		},
		cerebras: {
			baseUrl: env.CEREBRAS_URL,
			providerKey: (env as any).CEREBRAS_KEY,
		},
		openrouter: {
			baseUrl: env.OPENROUTER_URL,
			providerKey: (env as any).OPENROUTER_KEY,
		},
		groq: {
			baseUrl: env.GROQ_URL,
			providerKey: (env as any).GROQ_KEY,
		},
		fireworks: {
			baseUrl: env.FIREWORKS_URL,
			providerKey: (env as any).FIREWORKS_KEY,
		},
	};
	const result = mapping[provider];
	if (!result) {
		throw new Error(`Invalid \`provider\` field given (${provider}), must be one of: ${Object.keys(mapping).join(', ')}`);
	}
	return result;
};

const failureKeyFor = (provider: string, model: string) => `cooldown:last-failure:${provider}::${model}`;

export const parseFailureKey = (key: string) => {
	const parts = key.split(':');
	return { provider: parts[2], model: parts[4] };
};

export const recordAutoFailure = async (env: Env, provider: string, model: string, atEpochMs: number) => {
	await env.PROVIDER_FALLBACK_STATUS.put(failureKeyFor(provider, model), String(atEpochMs));
};

export const isInCooldown = async (env: Env, provider: string, model: string, nowMs: number, cooloffSeconds: number) => {
	const lastStr = await env.PROVIDER_FALLBACK_STATUS.get(failureKeyFor(provider, model));
	if (!lastStr) return false;
	const last = Number(lastStr);
	if (!Number.isFinite(last)) return false;
	return nowMs - last < cooloffSeconds * 1000;
};

export const getViableAutoConfigs = async (
	env: Env,
	nowMs: number,
	cooloffSeconds: number,
	llmConfigs: LLMQueryConfig[]
): Promise<LLMQueryConfig[]> => {
	const checks = llmConfigs.map(async ([model, provider, ...rest]) => {
		// Provider must be configured
		try {
			const { baseUrl, providerKey } = getArgsForProvider(env, provider);
			if (!baseUrl || !providerKey) return null;
		} catch {
			return null;
		}
		// Not currently in cooldown window
		const cooling = await isInCooldown(env, provider, model, nowMs, cooloffSeconds);
		return cooling ? null : ([model, provider, ...rest] as LLMQueryConfig);
	});
	const evaluated = await Promise.all(checks);
	return evaluated.filter(Boolean) as LLMQueryConfig[];
};

export const getCooloffSecondsFromEnv = (env: Env): number => {
	const raw = (env as any).AUTO_COOL_OFF_SECONDS as string | undefined;
	const parsed = raw ? Number(raw) : NaN;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 120;
};
