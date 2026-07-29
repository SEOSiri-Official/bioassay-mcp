# src/main_server.py
import os
import sys

# Force the project root directory into the Python path for cross-platform execution
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import math
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("SEOSiri-BioAssay-Orchestrator")

# Biological Hierarchy Segments Constant
VALID_BIOLOGICAL_SEGMENTS = ["SUB_CELLULAR", "CELLULAR", "TISSUE", "ORGANISM"]


def validate_segment(segment_input: str) -> str:
    """Helper to validate and normalize biological hierarchy segment inputs."""
    clean = segment_input.upper().strip().replace("-", "_").replace(" ", "_")
    if clean not in VALID_BIOLOGICAL_SEGMENTS:
        return "CELLULAR"  # Safe default
    return clean


# ---------------------------------------------------------------------
# TOOL 1: TR-FRET ASSAY CALCULATOR (Sub-Cellular & Molecular)
# ---------------------------------------------------------------------
@mcp.tool()
def calculate_tr_fret_ratio(
    donor_signal_620nm: float,
    acceptor_signal_665nm: float,
    assay_type: str = "PROTAC_BRD4_CRBN",
    biological_segment: str = "SUB_CELLULAR"
) -> str:
    """
    TR-FRET Engine: Calculates 665nm/620nm emission ratios for target engagement assays
    including PROTAC (BRD4/CRBN, DDB1-CRBN&GSPT1), KRAS (WT/mutant G12C), and cAMP.

    Args:
        donor_signal_620nm: Raw fluorescence signal from donor europium/terbium at 620nm.
        acceptor_signal_665nm: Raw fluorescence signal from acceptor fluorophore at 665nm.
        assay_type: Target ('PROTAC_BRD4_CRBN', 'KRAS_G12C_cRAF', 'CAMP_DETECTION', 'TNF_TNFR').
        biological_segment: Biological tier ('SUB_CELLULAR', 'CELLULAR', 'TISSUE', 'ORGANISM').
    """
    if donor_signal_620nm <= 0:
        return json.dumps({"status": "ERROR", "message": "620nm donor signal must be greater than zero."})

    segment = validate_segment(biological_segment)
    htrf_ratio = (acceptor_signal_665nm / donor_signal_620nm) * 10000.0

    return json.dumps({
        "status": "SUCCESS",
        "biological_segment": segment,
        "assay_type": assay_type.upper(),
        "htrf_ratio": round(htrf_ratio, 2),
        "raw_665_620_ratio": round(acceptor_signal_665nm / donor_signal_620nm, 4),
        "binding_state": "Strong Interaction/Formation" if htrf_ratio > 5000 else "Weak/Inhibited"
    })


# ---------------------------------------------------------------------
# TOOL 2: UA-GLO FUNCTIONAL SCREENING ENGINE (Multi-Tier)
# ---------------------------------------------------------------------
@mcp.tool()
def analyze_uaglo_luminescence(
    sample_rlu: float,
    control_rlu: float,
    readout_type: str = "CELL_VIABILITY",
    biological_segment: str = "CELLULAR"
) -> str:
    """
    UA-Glo Engine: Processes luminescent signals (RLU) for Cell Viability (2D/3D), 
    Caspase 3/7 Apoptosis, Kinase activity, and Reporter Gene (NF-kB/Wnt) assays.

    Args:
        sample_rlu: Relative Light Units measured from the experimental sample well.
        control_rlu: Relative Light Units measured from the control/untreated well.
        readout_type: Type ('CELL_VIABILITY_3D', 'CASPASE_3_7', 'KINASE_ACTIVITY', 'REPORTER_GENE').
        biological_segment: Biological tier ('SUB_CELLULAR', 'CELLULAR', 'TISSUE', 'ORGANISM').
    """
    if control_rlu <= 0:
        return json.dumps({"status": "ERROR", "message": "Control RLU must be greater than zero."})

    segment = validate_segment(biological_segment)
    percentage_of_control = (sample_rlu / control_rlu) * 100.0
    fold_change = sample_rlu / control_rlu

    return json.dumps({
        "status": "SUCCESS",
        "biological_segment": segment,
        "readout_type": readout_type.upper(),
        "percentage_of_control": round(percentage_of_control, 2),
        "fold_change": round(fold_change, 2),
        "signal_response": "Induction/Activation" if fold_change > 1.0 else "Inhibition/Cytotoxicity"
    })


# ---------------------------------------------------------------------
# TOOL 3: ONE-STEP ELISA QUANTIFIER (Molecular & Tissue)
# ---------------------------------------------------------------------
@mcp.tool()
def quantify_onestep_elisa(
    sample_od450: float,
    blank_od450: float,
    slope: float = 1.25,
    intercept: float = 0.05,
    target_biomarker: str = "IL-6",
    biological_segment: str = "CELLULAR"
) -> str:
    """
    OneStep ELISA Engine: Calculates concentration for rapid 1-hour 96-well assays 
    including Cytokines (IL-2, IL-6, IFN-g), Immunoglobulins (IgG), and Hormones (TSH).

    Args:
        sample_od450: Optical density (OD450) measured for the sample.
        blank_od450: Background OD450 measured from blank wells.
        slope: Standard curve linear regression slope (m).
        intercept: Standard curve linear regression intercept (c).
        target_biomarker: Target molecule ('IL-2', 'IL-6', 'IFN-GAMMA', 'IGG', 'TSH').
        biological_segment: Biological tier ('SUB_CELLULAR', 'CELLULAR', 'TISSUE', 'ORGANISM').
    """
    segment = validate_segment(biological_segment)
    net_od = max(0.0, sample_od450 - blank_od450)
    calculated_concentration = (net_od - intercept) / slope if slope != 0 else 0.0
    calculated_concentration = max(0.0, calculated_concentration)

    return json.dumps({
        "status": "SUCCESS",
        "biological_segment": segment,
        "target_biomarker": target_biomarker.upper(),
        "net_od450": round(net_od, 4),
        "estimated_concentration_pg_ml": round(calculated_concentration, 2)
    })


# ---------------------------------------------------------------------
# TOOL 4: HICA HIGH-SENSITIVITY FLUORESCENCE ENGINE (Sub-Cellular & Cellular)
# ---------------------------------------------------------------------
@mcp.tool()
def analyze_hica_fluorescence(
    relative_fluorescence_units: float,
    baseline_rfu: float,
    target_protein: str = "IL-2R",
    biological_segment: str = "SUB_CELLULAR"
) -> str:
    """
    HICA Engine: High-sensitivity fluorescence analysis for ultra-low abundance 
    cytokine and receptor proteins (IL-2R, IL-8, IL-12p70).

    Args:
        relative_fluorescence_units: Measured RFU from the assay reader.
        baseline_rfu: Baseline/blank RFU value.
        target_protein: Target protein ('IL-2R', 'IL-8', 'IL-12P70').
        biological_segment: Biological tier ('SUB_CELLULAR', 'CELLULAR', 'TISSUE', 'ORGANISM').
    """
    segment = validate_segment(biological_segment)
    net_rfu = max(0.0, relative_fluorescence_units - baseline_rfu)
    signal_to_noise = relative_fluorescence_units / baseline_rfu if baseline_rfu > 0 else 0.0

    return json.dumps({
        "status": "SUCCESS",
        "biological_segment": segment,
        "target_protein": target_protein.upper(),
        "net_rfu": round(net_rfu, 2),
        "signal_to_noise_ratio": round(signal_to_noise, 2),
        "detection_quality": "High Significance" if signal_to_noise >= 3.0 else "Low Signal/Background Noise"
    })


# ---------------------------------------------------------------------
# TOOL 5: TISSUE & ORGANOID PENETRATION MODEL (Tissue Tier)
# ---------------------------------------------------------------------
@mcp.tool()
def calculate_tissue_organoid_penetration(
    organoid_diameter_um: float,
    surface_fluorescence_rfu: float,
    core_fluorescence_rfu: float,
    diffusion_coefficient: float = 2.5e-7
) -> str:
    """
    Tissue & Organoid Engine: Evaluates drug molecule penetration depth, 
    barrier permeability, and core viability in 3D spheroid/organoid tissue models.

    Args:
        organoid_diameter_um: Diameter of 3D spheroid/tissue slice in micrometers.
        surface_fluorescence_rfu: Fluorescence intensity at tissue boundary.
        core_fluorescence_rfu: Fluorescence intensity at central core.
        diffusion_coefficient: Diffusion coefficient of candidate molecule in cm2/s.
    """
    if surface_fluorescence_rfu <= 0 or organoid_diameter_um <= 0:
        return json.dumps({"status": "ERROR", "message": "Surface RFU and diameter must be positive numbers."})

    penetration_ratio = core_fluorescence_rfu / surface_fluorescence_rfu
    radius_um = organoid_diameter_um / 2.0
    effective_depth_um = radius_um * penetration_ratio

    return json.dumps({
        "status": "SUCCESS",
        "biological_segment": "TISSUE",
        "organoid_diameter_um": organoid_diameter_um,
        "core_to_surface_ratio": round(penetration_ratio, 4),
        "effective_penetration_depth_um": round(effective_depth_um, 2),
        "tissue_barrier_status": "Complete Penetration" if penetration_ratio >= 0.7 else "Partial/Boundary Penetration"
    })


# ---------------------------------------------------------------------
# TOOL 6: ORGANISM IN VIVO PHARMACOKINETICS MODEL (Organism Tier)
# ---------------------------------------------------------------------
@mcp.tool()
def calculate_organism_in_vivo_pharmacokinetics(
    dose_mg_kg: float,
    body_weight_kg: float,
    clearance_rate_l_hr: float,
    volume_distribution_l: float,
    time_post_dose_hr: float = 2.0
) -> str:
    """
    Organism Engine: Computes in vivo animal dosing, C_max, Area Under Curve (AUC), 
    and plasma concentration decay across whole-organism model systems.

    Args:
        dose_mg_kg: Administered dose in mg per kg of body weight.
        body_weight_kg: Total subject body weight in kilograms.
        clearance_rate_l_hr: Systemic clearance rate in L/hr.
        volume_distribution_l: Apparent volume of distribution in Liters.
        time_post_dose_hr: Hours elapsed after administration.
    """
    if body_weight_kg <= 0 or volume_distribution_l <= 0 or clearance_rate_l_hr <= 0:
        return json.dumps({"status": "ERROR", "message": "Body weight, volume, and clearance must be positive."})

    total_dose_mg = dose_mg_kg * body_weight_kg
    c_max_mg_l = total_dose_mg / volume_distribution_l
    elimination_k = clearance_rate_l_hr / volume_distribution_l
    half_life_hr = 0.693 / elimination_k if elimination_k > 0 else 0.0

    # One-compartment open IV bolus decay model: C(t) = C_max * e^(-k*t)
    concentration_at_t = c_max_mg_l * math.exp(-1.0 * elimination_k * time_post_dose_hr)
    auc_mg_hr_l = total_dose_mg / clearance_rate_l_hr

    return json.dumps({
        "status": "SUCCESS",
        "biological_segment": "ORGANISM",
        "total_administered_dose_mg": round(total_dose_mg, 2),
        "c_max_mg_l": round(c_max_mg_l, 2),
        "elimination_half_life_hr": round(half_life_hr, 2),
        "plasma_concentration_at_target_time_mg_l": round(concentration_at_t, 2),
        "auc_mg_hr_l": round(auc_mg_hr_l, 2)
    })


# ---------------------------------------------------------------------
# TOOL 7: AUTOMATED PLATE LAYOUT GENERATOR
# ---------------------------------------------------------------------
@mcp.tool()
def generate_plate_layout(
    format_wells: int = 96,
    num_standards: int = 8,
    num_controls: int = 4,
    target_segment: str = "CELLULAR"
) -> str:
    """
    Plate Generator: Generates 96-well or 384-well microplate mappings with 
    designated locations for standards, controls, and segment-tagged samples.

    Args:
        format_wells: Total wells in the plate (96 or 384).
        num_standards: Number of standard curve wells.
        num_controls: Number of control wells (positive/negative/blanks).
        target_segment: Biological segment ('SUB_CELLULAR', 'CELLULAR', 'TISSUE', 'ORGANISM').
    """
    segment = validate_segment(target_segment)
    total_wells = format_wells if format_wells in [96, 384] else 96
    rows = 8 if total_wells == 96 else 16

    wells_map = {}
    current_well_index = 0

    # Assign Standards (Col 1)
    for i in range(min(num_standards, rows)):
        well_name = f"{chr(65+i)}1"
        wells_map[well_name] = f"Standard_{i+1}_[{segment}]"
        current_well_index += 1

    # Assign Controls (Col 2)
    for i in range(min(num_controls, rows)):
        well_name = f"{chr(65+i)}2"
        wells_map[well_name] = f"Control_{i+1}_[{segment}]"
        current_well_index += 1

    sample_count = total_wells - len(wells_map)

    return json.dumps({
        "status": "LAYOUT_GENERATED",
        "biological_segment": segment,
        "plate_format": f"{total_wells}-well",
        "standards_count": len([k for k, v in wells_map.items() if "Standard" in v]),
        "controls_count": len([k for k, v in wells_map.items() if "Control" in v]),
        "available_sample_wells": sample_count,
        "sample_layout_preview": wells_map
    })


# ---------------------------------------------------------------------
# TOOL 8: ASSAY KIT SPECIFICATIONS QUERY
# ---------------------------------------------------------------------
@mcp.tool()
def get_assay_kit_specifications(kit_category: str) -> str:
    """
    Provides reaction volume, incubation times, and kit sizing specifications 
    for TR-FRET, UA-Glo, OneStep ELISA, and HICA assay kits across biological tiers.

    Args:
        kit_category: Kit type ('TR-FRET', 'UA-GLO', 'ONESTEP_ELISA', 'HICA').
    """
    category = kit_category.upper().strip()

    specs = {
        "TR-FRET": {
            "supported_segments": ["SUB_CELLULAR", "CELLULAR"],
            "targets": "PROTAC (BRD4/CRBN, DDB1-CRBN&GSPT1), KRAS (WT/G12C), cAMP",
            "available_sizes": "500T, 10000T",
            "readout": "TR-FRET Emission Ratio (665nm / 620nm)",
            "incubation_time": "1 to 4 hours"
        },
        "UA-GLO": {
            "supported_segments": ["CELLULAR", "TISSUE"],
            "targets": "Cell Viability (2D/3D), Caspase 3/7, Kinase, Reporter Genes (NF-kB, Wnt)",
            "available_sizes": "100T, 1000T",
            "readout": "Luminescence (RLU)",
            "incubation_time": "10 to 30 minutes"
        },
        "ONESTEP_ELISA": {
            "supported_segments": ["CELLULAR", "TISSUE", "ORGANISM"],
            "targets": "Cytokines (IL-2, IL-6, IFN-g), Immunoglobulins (IgG), TSH",
            "available_sizes": "1x96T, 10x96T",
            "readout": "Absorbance (OD 450nm)",
            "incubation_time": "1 hour (Single-wash protocol)"
        },
        "HICA": {
            "supported_segments": ["SUB_CELLULAR", "CELLULAR", "TISSUE"],
            "targets": "Low-abundance proteins (IL-2R, IL-8, IL-12p70)",
            "available_sizes": "1x96T, 5x96T",
            "readout": "Fluorescence (RFU)",
            "incubation_time": "2 hours"
        }
    }

    selected = specs.get(category, {"error": "Invalid kit category. Use TR-FRET, UA-GLO, ONESTEP_ELISA, or HICA."})
    return json.dumps(selected)


if __name__ == "__main__":
    import time
    time.sleep(0.5)
    mcp.run(transport='stdio')