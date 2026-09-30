export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/health") return new Response(JSON.stringify({ status: "HEALTHY", service: "BioAssay & HTS Automation" }), { headers: { "Content-Type": "application/json" } });
    if (url.pathname === "/sse") return new Response("BioAssay & HTS Automation SSE Active", { headers: { "Content-Type": "text/event-stream" } });
    try { return await env.ASSETS.fetch(request); } catch { return new Response("BioAssay & HTS Automation Edge Active"); }
  }
};