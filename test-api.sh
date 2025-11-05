#!/bin/bash
# Quick integration test for the codematic API
# Make sure the server and worker are running before running this script.

set -e

API_BASE="http://localhost:3000"
API_KEY="test-api-key-12345"  # Update with actual key if auth is enforced

echo "=== Codematic API Integration Test ==="
echo ""

# Test 1: Register a repository
echo "1. Registering a test repository..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/v1/repo/register" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "repoUrl": "https://github.com/example/test-repo",
    "token": "test-token-secret",
    "branch": "main",
    "userId": "test-user-123"
  }')

echo "Response: $REGISTER_RESPONSE"
REPO_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"repoId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$REPO_ID" ]; then
  echo "❌ Failed to register repository (no repoId returned)"
  exit 1
fi

echo "✅ Repository registered with ID: $REPO_ID"
echo ""

# Test 2: Trigger a compliance scan
echo "2. Triggering compliance scan for $REPO_ID..."
SCAN_RESPONSE=$(curl -s -X POST "$API_BASE/v1/checks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"repoId\": \"$REPO_ID\",
    \"commitHash\": \"latest\"
  }")

echo "Response: $SCAN_RESPONSE"
JOB_ID=$(echo "$SCAN_RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
  echo "❌ Failed to trigger scan (no jobId returned)"
  exit 1
fi

echo "✅ Scan queued with Job ID: $JOB_ID"
echo ""

# Test 3: Check scan status
echo "3. Checking scan status for $JOB_ID..."
sleep 2  # Give worker a moment to pick up the job
STATUS_RESPONSE=$(curl -s -X GET "$API_BASE/v1/checks/$JOB_ID" \
  -H "Authorization: Bearer $API_KEY")

echo "Response: $STATUS_RESPONSE"
echo "✅ Status check complete"
echo ""

# Test 4: Webhook simulation (optional)
echo "4. Simulating webhook callback..."
WEBHOOK_RESPONSE=$(curl -s -X POST "$API_BASE/v1/webhooks/github" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{
    "repository": {
      "full_name": "example/test-repo"
    },
    "head_commit": {
      "id": "abc123def456"
    }
  }')

echo "Response: $WEBHOOK_RESPONSE"
echo "✅ Webhook processed"
echo ""

echo "=== All tests completed ==="
echo ""
echo "Summary:"
echo "  - Repo ID: $REPO_ID"
echo "  - Job ID: $JOB_ID"
echo ""
echo "Next steps:"
echo "  - Check worker logs to see job processing"
echo "  - Query Firestore to see saved compliance reports"
echo "  - Monitor Redis queue: redis-cli LLEN bull:compliance-checks:wait"
