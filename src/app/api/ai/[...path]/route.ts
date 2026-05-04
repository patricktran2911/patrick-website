const UPSTREAM_AI_BASE_URL = (
  process.env.AI_API_URL ??
  process.env.NEXT_PUBLIC_AI_API_URL ??
  "https://ai-dev.patrickcs-web.com"
).replace(/\/$/, "");

const SERVER_API_KEY = (
  process.env.AI_API_KEY ??
  process.env.APP_API_KEY ??
  process.env.NEXT_PUBLIC_AI_API_KEY ??
  ""
).trim();

const AI_PATH_PREFIX = ["api", "v1", "ai"];
const CORE_PATH_PREFIX = ["api", "v1"];
const CORE_ENDPOINTS = new Set(["health", "info"]);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

function buildTargetUrl(path: string[], requestUrl: string) {
  const incomingUrl = new URL(requestUrl);
  const upstreamPath = normalizeUpstreamPath(path);
  const targetUrl = new URL(`${UPSTREAM_AI_BASE_URL}/${upstreamPath.join("/")}`);

  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  return targetUrl;
}

function normalizeUpstreamPath(path: string[]) {
  if (path[0] === "api") {
    return path;
  }

  if (CORE_ENDPOINTS.has(path[0])) {
    return [...CORE_PATH_PREFIX, ...path];
  }

  return [...AI_PATH_PREFIX, ...path];
}

function buildUpstreamHeaders(request: Request) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");

  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);
  if (SERVER_API_KEY) headers.set("authorization", `Bearer ${SERVER_API_KEY}`);

  return headers;
}

function buildResponseHeaders(response: Response) {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  const cacheControl = response.headers.get("cache-control");

  if (contentType) headers.set("content-type", contentType);
  if (cacheControl) headers.set("cache-control", cacheControl);

  return headers;
}

async function proxyRequest(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const targetUrl = buildTargetUrl(path, request.url);

  const response = await fetch(targetUrl, {
    method,
    headers: buildUpstreamHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: buildResponseHeaders(response),
  });
}

export async function GET(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}
