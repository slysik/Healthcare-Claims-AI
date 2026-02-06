// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClaimsQuery = {
  query: string
  description: string
}

export type ClaimsResponse = {
  sql: string
  results: Record<string, string | number>[]
  summary: string
  confidence: number
}

export type PlanQuestion = {
  question: string
  category: string
}

export type Citation = {
  text: string
  page: number
  section: string
  relevance: number
}

export type PlanResponse = {
  answer: string
  citations: Citation[]
  confidence: number
}

export type MonthlySpend = {
  month: string
  amount: number
  category: string
}

export type Insight = {
  title: string
  description: string
  type: 'savings' | 'alert' | 'trend'
}

export type SpendInsights = {
  monthlySpend: MonthlySpend[]
  insights: Insight[]
  totalSpend: number
  projectedAnnual: number
}

export type WorkflowStep = {
  id: string
  label: string
  description: string
  estimatedTime: string
  status: 'pending' | 'active' | 'complete' | 'error'
}

export type Workflow = {
  id: string
  title: string
  description: string
  steps: WorkflowStep[]
}

export type Recommendation = {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
  actionLabel: string
}

export type ActivityLogEntry = {
  timestamp: string
  action: string
  detail: string
  source: string
}

// ---------------------------------------------------------------------------
// Sample Claims Queries
// ---------------------------------------------------------------------------

export const SAMPLE_CLAIMS_QUERIES: ClaimsQuery[] = [
  {
    query: 'Show all claims for diabetes management in Q4 2024',
    description: 'Retrieve claims with ICD-10 codes E11.x (Type 2 diabetes) filed between October and December 2024.',
  },
  {
    query: 'What is the average reimbursement for office visits this year?',
    description: 'Calculate average paid amounts for CPT 99213 and 99214 evaluation & management visits in 2025.',
  },
  {
    query: 'Find denied claims over $1,000 in the last 90 days',
    description: 'List claims with denial reason codes and amounts exceeding $1,000 within the past 90 days.',
  },
  {
    query: 'Compare ER visit costs across network hospitals',
    description: 'Aggregate emergency department CPT 99281-99285 costs by facility for in-network providers.',
  },
  {
    query: 'Show prescription drug claims for specialty medications',
    description: 'Pull Rx claims for specialty tier drugs (biologic, oncology, immunosuppressant) with prior auth status.',
  },
  {
    query: 'List all physical therapy claims for lower back pain',
    description: 'Retrieve claims matching ICD-10 M54.5 (low back pain) with CPT 97110-97542 therapy codes.',
  },
  {
    query: 'What percentage of preventive care visits were in-network?',
    description: 'Calculate the in-network vs. out-of-network ratio for CPT 99381-99397 preventive visits.',
  },
  {
    query: 'Show top 10 providers by total billed amount',
    description: 'Rank providers by aggregate billed charges across all claim types in the current plan year.',
  },
  {
    query: 'Find duplicate claims submitted in the last 60 days',
    description: 'Identify potential duplicate submissions based on matching member, provider, date of service, and CPT code.',
  },
  {
    query: 'Show maternity-related claims and total out-of-pocket costs',
    description: 'Aggregate claims for ICD-10 O codes (pregnancy/childbirth) with member cost-sharing breakdown.',
  },
]

// ---------------------------------------------------------------------------
// Mock Claims Responses (keyed by query string)
// ---------------------------------------------------------------------------

export const MOCK_CLAIMS_RESPONSES: Record<string, ClaimsResponse> = {
  'Show all claims for diabetes management in Q4 2024': {
    sql: `SELECT c.claim_id, c.member_id, c.provider_name, c.icd10_code, c.cpt_code,
       c.billed_amount, c.paid_amount, c.date_of_service
FROM claims c
WHERE c.icd10_code LIKE 'E11%'
  AND c.date_of_service BETWEEN '2024-10-01' AND '2024-12-31'
ORDER BY c.date_of_service DESC;`,
    results: [
      { claim_id: 'CLM-20241015-8842', member_id: 'MBR-554201', provider_name: 'Palmetto Endocrinology Associates', icd10_code: 'E11.9', cpt_code: '99214', billed_amount: 285, paid_amount: 198, date_of_service: '2024-10-15' },
      { claim_id: 'CLM-20241022-9103', member_id: 'MBR-554201', provider_name: 'Lowcountry Pharmacy Services', icd10_code: 'E11.65', cpt_code: '99213', billed_amount: 142, paid_amount: 112, date_of_service: '2024-10-22' },
      { claim_id: 'CLM-20241108-1247', member_id: 'MBR-331087', provider_name: 'Carolina Diabetes & Nutrition Center', icd10_code: 'E11.9', cpt_code: '99214', billed_amount: 310, paid_amount: 215, date_of_service: '2024-11-08' },
      { claim_id: 'CLM-20241203-5571', member_id: 'MBR-887432', provider_name: 'Midlands Primary Care Group', icd10_code: 'E11.22', cpt_code: '83036', billed_amount: 78, paid_amount: 62, date_of_service: '2024-12-03' },
      { claim_id: 'CLM-20241218-6634', member_id: 'MBR-554201', provider_name: 'Palmetto Endocrinology Associates', icd10_code: 'E11.9', cpt_code: '99215', billed_amount: 420, paid_amount: 305, date_of_service: '2024-12-18' },
    ],
    summary: 'Found 5 diabetes management claims in Q4 2024 totaling $1,235 billed and $892 paid across 3 members and 4 providers. Most common diagnosis: E11.9 (Type 2 diabetes without complications).',
    confidence: 0.95,
  },

  'What is the average reimbursement for office visits this year?': {
    sql: `SELECT cpt_code,
       COUNT(*) AS visit_count,
       ROUND(AVG(paid_amount), 2) AS avg_reimbursement,
       ROUND(AVG(billed_amount), 2) AS avg_billed
FROM claims
WHERE cpt_code IN ('99213', '99214')
  AND date_of_service >= '2025-01-01'
GROUP BY cpt_code;`,
    results: [
      { cpt_code: '99213', visit_count: 1247, avg_reimbursement: 108.42, avg_billed: 165.30 },
      { cpt_code: '99214', visit_count: 893, avg_reimbursement: 172.85, avg_billed: 268.50 },
    ],
    summary: 'In 2025, the average reimbursement for established patient office visits is $108.42 for CPT 99213 (level 3) and $172.85 for CPT 99214 (level 4). Combined across 2,140 visits, the overall average is $135.28.',
    confidence: 0.92,
  },

  'Find denied claims over $1,000 in the last 90 days': {
    sql: `SELECT c.claim_id, c.member_id, c.provider_name, c.billed_amount,
       c.denial_reason_code, c.denial_description, c.date_of_service
FROM claims c
WHERE c.claim_status = 'DENIED'
  AND c.billed_amount > 1000
  AND c.date_of_service >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY c.billed_amount DESC;`,
    results: [
      { claim_id: 'CLM-20250105-3301', member_id: 'MBR-221054', provider_name: 'Charleston Orthopedic Specialists', billed_amount: 4850, denial_reason_code: 'CO-197', denial_description: 'Prior authorization required but not obtained', date_of_service: '2025-01-05' },
      { claim_id: 'CLM-20250112-4478', member_id: 'MBR-667823', provider_name: 'Coastal Imaging Center', billed_amount: 3200, denial_reason_code: 'CO-50', denial_description: 'Non-covered service per plan terms', date_of_service: '2025-01-12' },
      { claim_id: 'CLM-20250118-5592', member_id: 'MBR-443901', provider_name: 'Upstate Surgical Associates', billed_amount: 2175, denial_reason_code: 'CO-29', denial_description: 'Filing deadline exceeded', date_of_service: '2025-01-18' },
      { claim_id: 'CLM-20250126-7714', member_id: 'MBR-112345', provider_name: 'Palmetto Pain Management', billed_amount: 1580, denial_reason_code: 'CO-197', denial_description: 'Prior authorization required but not obtained', date_of_service: '2025-01-26' },
    ],
    summary: 'Found 4 denied claims over $1,000 in the last 90 days totaling $11,805. Most common denial reason: prior authorization not obtained (2 claims). Recommend reviewing prior auth workflows for orthopedic and pain management referrals.',
    confidence: 0.97,
  },
}

// ---------------------------------------------------------------------------
// Sample Plan Questions
// ---------------------------------------------------------------------------

export const SAMPLE_PLAN_QUESTIONS: PlanQuestion[] = [
  {
    question: 'What is my annual deductible and how much have I met?',
    category: 'Deductibles & Cost Sharing',
  },
  {
    question: 'Does my plan cover telehealth visits?',
    category: 'Covered Services',
  },
  {
    question: 'What is the copay for specialist visits?',
    category: 'Deductibles & Cost Sharing',
  },
  {
    question: 'Is bariatric surgery covered under my plan?',
    category: 'Covered Services',
  },
  {
    question: 'How do I appeal a denied claim?',
    category: 'Appeals & Grievances',
  },
  {
    question: 'What prescription drug tiers does my plan have?',
    category: 'Pharmacy Benefits',
  },
  {
    question: 'Does my plan cover out-of-state emergency room visits?',
    category: 'Emergency & Urgent Care',
  },
  {
    question: 'What are the mental health and substance abuse benefits?',
    category: 'Behavioral Health',
  },
  {
    question: 'Is prior authorization required for MRI imaging?',
    category: 'Prior Authorization',
  },
  {
    question: 'What is the out-of-pocket maximum for my family plan?',
    category: 'Deductibles & Cost Sharing',
  },
]

// ---------------------------------------------------------------------------
// Mock Plan Responses (keyed by question string)
// ---------------------------------------------------------------------------

export const MOCK_PLAN_RESPONSES: Record<string, PlanResponse> = {
  'What is my annual deductible and how much have I met?': {
    answer:
      'Your Blue Options Gold PPO plan has an individual annual deductible of $1,500 and a family deductible of $3,000. As of today, you have met $1,125.40 of your individual deductible (75%). Your remaining deductible is $374.60. Deductible resets on January 1 of each plan year.',
    citations: [
      { text: 'Individual Deductible: $1,500 per calendar year. Family Deductible: $3,000 per calendar year.', page: 12, section: 'Schedule of Benefits', relevance: 0.98 },
      { text: 'The deductible accumulation period begins January 1 and ends December 31 of each year.', page: 14, section: 'Deductible Provisions', relevance: 0.85 },
    ],
    confidence: 0.96,
  },

  'Does my plan cover telehealth visits?': {
    answer:
      'Yes, your plan covers telehealth visits for medical and behavioral health services. Telehealth visits with in-network providers have a $25 copay, the same as a primary care office visit. Behavioral health telehealth visits have a $40 copay. No deductible applies to in-network telehealth visits. Covered platforms include BCBS Telehealth Connection, Teladoc, and MDLive.',
    citations: [
      { text: 'Telehealth/Telemedicine Services: Covered at in-network cost sharing levels when delivered through an approved telehealth platform.', page: 28, section: 'Covered Medical Services', relevance: 0.97 },
      { text: 'Primary Care Visit (in-network, including telehealth): $25 copay, deductible waived.', page: 13, section: 'Schedule of Benefits', relevance: 0.93 },
      { text: 'Approved Telehealth Platforms: BCBS Telehealth Connection, Teladoc, MDLive.', page: 29, section: 'Telehealth Provisions', relevance: 0.88 },
    ],
    confidence: 0.94,
  },

  'How do I appeal a denied claim?': {
    answer:
      'You have the right to file an appeal within 180 days of receiving a denial notice. To start the process: (1) Review the Explanation of Benefits (EOB) for the specific denial reason code. (2) Submit a written appeal to BCBS Member Appeals at PO Box 100191, Columbia, SC 29202, or call 1-800-868-2528. (3) Include your member ID, claim number, and any supporting documentation from your provider. Internal appeals are typically resolved within 30 calendar days. If your internal appeal is denied, you may request an external review by an independent review organization within 4 months.',
    citations: [
      { text: 'Members may file an internal appeal within 180 calendar days from the date of the adverse benefit determination notice.', page: 62, section: 'Appeals & Grievances', relevance: 0.99 },
      { text: 'Internal appeals shall be resolved within 30 calendar days of receipt. Expedited appeals for urgent situations within 72 hours.', page: 63, section: 'Appeal Timeframes', relevance: 0.92 },
      { text: 'Following exhaustion of internal appeals, members may request an external review by a CMS-approved Independent Review Organization (IRO).', page: 65, section: 'External Review', relevance: 0.90 },
    ],
    confidence: 0.98,
  },
}

// ---------------------------------------------------------------------------
// Mock Spend Insights
// ---------------------------------------------------------------------------

const MONTHS = [
  '2024-03', '2024-04', '2024-05', '2024-06',
  '2024-07', '2024-08', '2024-09', '2024-10',
  '2024-11', '2024-12', '2025-01', '2025-02',
] as const

const SPEND_BY_CATEGORY: Record<string, number[]> = {
  Medical: [1820, 1450, 2100, 1675, 1930, 2340, 1560, 1890, 2450, 1720, 1980, 2110],
  Rx:      [680,  720,  695,  810,  750,  685,  890,  720,  710,  830,  765,  845],
  Dental:  [210,  0,    185,  0,    225,  0,    195,  0,    240,  0,    200,  0],
  Vision:  [0,    0,    0,    175,  0,    0,    0,    0,    0,    190,  0,    0],
}

function buildMonthlySpend(): MonthlySpend[] {
  const entries: MonthlySpend[] = []
  for (const category of Object.keys(SPEND_BY_CATEGORY)) {
    const amounts = SPEND_BY_CATEGORY[category]
    if (!amounts) continue
    MONTHS.forEach((month, i) => {
      const amount = amounts[i]
      if (amount !== undefined && amount > 0) {
        entries.push({ month, amount, category })
      }
    })
  }
  return entries
}

export const MOCK_SPEND_INSIGHTS: SpendInsights = {
  monthlySpend: buildMonthlySpend(),
  insights: [
    {
      title: 'Specialty Rx Spend Increasing',
      description:
        'Your specialty pharmacy costs have risen 18% over the last 3 months. Consider discussing therapeutic alternatives or manufacturer copay assistance programs with your provider.',
      type: 'alert',
    },
    {
      title: 'Preventive Care Savings Opportunity',
      description:
        'You have not completed your annual wellness visit this plan year. In-network preventive visits are covered at 100% with no cost sharing.',
      type: 'savings',
    },
    {
      title: 'ER Utilization Above Average',
      description:
        'You have had 2 ER visits in the past 6 months compared to 0.4 average for your plan tier. Urgent care centers are available with a $50 copay vs $250 ER copay.',
      type: 'savings',
    },
    {
      title: 'Dental Spend Trending Down',
      description:
        'Your dental spending has decreased 12% year-over-year. Regular biannual cleanings are fully covered under your preventive dental benefit.',
      type: 'trend',
    },
    {
      title: 'Out-of-Pocket Maximum Approaching',
      description:
        'You have reached 82% of your $6,350 individual out-of-pocket maximum. Once met, covered services will be paid at 100% for the remainder of the plan year.',
      type: 'alert',
    },
  ],
  totalSpend: 34_645,
  projectedAnnual: 41_574,
}

// ---------------------------------------------------------------------------
// Mock Workflows
// ---------------------------------------------------------------------------

export const MOCK_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-appeal-denied-claim',
    title: 'Appeal a Denied Claim',
    description: 'Step-by-step process to file an internal appeal for a denied healthcare claim.',
    steps: [
      { id: 'appeal-1', label: 'Review EOB Denial Details', description: 'Locate the Explanation of Benefits for the denied claim and note the denial reason code (e.g., CO-197, CO-50).', estimatedTime: '5 min', status: 'pending' },
      { id: 'appeal-2', label: 'Gather Supporting Documentation', description: 'Collect medical records, provider letters of medical necessity, and any prior authorization references.', estimatedTime: '15 min', status: 'pending' },
      { id: 'appeal-3', label: 'Draft Appeal Letter', description: 'Write a formal appeal letter referencing your member ID, claim number, and specific plan provisions that support coverage.', estimatedTime: '20 min', status: 'pending' },
      { id: 'appeal-4', label: 'Submit to BCBS Member Appeals', description: 'Mail to PO Box 100191, Columbia, SC 29202 or fax to 803-264-7200. Retain copies of all submitted materials.', estimatedTime: '10 min', status: 'pending' },
      { id: 'appeal-5', label: 'Track Appeal Status', description: 'Monitor appeal status via the member portal or call 1-800-868-2528. Internal appeals are resolved within 30 calendar days.', estimatedTime: 'Ongoing', status: 'pending' },
    ],
  },
  {
    id: 'wf-compare-provider-costs',
    title: 'Compare Provider Costs',
    description: 'Research and compare cost estimates across in-network providers for a planned procedure.',
    steps: [
      { id: 'cost-1', label: 'Identify Procedure Codes', description: 'Obtain the CPT code(s) for your planned procedure from your referring provider (e.g., CPT 27447 for knee replacement).', estimatedTime: '5 min', status: 'pending' },
      { id: 'cost-2', label: 'Search In-Network Providers', description: 'Use the BCBS Find a Provider tool to locate in-network facilities and specialists for your procedure.', estimatedTime: '10 min', status: 'pending' },
      { id: 'cost-3', label: 'Request Cost Estimates', description: 'Call BCBS at 1-800-868-2528 or use the Cost Estimator tool to get member-specific cost estimates for each provider.', estimatedTime: '15 min', status: 'pending' },
      { id: 'cost-4', label: 'Compare Quality Ratings', description: 'Review provider quality scores, patient satisfaction ratings, and complication rates on the BCBS Quality Care portal.', estimatedTime: '10 min', status: 'pending' },
      { id: 'cost-5', label: 'Select Provider & Schedule', description: 'Choose the provider with the best cost-quality balance and contact their scheduling office to set an appointment.', estimatedTime: '10 min', status: 'pending' },
    ],
  },
  {
    id: 'wf-verify-benefits',
    title: 'Verify Benefits Coverage',
    description: 'Confirm whether a specific service or treatment is covered under your current plan.',
    steps: [
      { id: 'benefits-1', label: 'Identify Service Details', description: 'Gather the service description, CPT/HCPCS codes, and diagnosis codes (ICD-10) from your provider.', estimatedTime: '5 min', status: 'pending' },
      { id: 'benefits-2', label: 'Check Schedule of Benefits', description: 'Review your plan\'s Schedule of Benefits in the member portal for coverage details, copays, and exclusions.', estimatedTime: '10 min', status: 'pending' },
      { id: 'benefits-3', label: 'Verify Prior Auth Requirements', description: 'Check if the service requires prior authorization by calling BCBS Utilization Management at 1-800-868-2528.', estimatedTime: '10 min', status: 'pending' },
      { id: 'benefits-4', label: 'Confirm Network Status', description: 'Verify the provider is in-network for the specific service. Some providers may be in-network for office visits but out-of-network for certain procedures.', estimatedTime: '5 min', status: 'pending' },
    ],
  },
  {
    id: 'wf-prior-auth',
    title: 'Request Prior Authorization',
    description: 'Obtain advance approval from BCBS before receiving a service that requires prior authorization.',
    steps: [
      { id: 'auth-1', label: 'Confirm PA Requirement', description: 'Verify the service requires prior authorization by checking the PA Required Services list on the member portal or calling Member Services.', estimatedTime: '5 min', status: 'pending' },
      { id: 'auth-2', label: 'Provider Submits PA Request', description: 'Your provider submits the prior authorization request to BCBS with clinical documentation, diagnosis codes, and treatment rationale.', estimatedTime: '15 min', status: 'pending' },
      { id: 'auth-3', label: 'BCBS Medical Review', description: 'BCBS clinical team reviews the request against medical policy criteria. Standard reviews take up to 15 calendar days; urgent reviews within 72 hours.', estimatedTime: '1-15 days', status: 'pending' },
      { id: 'auth-4', label: 'Receive Determination', description: 'BCBS sends the authorization decision to both you and your provider. If approved, note the authorization number and validity period.', estimatedTime: '1-3 days', status: 'pending' },
      { id: 'auth-5', label: 'Schedule Service', description: 'Once approved, schedule your procedure within the authorization validity window (typically 60-90 days).', estimatedTime: '10 min', status: 'pending' },
      { id: 'auth-6', label: 'Appeal if Denied', description: 'If denied, you may file an appeal within 180 days. Request a peer-to-peer review between your provider and BCBS medical director.', estimatedTime: '30 min', status: 'pending' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Mock Recommendations
// ---------------------------------------------------------------------------

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-wellness-visit',
    title: 'Schedule Your Annual Wellness Visit',
    description: 'Your annual preventive exam is 100% covered with no cost sharing when you visit an in-network provider. You have not had one this plan year.',
    priority: 'high',
    category: 'Preventive Care',
    actionLabel: 'Find a Provider',
  },
  {
    id: 'rec-generic-switch',
    title: 'Switch to Generic Metformin ER',
    description: 'You are currently filling brand-name Glucophage XR ($85/month). A generic equivalent is available at $12/month, saving you $876 annually.',
    priority: 'high',
    category: 'Pharmacy Savings',
    actionLabel: 'Ask Your Doctor',
  },
  {
    id: 'rec-mail-order',
    title: 'Use Mail-Order Pharmacy for Maintenance Meds',
    description: 'Switch your 3 maintenance medications to 90-day mail order and save up to 30%. BCBS partners with Express Scripts for home delivery.',
    priority: 'medium',
    category: 'Pharmacy Savings',
    actionLabel: 'Set Up Mail Order',
  },
  {
    id: 'rec-urgent-care',
    title: 'Use Urgent Care Instead of the ER',
    description: 'For non-emergency situations, urgent care visits cost $50 copay vs $250 ER copay. You have 12 in-network urgent care centers within 10 miles.',
    priority: 'medium',
    category: 'Cost Optimization',
    actionLabel: 'Find Urgent Care',
  },
  {
    id: 'rec-hsa-contribution',
    title: 'Maximize Your HSA Contribution',
    description: 'You have contributed $2,400 of the $4,150 individual limit. Contributing the remaining $1,750 reduces taxable income and builds your health savings.',
    priority: 'low',
    category: 'Financial Planning',
    actionLabel: 'Update Contribution',
  },
  {
    id: 'rec-dental-cleaning',
    title: 'Schedule Your Second Dental Cleaning',
    description: 'Your plan covers 2 preventive cleanings per year at 100%. You have used 1 of 2 covered cleanings. Schedule before December 31 to maximize your benefit.',
    priority: 'medium',
    category: 'Preventive Care',
    actionLabel: 'Find a Dentist',
  },
  {
    id: 'rec-telehealth',
    title: 'Try Telehealth for Follow-Up Visits',
    description: 'Your recent lab results can be reviewed via a telehealth visit ($25 copay) instead of an in-office visit. Same copay, no travel time.',
    priority: 'low',
    category: 'Convenience',
    actionLabel: 'Schedule Telehealth',
  },
]

// ---------------------------------------------------------------------------
// Mock Activity Log
// ---------------------------------------------------------------------------

export const MOCK_ACTIVITY_LOG: ActivityLogEntry[] = [
  { timestamp: '2025-02-06T09:15:00Z', action: 'Claims Query', detail: 'Queried diabetes management claims for Q4 2024. Returned 5 results.', source: 'Ask My Claims' },
  { timestamp: '2025-02-06T09:12:00Z', action: 'Plan Document Search', detail: 'Searched for telehealth coverage details. Found in Schedule of Benefits p.28.', source: 'Ask My Plan Docs' },
  { timestamp: '2025-02-06T09:08:00Z', action: 'Spend Analysis', detail: 'Generated 12-month spend trend report across Medical, Rx, Dental, Vision categories.', source: 'Health Spend Insights' },
  { timestamp: '2025-02-05T16:42:00Z', action: 'Workflow Started', detail: 'Initiated "Appeal a Denied Claim" workflow for claim CLM-20250105-3301.', source: 'AI Workflows' },
  { timestamp: '2025-02-05T16:30:00Z', action: 'Claims Query', detail: 'Queried denied claims over $1,000 in the last 90 days. Returned 4 results.', source: 'Ask My Claims' },
  { timestamp: '2025-02-05T14:20:00Z', action: 'Recommendation Viewed', detail: 'Viewed recommendation: Switch to Generic Metformin ER (potential savings $876/year).', source: 'Recommendations' },
  { timestamp: '2025-02-05T11:05:00Z', action: 'Plan Document Search', detail: 'Searched for prior authorization requirements for MRI. Found in PA Required Services list.', source: 'Ask My Plan Docs' },
  { timestamp: '2025-02-04T15:33:00Z', action: 'Claims Query', detail: 'Queried average reimbursement for office visits (CPT 99213/99214). Analyzed 2,140 visits.', source: 'Ask My Claims' },
  { timestamp: '2025-02-04T14:15:00Z', action: 'Workflow Completed', detail: 'Completed "Verify Benefits Coverage" workflow for CPT 27447 (knee replacement).', source: 'AI Workflows' },
  { timestamp: '2025-02-04T10:45:00Z', action: 'Spend Alert Dismissed', detail: 'Dismissed alert: Specialty Rx Spend Increasing (18% over 3 months).', source: 'Health Spend Insights' },
  { timestamp: '2025-02-03T16:20:00Z', action: 'Provider Search', detail: 'Searched in-network orthopedic specialists within 25 miles. Found 8 providers.', source: 'AI Workflows' },
  { timestamp: '2025-02-03T13:50:00Z', action: 'Plan Document Search', detail: 'Searched for appeal process details. Found in Appeals & Grievances section p.62-65.', source: 'Ask My Plan Docs' },
  { timestamp: '2025-02-03T11:10:00Z', action: 'Claims Export', detail: 'Exported 45 claims for date range 2024-10-01 to 2024-12-31 as CSV.', source: 'Ask My Claims' },
  { timestamp: '2025-02-02T09:30:00Z', action: 'Recommendation Action', detail: 'Clicked "Find a Provider" for Annual Wellness Visit recommendation.', source: 'Recommendations' },
  { timestamp: '2025-02-01T17:05:00Z', action: 'Spend Analysis', detail: 'Viewed projected annual spend: $41,574. Year-over-year change: +6.2%.', source: 'Health Spend Insights' },
  { timestamp: '2025-02-01T14:40:00Z', action: 'Claims Query', detail: 'Queried physical therapy claims for ICD-10 M54.5 (low back pain). Returned 12 results.', source: 'Ask My Claims' },
  { timestamp: '2025-01-31T16:15:00Z', action: 'Workflow Started', detail: 'Initiated "Compare Provider Costs" workflow for CPT 27447 (total knee arthroplasty).', source: 'AI Workflows' },
  { timestamp: '2025-01-31T10:20:00Z', action: 'Plan Document Search', detail: 'Searched for out-of-pocket maximum details. Found on Schedule of Benefits p.12.', source: 'Ask My Plan Docs' },
  { timestamp: '2025-01-30T15:55:00Z', action: 'Recommendation Viewed', detail: 'Viewed recommendation: Use Mail-Order Pharmacy for Maintenance Meds (save up to 30%).', source: 'Recommendations' },
  { timestamp: '2025-01-30T11:30:00Z', action: 'Claims Query', detail: 'Queried ER visit costs across network hospitals. Compared 6 facilities.', source: 'Ask My Claims' },
  { timestamp: '2025-01-29T14:00:00Z', action: 'Spend Alert Acknowledged', detail: 'Acknowledged alert: Out-of-Pocket Maximum Approaching (82% of $6,350).', source: 'Health Spend Insights' },
  { timestamp: '2025-01-29T09:45:00Z', action: 'Session Start', detail: 'Member logged in. Last session: 2025-01-28. Deductible status: 75% met.', source: 'System' },
]
