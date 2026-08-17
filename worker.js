// worker.js - SEOSiri BioAssay MCP Cloudflare Edge Gateway
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const BACKEND_ENDPOINT = "https://hubappapi.seosiri.com/bioassay";

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-seosiri-key",
      },
    });
  }

  
    // API Endpoint: TR-FRET Ratio Calculator
    if (url.pathname === "/api/tr-fret" && request.method === "POST") {
      try {
        const body = await request.json();
        const donor = Number(body.donor_signal || body.donor || 1);
        const acceptor = Number(body.acceptor_signal || body.acceptor || 0);
        const ratio = (acceptor / donor) * 10000;

        return new Response(JSON.stringify({
          status: "SUCCESS",
          assay_type: "TR-FRET Ratio Calculator",
          tr_fret_ratio: Number(ratio.toFixed(2)),
          donor_signal: donor,
          acceptor_signal: acceptor
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ status: "ERROR", message: "Invalid payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

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

  const acceptHeader = request.headers.get("Accept") || "";
  if ((url.pathname === "/" || url.pathname === "") && acceptHeader.includes("text/html")) {
    return Response.redirect("https://www.seosiri.com/2026/07/bioassay-mcp.html", 301);
  }

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
