#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:5001}"
LOGIN_EMAIL="${LOGIN_EMAIL:-qaadmin50702403@example.com}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-string}"
RESULT_DIR="${RESULT_DIR:-/tmp/crm_modules_smoke}"

mkdir -p "$RESULT_DIR"
ts="$(date +%Y%m%d_%H%M%S)"
out_file="$RESULT_DIR/modules_smoke_$ts.txt"

login_payload="$(jq -nc --arg e "$LOGIN_EMAIL" --arg p "$LOGIN_PASSWORD" \
  '{strEmailId:$e,strPassword:$p,bolIsForce:true}')"
login_resp="$(curl -sS -H 'Content-Type: application/json' -X POST "$BASE_URL/api/Auth/login" -d "$login_payload")"
token="$(echo "$login_resp" | jq -r '.data.Token // empty')"

if [[ -z "$token" ]]; then
  echo "Login failed" | tee "$out_file"
  echo "$login_resp" | tee -a "$out_file"
  exit 1
fi

declare -a ENDPOINTS=(
  "/api/crm/lead-scoring/rules?PageNumber=1&PageSize=5"
  "/api/crm/lead-assignment/rules?PageNumber=1&PageSize=5"
  "/api/crm/workflows/rules?PageNumber=1&PageSize=5"
  "/api/crm/workflows/executions?PageNumber=1&PageSize=5"
  "/api/crm/web-forms?PageNumber=1&PageSize=5"
  "/api/crm/communications?PageNumber=1&PageSize=5"
  "/api/crm/lead-duplicates/suggestions?PageNumber=1&PageSize=5"
  "/api/crm/lead-duplicates/merge-history?PageNumber=1&PageSize=5"
  "/api/crm/lead-analytics/dashboard"
  "/api/crm/lead-analytics/funnel"
  "/api/crm/lead-analytics/aging"
  "/api/crm/leads/import/jobs?PageNumber=1&PageSize=5"
)

non_2xx=0
echo "Advanced module smoke ($ts)" | tee "$out_file"
for ep in "${ENDPOINTS[@]}"; do
  code="$(curl -sS -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "$BASE_URL$ep")"
  echo "$ep|$code" | tee -a "$out_file"
  if [[ "$code" != 2* ]]; then
    non_2xx=$((non_2xx + 1))
  fi
done

if (( non_2xx > 0 )); then
  echo "FAILED: $non_2xx endpoints non-2xx. See $out_file" | tee -a "$out_file"
  exit 2
fi

echo "PASSED: all advanced module endpoints returned 2xx. See $out_file" | tee -a "$out_file"
