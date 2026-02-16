#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:5001}"
LOGIN_EMAIL="${LOGIN_EMAIL:-qaadmin50702403@example.com}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-string}"
REQUESTS="${REQUESTS:-150}"
CONCURRENCY="${CONCURRENCY:-20}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required."
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required."
  exit 1
fi

RESULT_DIR="${RESULT_DIR:-/tmp/crm_perf_results}"
mkdir -p "$RESULT_DIR"

timestamp="$(date +%Y%m%d_%H%M%S)"
result_file="$RESULT_DIR/perf_${timestamp}.txt"

cat <<EOF
CRM Perf Check
- Base URL: $BASE_URL
- Login: $LOGIN_EMAIL
- Requests per endpoint: $REQUESTS
- Concurrency: $CONCURRENCY
- Result file: $result_file
EOF

login_payload="$(jq -nc \
  --arg email "$LOGIN_EMAIL" \
  --arg pass "$LOGIN_PASSWORD" \
  '{strEmailId:$email,strPassword:$pass,bolIsForce:true}')"

login_response="$(curl -sS \
  -H 'Content-Type: application/json' \
  -X POST "$BASE_URL/api/Auth/login" \
  -d "$login_payload")"

token="$(printf '%s' "$login_response" | jq -r '.data.Token // empty')"
if [[ -z "$token" ]]; then
  echo "Login failed. Response:"
  echo "$login_response"
  exit 1
fi

echo "Authenticated successfully." | tee -a "$result_file"

declare -a ENDPOINTS=(
  "/api/crm/status"
  "/api/crm/pipelines"
  "/api/crm/leads?PageNumber=1&PageSize=50"
  "/api/crm/contacts?PageNumber=1&PageSize=50"
  "/api/crm/accounts?PageNumber=1&PageSize=50"
  "/api/crm/opportunities?PageNumber=1&PageSize=50"
  "/api/crm/activities?PageNumber=1&PageSize=50"
  "/api/crm/lead-analytics/dashboard"
  "/api/crm/dashboard"
  "/api/crm/dashboard/kpis"
  "/api/crm/dashboard/charts"
)

percentile() {
  local pct="$1"
  local total="$2"
  local file="$3"
  local idx=$(( (pct * total + 99) / 100 ))
  if (( idx < 1 )); then idx=1; fi
  if (( idx > total )); then idx="$total"; fi
  awk -v idx="$idx" 'NR==idx {printf "%.4f", $2}' "$file"
}

run_smoke() {
  local path="$1"
  local status
  status="$(curl -sS -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $token" \
    "$BASE_URL$path")"
  echo "$path|$status" | tee -a "$result_file"
  if [[ "$status" != "200" ]]; then
    return 1
  fi
}

run_load() {
  local path="$1"
  local safe_name
  safe_name="$(echo "$path" | tr '/?&=' '_' | tr -s '_' | sed 's/^_//; s/_$//')"
  local raw_file="$RESULT_DIR/raw_${safe_name}_${timestamp}.txt"
  local sorted_file="$RESULT_DIR/sorted_${safe_name}_${timestamp}.txt"

  local start_sec end_sec elapsed_sec
  start_sec="$(date +%s)"

  export PERF_BASE_URL="$BASE_URL"
  export PERF_PATH="$path"
  export PERF_TOKEN="$token"

  seq "$REQUESTS" | xargs -P "$CONCURRENCY" -I{} bash -c \
    'curl -sS -o /dev/null -w "%{http_code} %{time_total}\n" -H "Authorization: Bearer $PERF_TOKEN" "$PERF_BASE_URL$PERF_PATH"' \
    > "$raw_file"

  end_sec="$(date +%s)"
  elapsed_sec=$(( end_sec - start_sec ))
  if (( elapsed_sec < 1 )); then elapsed_sec=1; fi

  local total ok err avg p50 p95 p99 throughput
  total="$(wc -l < "$raw_file" | tr -d ' ')"
  ok="$(awk '$1 ~ /^2/ {c++} END {print c+0}' "$raw_file")"
  err=$(( total - ok ))
  avg="$(awk '{sum+=$2} END { if (NR==0) {printf "0.0000"} else {printf "%.4f", sum/NR} }' "$raw_file")"

  sort -k2,2n "$raw_file" > "$sorted_file"
  p50="$(percentile 50 "$total" "$sorted_file")"
  p95="$(percentile 95 "$total" "$sorted_file")"
  p99="$(percentile 99 "$total" "$sorted_file")"
  throughput="$(awk -v t="$total" -v s="$elapsed_sec" 'BEGIN {printf "%.2f", t/s}')"

  echo "LOAD|$path|total=$total|ok=$ok|errors=$err|throughput_rps=$throughput|avg_s=$avg|p50_s=$p50|p95_s=$p95|p99_s=$p99" \
    | tee -a "$result_file"
}

echo "Smoke checks..." | tee -a "$result_file"
for ep in "${ENDPOINTS[@]}"; do
  if ! run_smoke "$ep"; then
    echo "Smoke check failed for $ep. Aborting load test." | tee -a "$result_file"
    exit 2
  fi
done

echo "Load checks..." | tee -a "$result_file"
for ep in "${ENDPOINTS[@]}"; do
  run_load "$ep"
done

echo "Done. Consolidated output: $result_file"
