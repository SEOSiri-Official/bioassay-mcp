> 📖 **Official Architecture & Documentation:** [SEOSiri BioAssay Technical Guide](https://www.seosiri.com/2026/07/bioassay-mcp.html) | [Central MCP Directory](https://www.seosiri.com/2026/07/seosiri-mcp-servers.html)

An open-source, local-first Model Context Protocol (MCP) server for High-Throughput Screening (HTS) assay calculations spanning **Sub-Cellular, Cellular, Tissue, and Organism** biological tiers.


## 💖 Sponsorship, B2B Custom Solutions & Attribution

### 👨‍💻 Lead Architect & Attribution
Designed and engineered by **[Momenul Ahmad](https://github.com/MOBILEPHONE)**, Lead Architect and Founder of **[SEOSiri](https://seosiri.com)**.

### 🚀 Supported Biological Segments & Assays
- **Sub-Cellular:** TR-FRET ratio analysis for PROTAC (BRD4/CRBN), KRAS (G12C), receptor binding, and HICA ultra-sensitive protein assays.
- **Cellular:** UA-Glo luminescent screening for 2D/3D cell viability, Caspase 3/7 apoptosis, kinase activity, and reporter gene systems (NF-kB/Wnt).
- **Tissue:** 3D spheroid/organoid drug penetration depth and tissue slice barrier diffusion models.
- **Organism:** *In vivo* animal model pharmacokinetics ($C_{\max}$, AUC, half-life, plasma concentration decay).

## Quickstart
```bash
pip install -e .
pytest tests/test_bioassay.py
```

## 🔌 Claude Desktop / Cursor Setup
Add this configuration to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "seosiri-bioassay": {
      "command": "uv",
      "args": [
        "run",
        "--github",
        "SEOSiri-Official/bioassay-mcp",
        "src/main_server.py"
      ]
    }
  }
}
```

## License
Distributed under the MIT License. See [LICENSE](https://github.com/SEOSiri-Official/bioassay-mcp) for details.
