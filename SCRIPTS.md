# BCBS Claims AI - Demo Scripts

Three executable bash scripts for setting up and running the BCBS Claims AI demo.

## Scripts Overview

### 1. `scripts/setup_aws.sh`

Automates AWS resource provisioning for the BCBS demo. All resources are free tier eligible.

**What it does:**
- Creates an S3 bucket with random suffix (e.g., `bcbs-demo-data-a1b2c3d4`)
- Creates a DynamoDB table `bcbs-conversations` with conversation ID + timestamp key schema
- Sets up an IAM user `bcbs-demo-user` with scoped permissions:
  - S3: GetObject, PutObject, ListBucket, DeleteObject
  - DynamoDB: PutItem, GetItem, Query, Scan, DeleteItem, BatchWriteItem
  - Bedrock: InvokeModel, InvokeModelWithResponseStream (Claude models only)
- Generates access keys and outputs credentials for `.env`
- Provides manual Bedrock model access link

**Prerequisites:**
- AWS CLI configured with valid credentials
- Permissions to create S3 buckets, DynamoDB tables, and IAM users

**Usage:**
```bash
chmod +x scripts/setup_aws.sh
./scripts/setup_aws.sh

# Optional: Set region
AWS_REGION=us-west-2 ./scripts/setup_aws.sh
```

**Output:**
Prints credentials to add to `.env`:
```
ENABLE_AWS=true
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=bcbs-demo-data-a1b2c3d4
DYNAMODB_TABLE=bcbs-conversations
```

---

### 2. `scripts/run_demo.sh`

Starts both backend (FastAPI on port 8000) and frontend (Vite on port 5173) in development mode.

**What it does:**
- Checks for `.env` file (copies from template if missing)
- Starts backend: `uv run uvicorn app.main:app --reload`
- Waits for backend health check
- Starts frontend: `npm run dev`
- Displays URLs and waits for Ctrl+C
- Cleanup: Kills both processes on exit

**Prerequisites:**
- `.env` file with `ANTHROPIC_API_KEY` set
- `uv` installed (Python dependency manager)
- `npm` and Node.js installed

**Usage:**
```bash
chmod +x scripts/run_demo.sh
./scripts/run_demo.sh
```

**URLs:**
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

---

### 3. `scripts/seed_data.sh`

Generates synthetic claims data and benefits PDF if they don't already exist.

**What it does:**
- Checks if `data/sample_claims.csv` exists; generates if missing
- Checks if `data/bcbs_benefits_summary.pdf` exists; generates if missing
- Runs generation scripts via `uv run python`
- Displays file sizes at end

**Prerequisites:**
- Python 3.11+
- `uv` installed
- Backend dependencies available (from `backend/pyproject.toml`)

**Usage:**
```bash
chmod +x scripts/seed_data.sh
./scripts/seed_data.sh
```

**Output:**
```
=== Data Ready ===
-rw-r--r--  1 user  staff   182K Feb  5 15:33 /Users/.../bcbs/data/sample_claims.csv
-rw-r--r--  1 user  staff    25K Feb  5 15:34 /Users/.../bcbs/data/bcbs_benefits_summary.pdf
```

---

## Quick Start

1. **Setup AWS (optional):**
   ```bash
   ./scripts/setup_aws.sh
   # Add output credentials to .env
   ```

2. **Prepare environment:**
   ```bash
   cp env.template .env
   # Edit .env with ANTHROPIC_API_KEY
   ```

3. **Generate demo data:**
   ```bash
   ./scripts/seed_data.sh
   ```

4. **Run demo:**
   ```bash
   ./scripts/run_demo.sh
   ```

5. **Open browser:**
   - Frontend: http://localhost:5173
   - API Docs: http://localhost:8000/docs

---

## Implementation Details

### Error Handling
- All scripts use `set -euo pipefail` for strict error handling
- AWS setup checks for existing resources before creation (idempotent)
- Demo script exits if `.env` missing, prompts for key
- Data script checks existence before regenerating

### Security
- IAM user has minimum required permissions per resource
- Bedrock access requires manual approval in console
- Access keys only printed to stdout (not logged)
- S3 bucket names randomized to avoid conflicts

### Free Tier Compliance
- DynamoDB: On-demand billing (no provisioned capacity)
- S3: Standard storage in us-east-1 region
- Bedrock: Pay-per-invocation, no upfront cost
- All resources can be deleted after demo to avoid charges

---

## Troubleshooting

**AWS Setup Fails:**
```bash
# Check AWS CLI is configured
aws sts get-caller-identity

# Verify permissions for S3, DynamoDB, IAM operations
```

**Backend won't start:**
```bash
# Check port 8000 is available
lsof -i :8000

# Verify uv is installed
uv --version
```

**Frontend won't start:**
```bash
# Check npm/Node.js installed
npm --version

# Verify dependencies
cd frontend && npm install
```

**Data generation fails:**
```bash
# Check generate_claims.py and generate_benefits_pdf.py exist
ls -la data/generate_*.py

# Run directly to see error
cd backend && uv run python ../data/generate_claims.py
```
