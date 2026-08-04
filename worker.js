// worker.js - Protocol-Aware Cloudflare Edge Gateway for SEOSiri BioAssay MCP
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const BACKEND_ENDPOINT = "https://hubappapi.seosiri.com/bioassay";

async function handleRequest(request) {
  const url = new URL(request.url);

  // 1. CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-seosiri-key, mcp-method, mcp-name",
      },
    });
  }

  // 2. Health Check
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({
      status: "HEALTHY",
      service: "SEOSiri BioAssay MCP Edge Gateway",
      version: "1.1.1",
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  // 3. Human Browser Visits ONLY: Redirect to Documentation Page
  const acceptHeader = request.headers.get("Accept") || "";
  const userAgent = request.headers.get("User-Agent") || "";
  
  // If request is GET at root '/' AND comes from a human browser (accepts text/html and not a Cloudflare/MCP bot)
  if ((url.pathname === "/" || url.pathname === "") && request.method === "GET" && acceptHeader.includes("text/html") && !userAgent.includes("Cloudflare")) {
    return Response.redirect("https://www.seosiri.com/2026/07/bioassay-mcp.html", 301);
  }

  // 4. MCP Discovery & Tool Protocol Requests (POST / SSE / Cloudflare Pings) -> Forward to Backend Execution Engine
  try {
    const modifiedRequest = new Request(BACKEND_ENDPOINT + url.pathname + url.search, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    const response = await fetch(modifiedRequest);
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "GATEWAY_TIMEOUT", details: err.message }),
      { status: 504, headers: { "Content-Type": "application/json" } }
    );
  }
}