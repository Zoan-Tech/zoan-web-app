import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8091/api/v1";

export interface ProxyOptions {
  /** Base path prefix to add to the backend URL (e.g., "auth", "posts") */
  basePath: string;
}

/**
 * Creates a proxy handler for forwarding requests to the backend
 */
export async function proxyToBackend(
  request: NextRequest,
  pathSegments: string[],
  options: ProxyOptions
) {
  const url = new URL(request.url);
  const fullPath = [options.basePath, ...pathSegments].filter(Boolean).join("/");
  const targetUrl = `${BACKEND_URL}/${fullPath}${url.search}`;

  // Forward relevant headers
  const headers = new Headers();
  
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }
  
  headers.set("Content-Type", request.headers.get("content-type") || "application/json");
  
  // Forward custom headers
  const deviceId = request.headers.get("x-device-id");
  if (deviceId) {
    headers.set("X-Device-Id", deviceId);
  }
  
  const fingerprint = request.headers.get("x-fingerprint");
  if (fingerprint) {
    headers.set("X-Fingerprint", fingerprint);
  }

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Add body for non-GET/HEAD requests
    if (!["GET", "HEAD"].includes(request.method)) {
      const contentType = request.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } else if (contentType.includes("multipart/form-data")) {
        fetchOptions.body = await request.arrayBuffer();
        headers.set("Content-Type", contentType);
      } else {
        fetchOptions.body = await request.text();
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    const contentType = response.headers.get("content-type") || "";
    let responseBody: BodyInit;
    
    if (contentType.includes("application/json")) {
      responseBody = JSON.stringify(await response.json());
    } else {
      responseBody = await response.arrayBuffer();
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Proxy error [${options.basePath}]:`, error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Creates route handlers for a specific API domain
 */
export function createApiRouteHandlers(basePath: string) {
  const options: ProxyOptions = { basePath };

  return {
    GET: async (
      request: NextRequest,
      { params }: { params: Promise<{ path?: string[] }> }
    ) => {
      const { path = [] } = await params;
      return proxyToBackend(request, path, options);
    },

    POST: async (
      request: NextRequest,
      { params }: { params: Promise<{ path?: string[] }> }
    ) => {
      const { path = [] } = await params;
      return proxyToBackend(request, path, options);
    },

    PUT: async (
      request: NextRequest,
      { params }: { params: Promise<{ path?: string[] }> }
    ) => {
      const { path = [] } = await params;
      return proxyToBackend(request, path, options);
    },

    PATCH: async (
      request: NextRequest,
      { params }: { params: Promise<{ path?: string[] }> }
    ) => {
      const { path = [] } = await params;
      return proxyToBackend(request, path, options);
    },

    DELETE: async (
      request: NextRequest,
      { params }: { params: Promise<{ path?: string[] }> }
    ) => {
      const { path = [] } = await params;
      return proxyToBackend(request, path, options);
    },
  };
}
