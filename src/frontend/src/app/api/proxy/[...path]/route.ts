import { NextRequest, NextResponse } from "next/server";
import { getServerTokens } from "@/lib/auth";

const BACKEND_URL = process.env.API_INTERNAL_URL || "http://localhost:5000";

// Only these API prefixes are allowed through the proxy
const ALLOWED_PREFIXES = ["/api/reviews", "/api/moderation", "/api/images"];

async function proxyRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Reject path segments containing traversal patterns
  if (path.some((seg) => seg === ".." || seg === "." || seg.includes("\\"))) {
    return NextResponse.json({ detail: "Invalid path" }, { status: 400 });
  }

  const targetPath = `/${path.join("/")}`;

  // Whitelist: only allow known API prefixes
  if (!ALLOWED_PREFIXES.some((prefix) => targetPath.startsWith(prefix))) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  const url = new URL(targetPath, BACKEND_URL);

  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  let accessToken: string | undefined;
  try {
    const tokens = await getServerTokens();
    accessToken = tokens.accessToken;
  } catch (e) {
    console.error("[proxy] getServerTokens error:", e);
  }

  const headers = new Headers();
  // Forward only safe headers (content-type is critical for multipart/form-data boundaries)
  const forwardHeaders = ["content-type", "accept", "accept-language"];
  for (const name of forwardHeaders) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  } else {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  const response = await fetch(url.toString(), {
    method: req.method,
    headers,
    body,
  });

  const responseHeaders = new Headers();
  responseHeaders.set(
    "content-type",
    response.headers.get("content-type") || "application/json"
  );

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
