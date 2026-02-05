#!/usr/bin/env python3
"""
Generate 1000 synthetic healthcare claims as a denormalized CSV.
Uses only stdlib: csv, random, datetime.
"""
import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

# Set seed for reproducibility
random.seed(42)

# Define data distributions
PROVIDERS = [
    "Dr. Smith", "Dr. Patel", "Dr. Johnson", "Dr. Williams", "Dr. Brown",
    "Dr. Garcia", "Dr. Miller", "Dr. Davis", "Dr. Rodriguez", "Dr. Martinez",
    "Dr. Wilson", "Dr. Anderson", "Dr. Taylor", "Dr. Thomas", "Dr. Jackson",
    "Dr. White", "Dr. Harris", "Dr. Martin", "Dr. Thompson", "Dr. Lee",
    "Dr. Nguyen", "Dr. Kumar"
]

SPECIALTIES = [
    "Family Medicine", "Internal Medicine", "Orthopedics", "Cardiology",
    "Psychiatry", "Radiology", "Emergency Medicine", "Dermatology",
    "OB/GYN", "Neurology"
]

REGIONS = ["Upstate", "Midlands", "Lowcountry", "Pee Dee"]

PLAN_TYPES = ["PPO", "HMO", "HDHP"]

DIAGNOSES = [
    ("J06.9", "Acute upper respiratory infection"),
    ("M54.5", "Low back pain"),
    ("I10", "Essential hypertension"),
    ("F41.1", "Generalized anxiety disorder"),
    ("E11.9", "Type 2 diabetes mellitus"),
    ("Z00.00", "General adult medical exam"),
    ("S82.001A", "Fracture of patella"),
    ("K21.0", "GERD"),
    ("J45.909", "Asthma, unspecified"),
    ("N39.0", "Urinary tract infection"),
    ("M79.3", "Panniculitis"),
    ("G43.909", "Migraine, unspecified"),
    ("E78.5", "Hyperlipidemia"),
    ("R10.9", "Abdominal pain"),
    ("L70.0", "Acne vulgaris"),
    ("J02.9", "Acute pharyngitis"),
    ("M25.511", "Pain in right shoulder"),
    ("R51.9", "Headache"),
    ("Z23", "Immunization encounter"),
    ("K58.9", "Irritable bowel syndrome"),
    ("F32.9", "Major depressive disorder"),
    ("R05.9", "Cough"),
    ("E03.9", "Hypothyroidism"),
]

PROCEDURES = [
    ("99213", "Office visit - established, level 3"),
    ("99214", "Office visit - established, level 4"),
    ("99215", "Office visit - established, level 5"),
    ("99203", "Office visit - new, level 3"),
    ("71046", "Chest X-ray, 2 views"),
    ("80053", "Comprehensive metabolic panel"),
    ("90837", "Psychotherapy, 60 min"),
    ("99386", "Preventive visit, 40-64"),
    ("36415", "Venipuncture"),
    ("81001", "Urinalysis"),
    ("99283", "ER visit, moderate"),
    ("99284", "ER visit, high"),
    ("90834", "Psychotherapy, 45 min"),
    ("99441", "Telehealth E/M"),
    ("73721", "MRI lower extremity"),
    ("29881", "Knee arthroscopy"),
]

STATUSES = ["PAID", "DENIED", "PENDING"]

DENIAL_REASONS = [
    "Not medically necessary",
    "Out of network",
    "Prior authorization required",
    "Duplicate claim",
    "Non-covered service",
    "Timely filing exceeded",
]

PLACE_OF_SERVICE = ["Office", "Hospital Outpatient", "Emergency Room", "Telehealth", "Lab"]

# Billed amount ranges by procedure code
PROCEDURE_AMOUNTS = {
    "99213": (150, 250),
    "99214": (200, 350),
    "99215": (250, 400),
    "99203": (200, 350),
    "71046": (150, 300),
    "80053": (100, 250),
    "90837": (200, 400),
    "99386": (200, 350),
    "36415": (10, 50),
    "81001": (25, 75),
    "99283": (500, 1200),
    "99284": (800, 1500),
    "90834": (150, 300),
    "99441": (100, 200),
    "73721": (2000, 4000),
    "29881": (3000, 5000),
}

def generate_member_age():
    """Generate age with roughly normal distribution (18-85)."""
    age = int(random.gauss(50, 15))
    return max(18, min(85, age))

def generate_billed_amount(procedure_code):
    """Generate billed amount based on procedure code."""
    if procedure_code in PROCEDURE_AMOUNTS:
        min_amt, max_amt = PROCEDURE_AMOUNTS[procedure_code]
        return round(random.uniform(min_amt, max_amt), 2)
    return round(random.uniform(100, 2000), 2)

def generate_claims(num_claims=1000):
    """Generate synthetic claims."""
    claims = []
    member_ids = [f"MBR{i}" for i in range(100, 301)]

    for claim_num in range(1, num_claims + 1):
        claim_id = f"CLM{claim_num:04d}"
        member_id = random.choice(member_ids)
        member_age = generate_member_age()

        # Get plan type weighted by distribution
        plan_rand = random.random()
        if plan_rand < 0.40:
            member_plan_type = "PPO"
        elif plan_rand < 0.75:
            member_plan_type = "HMO"
        else:
            member_plan_type = "HDHP"

        member_region = random.choice(REGIONS)
        provider_name = random.choice(PROVIDERS)
        provider_specialty = random.choice(SPECIALTIES)

        # Network status: 80% in-network, 20% out-of-network
        network_status = "IN_NETWORK" if random.random() < 0.80 else "OUT_OF_NETWORK"

        # Service date: Jan 2025 - Dec 2025
        start_date = datetime(2025, 1, 1)
        end_date = datetime(2025, 12, 31)
        service_date = start_date + timedelta(days=random.randint(0, (end_date - start_date).days))
        service_date_str = service_date.strftime("%Y-%m-%d")

        # Diagnosis
        diagnosis_code, diagnosis_desc = random.choice(DIAGNOSES)

        # Procedure
        procedure_code, procedure_desc = random.choice(PROCEDURES)

        # Billed amount
        billed_amount = generate_billed_amount(procedure_code)

        # Allowed amount: 60-85% of billed
        allowed_amount = round(billed_amount * random.uniform(0.60, 0.85), 2)

        # Status
        status_rand = random.random()
        if status_rand < 0.70:
            status = "PAID"
        elif status_rand < 0.90:
            status = "DENIED"
        else:
            status = "PENDING"

        # Calculate paid and member responsibility
        if status == "PAID":
            paid_amount = round(allowed_amount * 0.80, 2)
            member_responsibility = round(allowed_amount * 0.20, 2)
            denial_reason = ""
        elif status == "DENIED":
            paid_amount = 0.0
            member_responsibility = billed_amount
            denial_reason = random.choice(DENIAL_REASONS)
        else:  # PENDING
            paid_amount = 0.0
            member_responsibility = 0.0
            denial_reason = ""

        # Place of service
        place_rand = random.random()
        if place_rand < 0.50:
            place_of_service = "Office"
        elif place_rand < 0.65:
            place_of_service = "Hospital Outpatient"
        elif place_rand < 0.75:
            place_of_service = "Emergency Room"
        elif place_rand < 0.90:
            place_of_service = "Telehealth"
        else:
            place_of_service = "Lab"

        claims.append({
            "claim_id": claim_id,
            "member_id": member_id,
            "member_age": member_age,
            "member_plan_type": member_plan_type,
            "member_region": member_region,
            "provider_name": provider_name,
            "provider_specialty": provider_specialty,
            "network_status": network_status,
            "service_date": service_date_str,
            "diagnosis_code": diagnosis_code,
            "diagnosis_desc": diagnosis_desc,
            "procedure_code": procedure_code,
            "procedure_desc": procedure_desc,
            "billed_amount": billed_amount,
            "allowed_amount": allowed_amount,
            "paid_amount": paid_amount,
            "member_responsibility": member_responsibility,
            "status": status,
            "denial_reason": denial_reason,
            "place_of_service": place_of_service,
        })

    return claims

def main():
    """Generate and write claims to CSV."""
    output_path = Path(__file__).parent / "sample_claims.csv"

    # Generate claims
    claims = generate_claims(1000)

    # Write to CSV
    fieldnames = [
        "claim_id", "member_id", "member_age", "member_plan_type", "member_region",
        "provider_name", "provider_specialty", "network_status", "service_date",
        "diagnosis_code", "diagnosis_desc", "procedure_code", "procedure_desc",
        "billed_amount", "allowed_amount", "paid_amount", "member_responsibility",
        "status", "denial_reason", "place_of_service"
    ]

    with open(output_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(claims)

    print(f"Generated {len(claims)} claims to {output_path}")
    return 0

if __name__ == "__main__":
    exit(main())
