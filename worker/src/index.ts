/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OpenAI from 'openai';
import {
	getArgsForProvider,
	getCooloffSecondsFromEnv,
	getViableAutoConfigs,
	isLLMQueryConfig,
	parseFailureKey,
	recordAutoFailure,
} from './providers';

// Extended types to support OpenRouter's reasoning parameter
type ReasoningConfig = {
	effort?: 'minimal' | 'low' | 'medium' | 'high';
	max_tokens?: number;
};

type ExtendedChatCompletionParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
	reasoning?: ReasoningConfig;
};

type ExtendedMessage = OpenAI.Chat.Completions.ChatCompletion['choices'][0]['message'] & {
	reasoning?: string;
};

type ChatCompletionResponse = Omit<OpenAI.Chat.Completions.ChatCompletion, 'choices'> & {
	choices: Array<Omit<OpenAI.Chat.Completions.ChatCompletion['choices'][0], 'message'> & { message: ExtendedMessage }>;
	provider?: string;
};

const callClassifier = async (
	body: ExtendedChatCompletionParams,
	baseUrl: string,
	providerKey: string
): Promise<ChatCompletionResponse> => {
	const response = await fetch(`${baseUrl}/chat/completions`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${providerKey}`,
		},
		body: JSON.stringify(body),
	});
	const json = (await response.json()) as ChatCompletionResponse;

	if (!response.ok) {
		throw new Error(`Upstream error (${response.status}): ${JSON.stringify(json)}`);
	}
	return json;
};

export default {
	async fetch(request, env): Promise<Response> {
		const allowedOrigins = new Set(['https://distill.org', 'https://www.distill.org', 'http://localhost:5173']);
		const origin = request.headers.get('Origin') || undefined;

		const originAllowed = !origin || allowedOrigins.has(origin);

		if (!originAllowed) {
			return new Response('Origin not allowed', { status: 403 });
		}

		const corsHeaders: HeadersInit | undefined =
			origin && originAllowed
				? {
						'Access-Control-Allow-Origin': origin,
						'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
						'Access-Control-Allow-Headers': '*',
						'Access-Control-Max-Age': '600',
						Vary: 'Origin',
				  }
				: undefined;

		// Handle preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		if (request.method === 'GET') {
			// get status

			const statuses: Record<string, Record<string, number>> = {};
			const kvs = await env.PROVIDER_FALLBACK_STATUS.list();
			for (const key of kvs.keys) {
				// parse the key to get the provider and model
				const { provider, model } = parseFailureKey(key.name);

				const value = await env.PROVIDER_FALLBACK_STATUS.get(key.name);
				if (value) {
					statuses[provider] ||= {};
					statuses[provider][model] = parseInt(value);
				}
			}

			return Response.json({ statuses, cooloffSeconds: getCooloffSecondsFromEnv(env) }, { status: 200, headers: corsHeaders });
		}

		if (request.method !== 'POST') {
			return new Response('Request method must be POST', { status: 400, headers: corsHeaders });
		}

		if (request.headers.get('content-type') !== 'application/json') {
			return new Response('Request content-type must be application/json', { status: 400, headers: corsHeaders });
		}

		let body: {
			params?: ExtendedChatCompletionParams;
			llmConfigs?: unknown;
			cooloffSeconds?: number;
		};
		try {
			body = (await request.json()) as typeof body;
		} catch {
			return new Response('Invalid JSON body', { status: 400, headers: corsHeaders });
		}

		if (!body.params) {
			return new Response('Missing `params` field', { status: 400, headers: corsHeaders });
		}

		const llmConfigs = body.llmConfigs;
		if (!llmConfigs) {
			return new Response('Missing `llmConfigs` field', { status: 400, headers: corsHeaders });
		}

		if (!isLLMQueryConfig(llmConfigs)) {
			return new Response('Invalid `llmConfigs` field', { status: 400, headers: corsHeaders });
		}

		const nowMs = Date.now();
		const override = typeof body.cooloffSeconds === 'number' ? body.cooloffSeconds : undefined;
		const cooloffSeconds = override && override > 0 ? override : getCooloffSecondsFromEnv(env);
		const candidates = await getViableAutoConfigs(env, nowMs, cooloffSeconds, llmConfigs);
		if (!candidates.length) {
			return new Response('No available providers/models (all in cooldown or not configured)', { status: 503, headers: corsHeaders });
		}
		let lastError: unknown = undefined;
		for (const [model, provider] of candidates) {
			let providerArgs;
			try {
				providerArgs = getArgsForProvider(env, provider);
			} catch (e) {
				lastError = e;
				await recordAutoFailure(env, provider, model, nowMs);
				continue;
			}
			const paramsWithModel: ExtendedChatCompletionParams = {
				...body.params,
				model,
			};
			try {
				const responseFromUpstream = await callClassifier(paramsWithModel, providerArgs.baseUrl, providerArgs.providerKey);

				return Response.json(
					// pass thru the resolved provider that openrouter used
					{ ...responseFromUpstream, provider: provider === 'openrouter' ? responseFromUpstream.provider : provider, model },
					{
						headers: corsHeaders,
					}
				);
			} catch (e) {
				console.log('auto upstream error from', provider, model, e);
				lastError = e;
				await recordAutoFailure(env, provider, model, Date.now());
				continue;
			}
		}
		return new Response(`${lastError}`, { headers: corsHeaders, status: 503 });
	},
} satisfies ExportedHandler<Env>;
