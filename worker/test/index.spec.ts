import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Tweet analysis worker', () => {
	it('responds with status on GET (unit style)', async () => {
		const request = new IncomingRequest('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		const json = await response.json();
		expect(json).toHaveProperty('statuses');
		expect(json).toHaveProperty('cooloffSeconds');
		expect(json.cooloffSeconds).toBe(120);
	});

	it('responds with status on GET (integration style)', async () => {
		const response = await SELF.fetch('https://example.com');
		const json = await response.json();
		expect(json).toHaveProperty('statuses');
		expect(json).toHaveProperty('cooloffSeconds');
		expect(json.cooloffSeconds).toBe(120);
	});

	it('rejects non-POST requests with correct error', async () => {
		const request = new IncomingRequest('http://example.com', { method: 'PUT' });
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(400);
		expect(await response.text()).toBe('Request method must be POST');
	});
});
