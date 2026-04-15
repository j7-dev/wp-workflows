import { http, HttpResponse, type HttpHandler } from 'msw';
import { server } from '../mocks/server';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Override a single MSW handler for the current test.
 * The override is automatically reset in afterEach via server.resetHandlers().
 */
export function overrideMswHandler(
  method: HttpMethod,
  url: string,
  body: unknown,
  status = 200,
): void {
  const handler = http[method](url, () => {
    return HttpResponse.json(body, { status });
  });
  server.use(handler);
}

/**
 * Override a handler to return an error response.
 */
export function overrideMswError(
  method: HttpMethod,
  url: string,
  errorBody: { message: string; [key: string]: unknown },
  status = 400,
): void {
  overrideMswHandler(method, url, errorBody, status);
}

/**
 * Create a handler that captures the request body for later assertion.
 * Returns a ref object — read `ref.current` after the interaction.
 */
export function captureMswRequest(
  method: HttpMethod,
  url: string,
  responseBody: unknown = { success: true },
  status = 200,
): { current: Record<string, unknown> | null } {
  const ref = { current: null as Record<string, unknown> | null };

  const handler = http[method](url, async ({ request }) => {
    if (method !== 'get') {
      ref.current = (await request.json()) as Record<string, unknown>;
    } else {
      const urlObj = new URL(request.url);
      ref.current = Object.fromEntries(urlObj.searchParams.entries());
    }
    return HttpResponse.json(responseBody, { status });
  });

  server.use(handler);
  return ref;
}
