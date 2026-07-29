# tests/test_bioassay.py
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.main_server import (
    calculate_tr_fret_ratio,
    analyze_uaglo_luminescence,
    quantify_onestep_elisa,
    analyze_hica_fluorescence,
    calculate_tissue_organoid_penetration,
    calculate_organism_in_vivo_pharmacokinetics,
    generate_plate_layout,
    get_assay_kit_specifications
)

def test_1_tr_fret_ratio_subcellular():
    res = json.loads(calculate_tr_fret_ratio(1000.0, 500.0, "PROTAC_BRD4_CRBN", "SUB_CELLULAR"))
    assert res["status"] == "SUCCESS"
    assert res["biological_segment"] == "SUB_CELLULAR"
    assert res["htrf_ratio"] == 5000.0

def test_2_uaglo_luminescence_cellular():
    res = json.loads(analyze_uaglo_luminescence(15000.0, 10000.0, "CELL_VIABILITY_3D", "CELLULAR"))
    assert res["status"] == "SUCCESS"
    assert res["biological_segment"] == "CELLULAR"
    assert res["percentage_of_control"] == 150.0

def test_3_onestep_elisa_tissue():
    res = json.loads(quantify_onestep_elisa(1.05, 0.05, 1.0, 0.0, "IL-6", "TISSUE"))
    assert res["status"] == "SUCCESS"
    assert res["biological_segment"] == "TISSUE"
    assert res["estimated_concentration_pg_ml"] == 1.0

def test_4_hica_fluorescence():
    res = json.loads(analyze_hica_fluorescence(3000.0, 1000.0, "IL-2R", "SUB_CELLULAR"))
    assert res["status"] == "SUCCESS"
    assert res["signal_to_noise_ratio"] == 3.0

def test_5_tissue_organoid_penetration():
    res = json.loads(calculate_tissue_organoid_penetration(500.0, 1000.0, 500.0))
    assert res["status"] == "SUCCESS"
    assert res["biological_segment"] == "TISSUE"
    assert res["core_to_surface_ratio"] == 0.5

def test_6_organism_in_vivo_pk():
    res = json.loads(calculate_organism_in_vivo_pharmacokinetics(10.0, 0.025, 0.05, 0.015, 2.0))
    assert res["status"] == "SUCCESS"
    assert res["biological_segment"] == "ORGANISM"
    assert res["total_administered_dose_mg"] == 0.25

def test_7_plate_layout_with_segment():
    res = json.loads(generate_plate_layout(96, 8, 4, "TISSUE"))
    assert res["status"] == "LAYOUT_GENERATED"
    assert res["biological_segment"] == "TISSUE"

def test_8_assay_specs():
    res = json.loads(get_assay_kit_specifications("TR-FRET"))
    assert "supported_segments" in res
    assert "SUB_CELLULAR" in res["supported_segments"]