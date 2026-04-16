/**
 * Ambient type stubs for `msw` (Mock Service Worker).
 * MSW is not a production dependency; these declarations satisfy the TypeScript
 * compiler for files under src/__mocks__ that import from it.
 */

declare module 'msw' {
  export type PathParams = Record<string, string | readonly string[]>;

  export interface HttpRequestResolverExtras<Params extends PathParams = PathParams> {
    request: Request;
    params: Params;
    cookies: Record<string, string>;
  }

  export type HttpResponseResolver<Params extends PathParams = PathParams> = (
    info: HttpRequestResolverExtras<Params>,
  ) => Response | undefined | null | void | Promise<Response | undefined | null | void>;

  export type RequestHandler = unknown;

  export const http: {
    get(path: string, resolver: HttpResponseResolver): RequestHandler;
    post(path: string, resolver: HttpResponseResolver): RequestHandler;
    put(path: string, resolver: HttpResponseResolver): RequestHandler;
    patch(path: string, resolver: HttpResponseResolver): RequestHandler;
    delete(path: string, resolver: HttpResponseResolver): RequestHandler;
    all(path: string, resolver: HttpResponseResolver): RequestHandler;
  };

  export class HttpResponse extends Response {
    static json<T>(body: T, init?: ResponseInit): HttpResponse;
    static text(body: string, init?: ResponseInit): HttpResponse;
    static html(body: string, init?: ResponseInit): HttpResponse;
    static xml(body: string, init?: ResponseInit): HttpResponse;
  }

  export function delay(durationMs?: number): Promise<void>;
}

declare module 'msw/node' {
  import type { RequestHandler } from 'msw';

  export interface SetupServerApi {
    listen(options?: { onUnhandledRequest?: 'bypass' | 'error' | 'warn' }): void;
    close(): void;
    resetHandlers(...handlers: RequestHandler[]): void;
    use(...handlers: RequestHandler[]): void;
  }

  export function setupServer(...handlers: RequestHandler[]): SetupServerApi;
}

declare module 'msw/browser' {
  import type { RequestHandler } from 'msw';

  export interface StartOptions {
    onUnhandledRequest?: 'bypass' | 'error' | 'warn';
    serviceWorker?: { url?: string; options?: RegistrationOptions };
    quiet?: boolean;
  }

  export interface SetupWorkerApi {
    start(options?: StartOptions): Promise<ServiceWorkerRegistration | undefined>;
    stop(): void;
    resetHandlers(...handlers: RequestHandler[]): void;
    use(...handlers: RequestHandler[]): void;
  }

  export function setupWorker(...handlers: RequestHandler[]): SetupWorkerApi;
}
