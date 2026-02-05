#!/usr/bin/env python3
"""
Generate BCBS Benefits Summary PDF using fpdf2.
Creates a professional 10-page benefits document for BlueCross BlueShield of South Carolina.
"""

# /// script
# requires-python = ">=3.11"
# dependencies = ["fpdf2"]
# ///

from fpdf import FPDF
from pathlib import Path

class BCSBBenefitsPDF(FPDF):
    """Custom PDF class for BCBS benefits document with headers and footers."""

    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.page_num = 0
        self.bcbs_blue = (0, 87, 184)  # #0057B8
        self.dark_gray = (80, 80, 80)
        self.light_gray = (240, 240, 240)

    def header(self):
        """Add header with BCBS branding to each page."""
        if self.page_num == 1:
            # Title page - special header
            self.set_font("Helvetica", "B", 24)
            self.set_text_color(*self.bcbs_blue)
            self.cell(0, 20, "BCBS Benefits Summary", ln=True, align="C")
            self.set_font("Helvetica", "", 12)
            self.set_text_color(80, 80, 80)
            self.cell(0, 10, "BlueCross BlueShield of South Carolina", ln=True, align="C")
            self.cell(0, 10, "Effective January 1, 2025", ln=True, align="C")
            self.ln(5)
        else:
            # Regular pages - simple header
            self.set_font("Helvetica", "B", 10)
            self.set_text_color(*self.bcbs_blue)
            self.cell(0, 8, "BlueCross BlueShield of South Carolina - Benefits Summary", ln=True)
            self.set_draw_color(0, 87, 184)
            self.line(10, self.get_y(), 200, self.get_y())
            self.ln(2)

    def footer(self):
        """Add footer with page number to each page."""
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_num}", align="C")
        self.cell(0, 10, "Effective January 1, 2025", align="R")

    def section_header(self, title):
        """Add a section header with blue background."""
        self.set_font("Helvetica", "B", 14)
        self.set_fill_color(*self.bcbs_blue)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, title, ln=True, fill=True)
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def subsection_header(self, title):
        """Add a subsection header."""
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*self.bcbs_blue)
        self.cell(0, 8, title, ln=True)
        self.set_text_color(0, 0, 0)
        self.ln(1)

    def body_text(self, text, size=10):
        """Add body text."""
        self.set_font("Helvetica", "", size)
        self.multi_cell(0, 5, text)
        self.ln(2)

    def add_plan_comparison_table(self, title, headers, data):
        """Add a plan comparison table with PPO, HMO, HDHP columns."""
        self.subsection_header(title)

        # Table header
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(*self.bcbs_blue)
        self.set_text_color(255, 255, 255)

        col_widths = [70, 40, 40, 40]
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 8, header, border=1, align="C", fill=True)
        self.ln()

        # Table data
        self.set_font("Helvetica", "", 9)
        self.set_text_color(0, 0, 0)
        alt_fill = True

        for row in data:
            if alt_fill:
                self.set_fill_color(*self.light_gray)
            else:
                self.set_fill_color(255, 255, 255)

            # First column (left-aligned), others center-aligned
            self.cell(col_widths[0], 8, row[0], border=1, fill=alt_fill)
            for i, cell in enumerate(row[1:], 1):
                self.cell(col_widths[i], 8, cell, border=1, align="C", fill=alt_fill)
            self.ln()

            alt_fill = not alt_fill

        self.ln(2)

def generate_pdf():
    """Generate the complete BCBS benefits PDF."""
    pdf = BCSBBenefitsPDF()
    pdf.add_page()
    pdf.page_num = 1

    # PAGE 1: Cover Page with Table of Contents
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 11)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(0, 6,
        "This comprehensive benefits guide provides detailed information about your health "
        "plan options, coverage details, and important benefits information. Please review "
        "this guide carefully and contact your benefits administrator with any questions.")

    pdf.ln(5)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(*pdf.bcbs_blue)
    pdf.cell(0, 10, "Table of Contents", ln=True)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(0, 0, 0)
    toc_items = [
        "Plan Overview",
        "Deductibles and Out-of-Pocket Maximums",
        "Copays and Coinsurance",
        "Covered Services",
        "Telehealth Coverage",
        "Prescription Drug Coverage",
        "Prior Authorization Requirements",
        "Mental Health and Substance Abuse",
        "Emergency and Urgent Care",
        "Exclusions and Limitations"
    ]

    for i, item in enumerate(toc_items, 1):
        pdf.cell(0, 7, f"{i}. {item}", ln=True)

    # PAGE 2: Plan Overview
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Plan Overview")

    pdf.body_text(
        "BlueCross BlueShield of South Carolina offers three comprehensive health plan options "
        "to meet the diverse healthcare needs of our members. Each plan is designed to provide "
        "excellent coverage with varying levels of cost-sharing and out-of-pocket expenses. "
        "All plans are effective January 1, 2025, and provide access to our extensive network "
        "of healthcare providers throughout South Carolina and nationally."
    )

    # Plan descriptions
    pdf.subsection_header("Preferred Provider Organization (PPO)")
    pdf.body_text(
        "The PPO plan offers the greatest flexibility in choosing healthcare providers. "
        "Members can visit any licensed physician or hospital without requiring a referral. "
        "Coverage is highest when using in-network providers, but out-of-network care is also "
        "covered at a higher cost. The PPO plan is ideal for members who want maximum choice "
        "and flexibility in their healthcare decisions. This plan includes a moderate deductible "
        "and reasonable out-of-pocket maximums, making it a popular choice for those who prefer "
        "unrestricted access to specialists and hospitals."
    )

    pdf.subsection_header("Health Maintenance Organization (HMO)")
    pdf.body_text(
        "The HMO plan emphasizes preventive care and comprehensive coverage through a network "
        "of primary care physicians and specialists. Members select a primary care physician who "
        "coordinates all care and provides necessary referrals to specialists. The HMO plan "
        "features the lowest copays and out-of-pocket maximums, making it the most cost-effective "
        "option for members who are willing to coordinate care through their primary physician. "
        "Members must receive care from in-network providers, except in emergency situations."
    )

    pdf.subsection_header("High Deductible Health Plan (HDHP)")
    pdf.body_text(
        "The HDHP plan is designed for members who are comfortable with higher deductibles in "
        "exchange for lower monthly premiums. This plan is HSA-eligible, allowing members to "
        "establish a Health Savings Account for tax-advantaged savings on medical expenses. "
        "The HDHP plan works best for members who are generally healthy and want to control their "
        "healthcare costs through preventive care and wellness initiatives. Members have maximum "
        "flexibility in choosing providers, similar to the PPO plan, with the same level of "
        "out-of-network coverage."
    )

    # PAGE 3: Deductibles and Out-of-Pocket Maximums
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Deductibles and Out-of-Pocket Maximums")

    pdf.body_text(
        "The deductible is the amount you must pay out of your own pocket for covered healthcare "
        "services before your health plan begins to share the cost of care. The out-of-pocket maximum "
        "is the total amount you will pay for covered services in a calendar year. Once you reach your "
        "out-of-pocket maximum, your health plan covers 100% of additional covered services for the "
        "remainder of the year. Preventive care services do not count toward your deductible or "
        "out-of-pocket maximum."
    )

    pdf.add_plan_comparison_table(
        "Individual Deductibles",
        ["Service Type", "PPO", "HMO", "HDHP"],
        [
            ["In-Network Individual", "$500", "$250", "$1,500"],
            ["Out-of-Network Individual", "$1,500", "N/A*", "$2,500"],
            ["Separate Deductible (Yes/No)", "No", "No", "No"],
        ]
    )

    pdf.add_plan_comparison_table(
        "Family Deductibles",
        ["Service Type", "PPO", "HMO", "HDHP"],
        [
            ["In-Network Family", "$1,000", "$500", "$3,000"],
            ["Out-of-Network Family", "$3,000", "N/A*", "$5,000"],
        ]
    )

    pdf.add_plan_comparison_table(
        "Out-of-Pocket Maximums (Annual)",
        ["Service Type", "PPO", "HMO", "HDHP"],
        [
            ["Individual", "$3,000", "$2,500", "$5,000"],
            ["Family", "$6,000", "$5,000", "$10,000"],
        ]
    )

    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, "*HMO out-of-network coverage only applies to emergencies", ln=True)

    pdf.set_text_color(0, 0, 0)
    pdf.ln(2)
    pdf.body_text(
        "In-Network: Using providers that have contracted with BlueCross BlueShield to provide "
        "services at negotiated rates. In-network care always has lower out-of-pocket costs and "
        "higher coverage percentages. Out-of-Network: Using providers that do not have a contract "
        "with BlueCross BlueShield. Out-of-network care generally costs more and is subject to "
        "higher deductibles and coinsurance percentages. Emergency services are covered at the "
        "in-network rate regardless of whether the provider is in-network."
    )

    # PAGE 4: Copays and Coinsurance
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Copays and Coinsurance")

    pdf.body_text(
        "A copay is a fixed amount you pay at the time you receive a covered healthcare service. "
        "Coinsurance is your share of the cost of a covered healthcare service, expressed as a "
        "percentage. For example, if you have 20% coinsurance, you pay 20% of the provider's "
        "allowed amount and your health plan pays 80%. The amounts shown below apply after you "
        "have met your deductible, except for preventive care and copay services."
    )

    pdf.add_plan_comparison_table(
        "Office Visits and Specialist Copays",
        ["Service", "PPO", "HMO", "HDHP"],
        [
            ["Primary Care Office Visit", "$30", "$20", "20% after ded."],
            ["Specialist Office Visit", "$50", "$40", "20% after ded."],
            ["Behavioral Health Visit", "$50", "$40", "20% after ded."],
            ["Virtual Care Visit", "$15", "$10", "20% after ded."],
        ]
    )

    pdf.add_plan_comparison_table(
        "Urgent and Emergency Care Copays",
        ["Service", "PPO", "HMO", "HDHP"],
        [
            ["Urgent Care Center", "$75", "$50", "20% after ded."],
            ["Emergency Room", "$250*", "$200*", "20% after ded."],
            ["Ambulance Services", "20% coin.", "20% coin.", "20% coin."],
        ]
    )

    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 5, "*Copay waived if admitted as inpatient", ln=True)

    pdf.set_text_color(0, 0, 0)
    pdf.ln(2)

    pdf.subsection_header("Coinsurance Details")
    pdf.body_text(
        "After you have met your deductible, coinsurance applies to most services not covered "
        "by a copay. PPO plans typically cover 80% of in-network services (you pay 20%) and 60% "
        "of out-of-network services (you pay 40%) after deductible. HMO plans cover 80% of "
        "in-network services after deductible. HDHP plans cover 80% of in-network and out-of-network "
        "services after deductible, with the same 20% coinsurance rate for all providers."
    )

    pdf.subsection_header("Deductible Application")
    pdf.body_text(
        "The deductible applies to all covered services except preventive care and certain copay "
        "services (office visits, urgent care, emergency care). For HDHP plans, preventive care, "
        "virtual visits, and generic prescriptions are covered at 100% before the deductible is met. "
        "Family deductibles apply on a per-person basis for PPO and HMO plans, while HDHP plans "
        "use an aggregate family deductible approach."
    )

    # PAGE 5: Covered Services
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Covered Services")

    pdf.body_text(
        "BlueCross BlueShield covers a comprehensive range of healthcare services. This section "
        "outlines the major categories of covered services under all three plan options. Unless "
        "otherwise noted, services are covered at the percentages and with the copays described "
        "in the previous section. All covered services must be provided by a licensed healthcare "
        "provider within the scope of their license."
    )

    pdf.subsection_header("Preventive Care (100% Covered)")
    pdf.body_text(
        "All preventive care services are covered at no cost to you when provided by in-network "
        "providers. Covered preventive services include: Annual preventive care exams and screenings, "
        "Immunizations and vaccinations (including COVID-19, influenza, pneumonia, tetanus), "
        "Cancer screenings (mammography, colonoscopy, cervical cancer screening), Cardiovascular "
        "screenings (blood pressure, cholesterol, EKG), Diabetes and obesity screenings, Mental "
        "health and substance abuse screenings, Family planning and contraceptive services, "
        "Behavioral counseling and health education programs, and Pre- and post-natal care."
    )

    pdf.subsection_header("Diagnostic Services")
    pdf.body_text(
        "Diagnostic imaging including X-rays, ultrasounds, computed tomography (CT) scans, and "
        "magnetic resonance imaging (MRI) scans are covered when medically necessary and ordered "
        "by your healthcare provider. Advanced imaging such as MRI and CT scans require prior "
        "authorization. Covered at 80% after deductible (PPO in-network). PET scans and other "
        "advanced diagnostic procedures require prior authorization and may be subject to "
        "experimental treatment exclusions."
    )

    pdf.subsection_header("Laboratory and Pathology Services")
    pdf.body_text(
        "All routine laboratory tests, blood work, and pathology services ordered by your healthcare "
        "provider are covered. Preventive laboratory tests recommended by health guidelines are covered "
        "at 100%. Routine laboratory work for diagnosis and treatment of illness is covered after "
        "deductible at the applicable coinsurance rate. Specialized laboratory testing may require "
        "prior authorization if determined to be experimental or non-standard."
    )

    pdf.subsection_header("Physical and Occupational Therapy")
    pdf.body_text(
        "Physical therapy and occupational therapy services are covered up to 30 visits per calendar "
        "year when ordered by your healthcare provider. Services must be medically necessary for the "
        "treatment of injury or illness. Coverage includes: Rehabilitation therapy following surgery "
        "or injury, Therapy for chronic conditions such as arthritis or back pain, Treatment of sports "
        "injuries, and Occupational therapy for functional limitations. Therapy services are covered "
        "at 80% after deductible. Prior authorization is required for therapy exceeding 15 visits."
    )

    pdf.subsection_header("Durable Medical Equipment")
    pdf.body_text(
        "Durable medical equipment (DME) such as wheelchairs, walkers, hospital beds, oxygen equipment, "
        "and insulin pumps are covered when prescribed by your healthcare provider. Equipment must be "
        "prescribed as medically necessary for your condition. Coverage includes both purchase and rental "
        "options at the most cost-effective rate. DME is covered at 80% after deductible (PPO in-network). "
        "Equipment over $500 requires prior authorization. Repairs and replacements are covered separately "
        "from the initial equipment purchase."
    )

    pdf.subsection_header("Ambulance Services")
    pdf.body_text(
        "Ground ambulance services for emergency transport to a hospital are covered at 80% after "
        "deductible. Air ambulance services are covered at 80% after deductible when medically necessary. "
        "Non-emergency ambulance transportation is covered only when other means of transportation are "
        "medically contraindicated. Ambulance services must be provided by a licensed ambulance provider."
    )

    # PAGE 6: Telehealth and Prescription Drug Coverage
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Telehealth Coverage")

    pdf.body_text(
        "Telehealth services allow you to receive healthcare from the convenience of your home or office "
        "through virtual consultations with healthcare providers. All three plan options cover telehealth "
        "services for a wide range of health concerns. Telehealth visits are an effective way to access "
        "medical care, especially for non-emergency conditions, behavioral health, and follow-up appointments."
    )

    pdf.add_plan_comparison_table(
        "Virtual Care Copays and Coinsurance",
        ["Service", "PPO", "HMO", "HDHP"],
        [
            ["Primary Care Virtual Visit", "$15", "$10", "20% after ded."],
            ["Specialist Virtual Visit", "$30", "$20", "20% after ded."],
            ["Behavioral Health Virtual", "$30", "$20", "20% after ded."],
            ["Urgent Care Virtual", "$30", "$20", "20% after ded."],
        ]
    )

    pdf.body_text(
        "Virtual care is available through the BCBS Virtual Care app and approved providers. Services "
        "covered via telehealth include: Primary care and general medical consultations, Specialist "
        "consultations for ongoing conditions, Prescription refills and medication adjustments, "
        "Behavioral health and mental health counseling, Substance abuse treatment consultations, "
        "Follow-up appointments after hospitalization, and Chronic disease management visits. Telehealth "
        "visits can be scheduled for your convenience, often with same-day availability, and are covered "
        "at the same copay or coinsurance rates as in-person visits."
    )

    # Prescription Drug Coverage
    pdf.section_header("Prescription Drug Coverage")

    pdf.body_text(
        "BlueCross BlueShield maintains a comprehensive formulary of covered medications organized by tier. "
        "All medications are covered when prescribed by an in-network provider and filled at an in-network "
        "pharmacy. The copay or coinsurance amount depends on the medication tier and your plan type. "
        "Prior authorization may be required for certain medications as noted below."
    )

    pdf.add_plan_comparison_table(
        "Prescription Medication Tiers (Retail)",
        ["Medication Tier", "PPO/HMO", "HDHP", "Description"],
        [
            ["Tier 1 (Generic)", "$10", "After ded.", "Most affordable generic drugs"],
            ["Tier 2 (Preferred)", "$30", "After ded.", "Brand-name preferred drugs"],
            ["Tier 3 (Non-Preferred)", "$60", "After ded.", "Other brand-name drugs"],
            ["Tier 4 (Specialty)", "20% coin.", "20% coin.", "High-cost specialty drugs"],
        ]
    )

    pdf.subsection_header("Mail Order and 90-Day Supply")
    pdf.body_text(
        "For chronic medications, mail order prescriptions are available at a discounted rate. "
        "A 90-day supply through mail order costs 2.5 times the retail copay or coinsurance. "
        "For example, a Tier 1 medication costs $25 for a 90-day supply ($10 x 2.5). This option "
        "provides convenience and savings for medications you take regularly. Prior authorization "
        "and specialty drugs require separate consideration."
    )

    pdf.subsection_header("Prior Authorization and Coverage Limitations")
    pdf.body_text(
        "Prior authorization is required for most Tier 4 specialty drugs, certain Tier 3 medications, "
        "and medications that exceed quantity limits. Your pharmacy or physician can submit a prior "
        "authorization request, which is usually approved or denied within 24 business hours. "
        "Step therapy may apply, requiring you to try a less expensive or preferred medication first "
        "before a requested medication is covered. Clinical guidelines help ensure safe and effective "
        "medication therapy management."
    )

    # PAGE 7: Prior Authorization and Mental Health
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Prior Authorization Requirements")

    pdf.body_text(
        "Prior authorization is a utilization review process that helps ensure medical services are "
        "medically necessary and appropriate. BlueCross BlueShield requires prior authorization for "
        "certain services to control costs while maintaining access to appropriate care. Your healthcare "
        "provider can request prior authorization, and most requests are approved or denied within one "
        "business day. Emergency services bypass the prior authorization process."
    )

    pdf.subsection_header("Services Requiring Prior Authorization")
    pdf.body_text(
        "Advanced imaging including MRI, CT, PET scans; Inpatient hospital admissions for non-emergency "
        "procedures; Specialty drugs and certain non-preferred medications; Durable medical equipment "
        "over $500; Out-of-network specialist referrals (PPO and HDHP); Surgical procedures; "
        "Bariatric weight loss surgery; Substance abuse treatment programs; Mental health inpatient "
        "admission; Advanced diagnostic testing."
    )

    pdf.subsection_header("Services Not Requiring Prior Authorization")
    pdf.body_text(
        "Emergency services in any setting; Office visits with in-network providers; Preventive care "
        "and screenings; Laboratory work ordered by your provider; Routine prescription medications "
        "(Tier 1 and Tier 2); Urgent care center visits; Physical therapy and occupational therapy "
        "(up to 15 visits); Behavioral health office visits; Telehealth consultations."
    )

    pdf.subsection_header("Expedited Prior Authorization")
    pdf.body_text(
        "If your health condition requires urgent care, you may request expedited prior authorization. "
        "Expedited requests are reviewed and approved or denied within 24 hours. Request expedited "
        "authorization by contacting BlueCross BlueShield directly or asking your healthcare provider "
        "to mark the request as urgent. In life-threatening situations, emergency care does not require "
        "prior authorization."
    )

    # Mental Health and Substance Abuse
    pdf.section_header("Mental Health and Substance Abuse Coverage")

    pdf.body_text(
        "BlueCross BlueShield is committed to providing comprehensive mental health and substance abuse "
        "treatment coverage as part of our commitment to whole-person health. Mental health services "
        "are covered at the same level as physical health services, with no separate annual limits on "
        "the number of visits for outpatient care. Substance abuse treatment is fully covered for both "
        "inpatient and outpatient services."
    )

    pdf.subsection_header("Outpatient Mental Health Services")
    pdf.body_text(
        "Outpatient therapy and counseling services are covered for individual, family, and group therapy. "
        "Mental health office visits are covered at the same copay as specialist visits ($50 PPO, $40 HMO, "
        "20% HDHP). There is no annual limit on the number of outpatient visits. Behavioral health providers "
        "include psychiatrists, psychologists, licensed clinical social workers, and licensed counselors. "
        "Services include treatment for depression, anxiety, bipolar disorder, post-traumatic stress disorder "
        "(PTSD), and other mental health conditions."
    )

    pdf.subsection_header("Inpatient Mental Health and Substance Abuse Treatment")
    pdf.body_text(
        "Inpatient hospital admission for mental health crisis stabilization, psychiatric treatment, or "
        "substance abuse detoxification is covered at the same rate as medical-surgical inpatient care. "
        "Covered inpatient services include room and board, physician services, diagnostic services, and "
        "medications administered during hospitalization. Residential treatment programs for substance abuse "
        "and mental health are covered when medically necessary. Prior authorization is required for inpatient "
        "admission but is not required for emergency psychiatric admission."
    )

    pdf.subsection_header("Employee Assistance Program (EAP)")
    pdf.body_text(
        "All employees have access to the BlueCross BlueShield Employee Assistance Program, which provides "
        "6 free confidential counseling sessions per year for you and your family members. EAP services include "
        "counseling for stress, work-related issues, family problems, substance abuse concerns, and mental health "
        "challenges. EAP services are completely separate from your medical benefits and are confidential. Call "
        "the EAP hotline to schedule a confidential appointment or access resources 24 hours a day, 7 days a week."
    )

    pdf.subsection_header("Crisis Support Services")
    pdf.body_text(
        "BlueCross BlueShield operates a 24/7 mental health crisis hotline for members in immediate crisis or "
        "considering suicide. Crisis hotline staff can help you access emergency mental health services, locate "
        "crisis treatment facilities, and provide immediate support. All crisis calls are confidential and free "
        "of charge. If you or someone you know is in immediate danger, always call 911 or go to the nearest "
        "emergency room."
    )

    # PAGE 8: Emergency and Urgent Care
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Emergency and Urgent Care")

    pdf.body_text(
        "BlueCross BlueShield provides comprehensive coverage for emergency and urgent healthcare services. "
        "Emergency services are covered regardless of whether you are treated by an in-network or out-of-network "
        "provider. Emergency room copays are waived if you are admitted to the hospital, ensuring that financial "
        "barriers do not prevent you from seeking necessary emergency care."
    )

    pdf.subsection_header("Emergency Services")
    pdf.body_text(
        "An emergency is a medical condition with acute symptoms such as chest pain, severe shortness of breath, "
        "loss of consciousness, serious injury, uncontrolled bleeding, or other conditions that require immediate "
        "medical attention. Emergency services are covered at the in-network rate regardless of the provider's "
        "network status. The emergency room copay is $250 (PPO), $200 (HMO), or 20% coinsurance (HDHP). The copay "
        "is waived if you are admitted as an inpatient, meaning you will only pay the deductible and coinsurance "
        "for your hospital stay. Emergency services are never subject to prior authorization requirements."
    )

    pdf.subsection_header("Urgent Care Services")
    pdf.body_text(
        "Urgent care centers provide treatment for illnesses and injuries that need prompt medical attention but "
        "are not life-threatening emergencies. Common urgent care conditions include sprains, minor lacerations, "
        "mild fever, urinary tract infections, and other acute conditions. Urgent care visits are covered at a lower "
        "copay than the emergency room: $75 PPO, $50 HMO, or 20% coinsurance HDHP. Urgent care services do not require "
        "prior authorization and are available at extended hours and convenient locations."
    )

    pdf.subsection_header("Ambulance Services")
    pdf.body_text(
        "Emergency ground ambulance services for transport to a hospital are covered at 80% after deductible. "
        "Air ambulance services for patients requiring urgent transport to a specialized facility are covered at 80% "
        "after deductible when medically necessary. Non-emergency ambulance transportation for scheduled appointments is "
        "covered only when other means of transportation are medically contraindicated. Ambulance services must be provided "
        "by a licensed ambulance provider."
    )

    pdf.subsection_header("Observation Admission")
    pdf.body_text(
        "Some emergency room patients may be admitted for observation rather than as an inpatient. Observation is typically "
        "less than 24 hours and is used to monitor acute conditions. Observation services are covered at the same rate as "
        "inpatient hospital services. If observation status is converted to inpatient admission, your coverage applies from "
        "the initial emergency room visit."
    )

    # PAGE 9: Exclusions and Limitations
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Exclusions and Limitations")

    pdf.body_text(
        "While BlueCross BlueShield provides comprehensive health coverage, certain services and treatments are not covered. "
        "This section outlines the major exclusions and limitations that apply to all plans. Some exclusions may be subject "
        "to exceptions with prior authorization or medical review. Contact BlueCross BlueShield customer service for information "
        "about specific services or treatments."
    )

    pdf.subsection_header("Cosmetic and Elective Procedures")
    pdf.body_text(
        "Cosmetic surgery and cosmetic dental procedures are not covered. This includes but is not limited to: rhinoplasty "
        "(nose reshaping), blepharoplasty (eyelid surgery) for cosmetic reasons, liposuction, and dental bonding for cosmetic "
        "purposes. However, cosmetic surgery is covered when medically necessary, such as reconstruction following injury or "
        "cancer treatment. Elective procedures chosen for personal preference rather than medical necessity are generally not "
        "covered."
    )

    pdf.subsection_header("Experimental and Investigational Treatments")
    pdf.body_text(
        "Experimental, investigational, or unproven treatments are not covered unless approved through BlueCross BlueShield's "
        "experimental treatment review process. Coverage of experimental treatments requires evidence that the treatment shows "
        "promise for your specific condition and is being conducted through a clinical trial or formal research program. Request "
        "an experimental treatment review by submitting clinical evidence and information about the proposed treatment."
    )

    pdf.subsection_header("Work-Related Injuries")
    pdf.body_text(
        "Services related to work-related injuries or occupational illnesses are not covered under your health plan. These services "
        "are covered under workers' compensation insurance, which provides benefits for injuries that occur in the course of employment. "
        "Report all work-related injuries to your employer immediately to ensure proper workers' compensation coverage."
    )

    pdf.subsection_header("Services Before Effective Date")
    pdf.body_text(
        "No health services are covered before your plan effective date. Your coverage begins at 12:01 a.m. on January 1, 2025. "
        "Services received before this date are not covered under this plan, even if the provider submits claims after your coverage "
        "begins. If you have questions about your coverage effective date, contact BlueCross BlueShield."
    )

    pdf.subsection_header("Weight Loss Surgery")
    pdf.body_text(
        "Bariatric weight loss surgery is covered only when medically necessary and approved through prior authorization. "
        "Eligibility requires either: Body Mass Index (BMI) of 40 or greater, OR BMI of 35 or greater with obesity-related "
        "comorbidities such as diabetes, hypertension, or sleep apnea. The surgical procedure, physician services, and related "
        "hospitalization are covered. However, dietitian visits before and after surgery are covered as part of preventive health "
        "services. Nutritional counseling is covered at the standard copay."
    )

    pdf.subsection_header("HMO Network Requirements")
    pdf.body_text(
        "HMO members must receive all non-emergency medical services from in-network providers. Non-emergency services received from "
        "out-of-network providers are not covered, except in cases where in-network providers are not available to provide the service. "
        "Emergency services are always covered regardless of network status. This restriction helps maintain the HMO's coordinated "
        "care model and ensures quality through primary care physician coordination."
    )

    pdf.subsection_header("Other Exclusions")
    pdf.body_text(
        "Additional services not covered include: Weight loss programs and appetite suppressant medications (except when part of "
        "an approved bariatric program); Infertility treatments and assisted reproductive technology services; Orthodontic services; "
        "Vision care and eyeglasses (covered under separate vision plan); Hearing aids and audiological services (may be covered under "
        "separate hearing plan); Services determined not medically necessary; Charges in excess of the provider's allowed amount; "
        "Services received outside the United States except in emergency situations; Services for educational or vocational purposes."
    )

    # PAGE 10: Important Information and Contact Details
    pdf.add_page()
    pdf.page_num += 1
    pdf.section_header("Important Information and Contact Details")

    pdf.subsection_header("How to Use Your Benefits")
    pdf.body_text(
        "To maximize your benefits, always inform your healthcare provider that you are covered by BlueCross BlueShield. "
        "For PPO plans, you may choose any healthcare provider without prior authorization for office visits. For HMO plans, "
        "select a primary care physician who will coordinate your care and provide referrals to specialists. For HDHP plans, "
        "you have flexibility similar to PPO plans but should be mindful of the higher deductible. Keep your member ID card "
        "with you at all times and present it to your healthcare provider before receiving services."
    )

    pdf.subsection_header("Finding In-Network Providers")
    pdf.body_text(
        "Search for in-network healthcare providers using the BlueCross BlueShield online provider directory at www.bcbs-sc.com. "
        "The directory includes primary care physicians, specialists, hospitals, urgent care centers, and other healthcare facilities. "
        "You can search by location, specialty, language, and other preferences. If you cannot find an in-network provider for a "
        "specific service, contact BlueCross BlueShield to request an out-of-network referral."
    )

    pdf.subsection_header("Member Services Contact Information")
    pdf.body_text(
        "For questions about your coverage, claims, or provider information, contact BlueCross BlueShield Member Services:\n\n"
        "Phone: 1-800-BCBS-SC (1-800-222-7772)\n"
        "Hours: Monday-Friday 8:00 AM - 8:00 PM, Saturday 9:00 AM - 5:00 PM (Eastern Time)\n"
        "Website: www.bcbs-sc.com\n"
        "Mobile App: BlueCross BlueShield of SC app (available on iOS and Android)\n"
        "TTY/TDD: 1-800-735-2966"
    )

    pdf.subsection_header("Claims and Billing")
    pdf.body_text(
        "Claims for in-network services are typically submitted directly to BlueCross BlueShield by your healthcare provider. "
        "You will receive an explanation of benefits (EOB) detailing the services, amounts charged, your responsibility, and what "
        "the plan paid. For out-of-network services, you may need to submit claims yourself. Keep copies of receipts and documentation. "
        "Questions about claims should be directed to Member Services using the contact information above."
    )

    pdf.subsection_header("Coordination of Benefits")
    pdf.body_text(
        "If you have coverage from another health plan (such as a spouse's employer plan), BlueCross BlueShield will coordinate "
        "benefits to ensure you are not overpaid. The plan that pays first is determined by the coordination of benefits rules. "
        "Notify BlueCross BlueShield of any additional coverage so your claims can be processed correctly."
    )

    pdf.subsection_header("Plan Changes and Termination")
    pdf.body_text(
        "This benefits summary describes your coverage effective January 1, 2025. BlueCross BlueShield reserves the right to modify "
        "plan benefits, copays, deductibles, and covered services prospectively. You will receive advance notice of material changes. "
        "If your employment terminates or you become ineligible for coverage, you may be entitled to continuation coverage under COBRA "
        "for up to 18 months. Contact your employer's benefits administrator for COBRA information."
    )

    pdf.subsection_header("Grievances and Appeals")
    pdf.body_text(
        "If you believe a claim was wrongly denied or if you have concerns about the care you received, you have the right to file "
        "a grievance or appeal. All grievances and appeals are reviewed by BlueCross BlueShield and you will receive a decision within "
        "30 days. For complaints regarding the quality of care, contact the South Carolina Department of Insurance at 1-800-869-2876."
    )

    pdf.subsection_header("Notice of Privacy Practices")
    pdf.body_text(
        "BlueCross BlueShield is required by HIPAA to maintain the privacy of your health information and to provide you with a Notice "
        "of Privacy Practices. The notice describes how we use and disclose your health information, your rights regarding your information, "
        "and how to contact us with privacy concerns. You can request a copy of the privacy notice from Member Services or download it from "
        "www.bcbs-sc.com."
    )

    # Save the PDF
    output_path = "/Users/slysik/bcbs/data/bcbs_benefits_summary.pdf"
    pdf.output(output_path)
    print(f"PDF generated successfully: {output_path}")
    print(f"Total pages: {pdf.page_num}")

    # Verify the file exists
    if Path(output_path).exists():
        file_size = Path(output_path).stat().st_size
        print(f"File size: {file_size:,} bytes")
        return True
    return False

if __name__ == "__main__":
    success = generate_pdf()
    exit(0 if success else 1)
