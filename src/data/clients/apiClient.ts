import { z } from "zod";

export interface ApiClientOptions {
  /** Base URL prepended to every request path. */
  readonly baseUrl?: string;
  /** Custom fetch implementation (e.g. mocked in tests). */
  readonly fetchImpl?: typeof fetch;
  /** Headers applied to every request. */
  readonly defaultHeaders?: HeadersInit;
}

export interface RequestOptions<TSchema extends z.ZodTypeAny> {
  /** Relative path that will be appended to the base URL. */
  readonly path: string;
  /** HTTP method. Defaults to `GET`. */
  readonly method?: string;
  /** Optional query string parameters. */
  readonly query?: Record<string, string | number | boolean | undefined>;
  /** Optional request body. Objects are serialised to JSON automatically. */
  readonly body?: unknown;
  /** Additional per-request headers. */
  readonly headers?: HeadersInit;
  /** Zod schema used to parse the JSON response. */
  readonly schema: TSchema;
}

export class ApiClientError extends Error {
  public readonly status?: number;
  public readonly issues?: z.ZodIssue[];
  public readonly details?: unknown;

  constructor(message: string, options: { status?: number; issues?: z.ZodIssue[]; details?: unknown } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.issues = options.issues;
    this.details = options.details;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private fetchImpl: typeof fetch | undefined;
  private readonly defaultHeaders: HeadersInit | undefined;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl?.replace(/\/$/, "") ?? "";
    this.fetchImpl = options.fetchImpl;
    this.defaultHeaders = options.defaultHeaders;
  }

  async request<TSchema extends z.ZodTypeAny>(options: RequestOptions<TSchema>): Promise<z.infer<TSchema>> {
    const url = this.buildUrl(options.path, options.query);
    const headers = new Headers(this.defaultHeaders ?? undefined);
    if (options.headers) {
      new Headers(options.headers).forEach((value, key) => headers.set(key, value));
    }

    let body: BodyInit | undefined;
    if (typeof options.body === "object" && options.body !== null) {
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
      body = JSON.stringify(options.body);
    } else if (options.body !== undefined) {
      body = options.body as BodyInit;
    }

    let response: Response;
    const fetchImpl = this.fetchImpl ?? fetch;

    try {
      response = await fetchImpl(url, {
        method: options.method ?? "GET",
        headers,
        body,
      });
    } catch (error) {
      throw new ApiClientError("Network request failed", { details: error });
    }

    let payload: unknown;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        payload = await response.json();
      } catch (error) {
        throw new ApiClientError("Failed to parse JSON response", { status: response.status, details: error });
      }
    } else if (response.status !== 204) {
      payload = await response.text();
    }

    if (!response.ok) {
      throw new ApiClientError("Request failed", { status: response.status, details: payload });
    }

    try {
      return options.schema.parse(payload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiClientError("Response validation failed", {
          status: response.status,
          issues: error.issues,
          details: payload,
        });
      }
      throw error;
    }
  }

  get<TSchema extends z.ZodTypeAny>(path: string, schema: TSchema, query?: RequestOptions<TSchema>["query"]) {
    return this.request({ path, schema, query, method: "GET" });
  }

  post<TSchema extends z.ZodTypeAny>(path: string, schema: TSchema, body?: unknown) {
    return this.request({ path, schema, body, method: "POST" });
  }

  patch<TSchema extends z.ZodTypeAny>(path: string, schema: TSchema, body?: unknown) {
    return this.request({ path, schema, body, method: "PATCH" });
  }

  delete<TSchema extends z.ZodTypeAny>(path: string, schema: TSchema) {
    return this.request({ path, schema, method: "DELETE" });
  }

  setFetchImplementation(fetchImpl: typeof fetch | undefined) {
    this.fetchImpl = fetchImpl;
  }

  private buildUrl(path: string, query?: RequestOptions<z.ZodTypeAny>["query"]) {
    const normalisedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalisedPath}`, typeof window === "undefined" ? "http://localhost" : window.location.origin);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined) return;
        url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }
}

export const apiClient = new ApiClient({ baseUrl: "/api" });
