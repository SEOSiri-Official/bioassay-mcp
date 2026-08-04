// worker.js - Native MCP Edge Discovery & Proxy Gateway for SEOSiri BioAssay
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const TOOLS_MANIFEST = [
  { name: "calculate_tr_fret_ratio", description: "Calculates 665nm/620nm emission ratios for target engagement assays (PROTAC, KRAS, cAMP)." },
  { name: "analyze_uaglo_luminescence", description: "Processes luminescent RLU signals for 2D/3D viability, apoptosis, and reporter genes." },
  { name: "quantify_onestep_elisa", description: "1-hour ELISA biomarker concentration calculations (IL-2, IL-6, IFN-g, IgG, TSH)." },
  { name: "analyze_hica_fluorescence", description: "High-sensitivity fluorescence analysis for low-abundance proteins (IL-2R, IL-8, IL-12p70)." },
  { name: "calculate_tissue_organoid_penetration", description: "Evaluates drug penetration depth and barrier permeability in 3D spheroid models." },
  { name: "calculate_organism_in_vivo_pharmacokinetics", description: "Computes in vivo animal dosing, C_max, half-life, and AUC decay." },
  { name: "generate_plate_layout", description: "Generates 96-well and 384-well microplate mappings with segment tagging." },
  { name: "get_assay_kit_specifications", description: "Provides reaction volume and protocol specs for TR-FRET, UA-Glo, ELISA, and HICA." },
  { name: "ingest_medical_device_telemetry", description: "Ingests raw telemetry from microplate readers and spectrophotometers with calibration checks." },
  { name: "convert_to_fhir_observation", description: "Formats assay measurements into HL7 FHIR v4.0.1 Observation JSON resources." }
];

async function handleRequest(request) {
  const url = new URL(request.url);

  // 1. CORS Preflight Handling
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

  // 2. Health Endpoint
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

  // 3. MCP Protocol Requests (POST Requests or Cloudflare Discovery Pings)
  if (request.method === "POST") {
    try {
      const body = await request.json();
      
      // Handle MCP initialize request
      if (body.method === "initialize") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: body.id || 1,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "seosiri-bioassay-mcp", version: "1.1.1" }
          }
        }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
      }

      // Handle MCP tools/list request
      if (body.method === "tools/list") {
        return new Response(JSON.stringify({
          jsonrpc: "2.0",
          id: body.id || 1,
          result: { tools: TOOLS_MANIFEST }
        }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
      }
    } catch (e) {
      // Return tool manifest if body parsing fails or if it is a general discovery check
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        result: { tools: TOOLS_MANIFEST }
      }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }
  }

  // 4. Human Web Browser GET Requests: Redirect to Documentation Page
  const acceptHeader = request.headers.get("Accept") || "";
  if (request.method === "GET" && acceptHeader.includes("text/html")) {
    return Response.redirect("https://www.seosiri.com/2026/07/bioassay-mcp.html", 301);
  }

  // 5. Default Fallback Response for MCP Discovery Pings
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    result: { tools: TOOLS_MANIFEST }
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}