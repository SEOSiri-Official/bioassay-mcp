// worker.js - Native SSE & Protocol Gateway for SEOSiri BioAssay
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

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-seosiri-key, mcp-method, mcp-name",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  if (url.pathname === "/health") {
    return new Response(JSON.stringify({
      status: "HEALTHY",
      service: "SEOSiri BioAssay MCP Edge Gateway",
      version: "1.1.1",
      timestamp: new Date().toISOString()
    }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
  }

  // Handle SSE Connection or MCP Discovery Ping
  if (url.pathname === "/sse" || url.pathname === "/mcp" || request.method === "POST" || request.headers.get("Accept")?.includes("event-stream")) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "seosiri-bioassay-mcp", version: "1.1.1" },
        tools: TOOLS_MANIFEST
      }
    }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  }

  // Redirect Human Browsers to Article
  const acceptHeader = request.headers.get("Accept") || "";
  if (request.method === "GET" && acceptHeader.includes("text/html")) {
    return Response.redirect("https://www.seosiri.com/2026/07/bioassay-mcp.html", 301);
  }

  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    result: { tools: TOOLS_MANIFEST }
  }), { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
}
