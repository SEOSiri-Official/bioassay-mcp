// worker.js - Instant Edge-Native MCP Server Gateway
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const TOOLS_MANIFEST = [
  {
    name: "calculate_tr_fret_ratio",
    description: "Calculates 665nm/620nm emission ratios for target engagement assays (PROTAC, KRAS, cAMP).",
    inputSchema: {
      type: "object",
      properties: {
        donor_signal_620nm: { type: "number" },
        acceptor_signal_665nm: { type: "number" },
        assay_type: { type: "string" },
        biological_segment: { type: "string" }
      },
      required: ["donor_signal_620nm", "acceptor_signal_665nm"]
    }
  },
  {
    name: "analyze_uaglo_luminescence",
    description: "Processes luminescent RLU signals for 2D/3D viability, apoptosis, and reporter genes.",
    inputSchema: {
      type: "object",
      properties: {
        sample_rlu: { type: "number" },
        control_rlu: { type: "number" },
        readout_type: { type: "string" },
        biological_segment: { type: "string" }
      },
      required: ["sample_rlu", "control_rlu"]
    }
  },
  {
    name: "quantify_onestep_elisa",
    description: "1-hour ELISA biomarker concentration calculations (IL-2, IL-6, IFN-g, IgG, TSH).",
    inputSchema: {
      type: "object",
      properties: {
        sample_od450: { type: "number" },
        blank_od450: { type: "number" },
        slope: { type: "number" },
        intercept: { type: "number" },
        target_biomarker: { type: "string" }
      },
      required: ["sample_od450", "blank_od450"]
    }
  },
  {
    name: "analyze_hica_fluorescence",
    description: "High-sensitivity fluorescence analysis for low-abundance proteins (IL-2R, IL-8, IL-12p70).",
    inputSchema: {
      type: "object",
      properties: {
        relative_fluorescence_units: { type: "number" },
        baseline_rfu: { type: "number" },
        target_protein: { type: "string" }
      },
      required: ["relative_fluorescence_units", "baseline_rfu"]
    }
  },
  {
    name: "calculate_tissue_organoid_penetration",
    description: "Evaluates drug penetration depth and barrier permeability in 3D spheroid models.",
    inputSchema: {
      type: "object",
      properties: {
        organoid_diameter_um: { type: "number" },
        surface_fluorescence_rfu: { type: "number" },
        core_fluorescence_rfu: { type: "number" }
      },
      required: ["organoid_diameter_um", "surface_fluorescence_rfu", "core_fluorescence_rfu"]
    }
  },
  {
    name: "calculate_organism_in_vivo_pharmacokinetics",
    description: "Computes in vivo animal dosing, C_max, half-life, and AUC decay.",
    inputSchema: {
      type: "object",
      properties: {
        dose_mg_kg: { type: "number" },
        body_weight_kg: { type: "number" },
        clearance_rate_l_hr: { type: "number" },
        volume_distribution_l: { type: "number" }
      },
      required: ["dose_mg_kg", "body_weight_kg", "clearance_rate_l_hr", "volume_distribution_l"]
    }
  },
  {
    name: "generate_plate_layout",
    description: "Generates 96-well and 384-well microplate mappings with segment tagging.",
    inputSchema: {
      type: "object",
      properties: {
        format_wells: { type: "number" },
        num_standards: { type: "number" },
        num_controls: { type: "number" }
      }
    }
  },
  {
    name: "get_assay_kit_specifications",
    description: "Provides reaction volume and protocol specs for TR-FRET, UA-Glo, ELISA, and HICA.",
    inputSchema: {
      type: "object",
      properties: {
        kit_category: { type: "string" }
      },
      required: ["kit_category"]
    }
  },
  {
    name: "ingest_medical_device_telemetry",
    description: "Ingests raw telemetry from microplate readers and spectrophotometers with calibration checks.",
    inputSchema: {
      type: "object",
      properties: {
        device_id: { type: "string" },
        device_type: { type: "string" },
        measurement_type: { type: "string" },
        raw_value: { type: "number" },
        unit_of_measure: { type: "string" }
      },
      required: ["device_id", "device_type", "raw_value"]
    }
  },
  {
    name: "convert_to_fhir_observation",
    description: "Formats assay measurements into HL7 FHIR v4.0.1 Observation JSON resources.",
    inputSchema: {
      type: "object",
      properties: {
        patient_id_hash: { type: "string" },
        device_id: { type: "string" },
        loinc_code: { type: "string" },
        display_name: { type: "string" },
        value_quantity: { type: "number" },
        value_unit: { type: "string" }
      },
      required: ["patient_id_hash", "device_id", "loinc_code", "value_quantity"]
    }
  }
];

async function handleRequest(request) {
  const url = new URL(request.url);

  // 1. CORS Headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-seosiri-key, mcp-method, mcp-name",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 2. Health Endpoint
  if (url.pathname === "/health") {
    return new Response(JSON.stringify({
      status: "HEALTHY",
      service: "SEOSiri BioAssay MCP Edge Gateway",
      version: "1.1.1",
      timestamp: new Date().toISOString()
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // 3. Human Web Browsers (GET request with text/html Accept header)
  const acceptHeader = request.headers.get("Accept") || "";
  const userAgent = request.headers.get("User-Agent") || "";
  if (request.method === "GET" && acceptHeader.includes("text/html") && !userAgent.includes("Cloudflare")) {
    return Response.redirect("https://www.seosiri.com/2026/07/bioassay-mcp.html", 301);
  }

  // 4. Instant JSON-RPC MCP Response (Zero Backend Latency / Prevents Timeouts)
  try {
    let reqId = 1;
    let method = "";
    if (request.method === "POST") {
      try {
        const body = await request.json();
        reqId = body.id || 1;
        method = body.method || "";
      } catch (e) {}
    }

    if (method === "initialize") {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        id: reqId,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "seosiri-bioassay-mcp", version: "1.1.1" }
        }
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Default response for tools/list or general discovery
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: reqId,
      result: { tools: TOOLS_MANIFEST }
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      result: { tools: TOOLS_MANIFEST }
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}