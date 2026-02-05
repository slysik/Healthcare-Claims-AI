#!/bin/bash
# Setup AWS resources for BCBS Claims AI Demo
# All resources are free tier eligible
# Prerequisites: AWS CLI configured with appropriate permissions

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
SUFFIX=$(echo $RANDOM | md5sum | head -c 8 2>/dev/null || echo "demo")
S3_BUCKET="bcbs-demo-data-${SUFFIX}"
DYNAMO_TABLE="bcbs-conversations"
IAM_USER="bcbs-demo-user"

echo "=== BCBS Claims AI - AWS Setup ==="
echo "Region: ${REGION}"
echo ""

# 1. Create S3 Bucket
echo "--- Creating S3 Bucket: ${S3_BUCKET} ---"
if aws s3api head-bucket --bucket "${S3_BUCKET}" 2>/dev/null; then
    echo "Bucket ${S3_BUCKET} already exists, skipping"
else
    aws s3api create-bucket \
        --bucket "${S3_BUCKET}" \
        --region "${REGION}" \
        --create-bucket-configuration LocationConstraint="${REGION}" 2>/dev/null || \
    aws s3api create-bucket \
        --bucket "${S3_BUCKET}" \
        --region "${REGION}"
    echo "Created bucket: ${S3_BUCKET}"
fi

# 2. Create DynamoDB Table
echo ""
echo "--- Creating DynamoDB Table: ${DYNAMO_TABLE} ---"
if aws dynamodb describe-table --table-name "${DYNAMO_TABLE}" --region "${REGION}" 2>/dev/null; then
    echo "Table ${DYNAMO_TABLE} already exists, skipping"
else
    aws dynamodb create-table \
        --table-name "${DYNAMO_TABLE}" \
        --attribute-definitions \
            AttributeName=conversation_id,AttributeType=S \
            AttributeName=timestamp,AttributeType=S \
        --key-schema \
            AttributeName=conversation_id,KeyType=HASH \
            AttributeName=timestamp,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --region "${REGION}"
    echo "Created table: ${DYNAMO_TABLE}"
    echo "Waiting for table to become active..."
    aws dynamodb wait table-exists --table-name "${DYNAMO_TABLE}" --region "${REGION}"
    echo "Table is active"
fi

# 3. Enable Bedrock Claude access (manual step - just print instructions)
echo ""
echo "--- Bedrock Claude Access ---"
echo "NOTE: Bedrock model access must be enabled manually in the AWS Console."
echo "1. Go to: https://console.aws.amazon.com/bedrock/home#/modelaccess"
echo "2. Click 'Manage model access'"
echo "3. Enable 'Anthropic Claude 3.5 Sonnet'"
echo "4. Wait for approval (usually instant)"

# 4. Create IAM User with scoped permissions
echo ""
echo "--- Creating IAM User: ${IAM_USER} ---"
if aws iam get-user --user-name "${IAM_USER}" 2>/dev/null; then
    echo "User ${IAM_USER} already exists, skipping user creation"
else
    aws iam create-user --user-name "${IAM_USER}"
    echo "Created user: ${IAM_USER}"
fi

# Create/update policy
POLICY_DOC=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::${S3_BUCKET}",
                "arn:aws:s3:::${S3_BUCKET}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:DeleteItem",
                "dynamodb:BatchWriteItem"
            ],
            "Resource": "arn:aws:dynamodb:${REGION}:*:table/${DYNAMO_TABLE}"
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": "arn:aws:bedrock:${REGION}::foundation-model/anthropic.*"
        }
    ]
}
EOF
)

POLICY_ARN=$(aws iam create-policy \
    --policy-name "bcbs-demo-policy" \
    --policy-document "${POLICY_DOC}" \
    --query "Policy.Arn" \
    --output text 2>/dev/null || \
    aws iam list-policies --query "Policies[?PolicyName=='bcbs-demo-policy'].Arn" --output text)

aws iam attach-user-policy --user-name "${IAM_USER}" --policy-arn "${POLICY_ARN}" 2>/dev/null || true

# Create access key
echo ""
echo "--- Creating Access Keys ---"
KEYS=$(aws iam create-access-key --user-name "${IAM_USER}" --output json 2>/dev/null || echo "")
if [ -n "${KEYS}" ]; then
    ACCESS_KEY=$(echo "${KEYS}" | python3 -c "import sys,json;print(json.load(sys.stdin)['AccessKey']['AccessKeyId'])")
    SECRET_KEY=$(echo "${KEYS}" | python3 -c "import sys,json;print(json.load(sys.stdin)['AccessKey']['SecretAccessKey'])")

    echo ""
    echo "=== Add these to your .env file ==="
    echo "ENABLE_AWS=true"
    echo "AWS_ACCESS_KEY_ID=${ACCESS_KEY}"
    echo "AWS_SECRET_ACCESS_KEY=${SECRET_KEY}"
    echo "AWS_REGION=${REGION}"
    echo "S3_BUCKET=${S3_BUCKET}"
    echo "DYNAMODB_TABLE=${DYNAMO_TABLE}"
else
    echo "Access key already exists or couldn't be created."
    echo "If needed, delete old keys: aws iam list-access-keys --user-name ${IAM_USER}"
fi

echo ""
echo "=== Setup Complete ==="
echo "S3 Bucket: ${S3_BUCKET}"
echo "DynamoDB Table: ${DYNAMO_TABLE}"
echo "IAM User: ${IAM_USER}"
