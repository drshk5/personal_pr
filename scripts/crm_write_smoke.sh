#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:5001}"
LOGIN_EMAIL="${LOGIN_EMAIL:-qaadmin50702403@example.com}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-string}"
RESULT_DIR="${RESULT_DIR:-/tmp/crm_write_smoke}"

mkdir -p "$RESULT_DIR"
ts="$(date +%Y%m%d_%H%M%S)"
run_dir="$RESULT_DIR/run_$ts"
mkdir -p "$run_dir"

for cmd in curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required tool: $cmd"
    exit 1
  fi
done

login_payload="$(jq -nc --arg e "$LOGIN_EMAIL" --arg p "$LOGIN_PASSWORD" \
  '{strEmailId:$e,strPassword:$p,bolIsForce:true}')"
login_resp="$(curl -sS -H 'Content-Type: application/json' -X POST "$BASE_URL/api/Auth/login" -d "$login_payload")"
echo "$login_resp" > "$run_dir/login.json"

token="$(echo "$login_resp" | jq -r '.data.Token // empty')"
if [[ -z "$token" ]]; then
  echo "Login failed. See $run_dir/login.json"
  exit 2
fi

auth_header=(-H "Authorization: Bearer $token")

curl -sS "${auth_header[@]}" "$BASE_URL/api/crm/pipelines" > "$run_dir/pipelines.json"
pipeline_id="$(jq -r '.data[0].strPipelineGUID // empty' "$run_dir/pipelines.json")"
if [[ -z "$pipeline_id" ]]; then
  echo "No pipeline found. See $run_dir/pipelines.json"
  exit 3
fi

curl -sS "${auth_header[@]}" "$BASE_URL/api/crm/pipelines/$pipeline_id" > "$run_dir/pipeline_detail.json"
stage_id="$(jq -r '[.data.Stages[]? | select((.bolIsWonStage|not) and (.bolIsLostStage|not))][0].strStageGUID // .data.Stages[0].strStageGUID // empty' "$run_dir/pipeline_detail.json")"
if [[ -z "$stage_id" ]]; then
  echo "No stage found. See $run_dir/pipeline_detail.json"
  exit 4
fi

suffix="$(date +%s)"

account_payload="$(jq -nc --arg n "SMOKE Account $suffix" --arg e "smoke.account.$suffix@example.com" \
  '{strAccountName:$n,strIndustry:"Technology",strEmail:$e,strPhone:"+919999999999",strCountry:"India"}')"
acc_status="$(curl -sS -o "$run_dir/account_create.json" -w "%{http_code}" "${auth_header[@]}" \
  -H 'Content-Type: application/json' -X POST "$BASE_URL/api/crm/accounts" -d "$account_payload")"
account_id="$(jq -r '.data.strAccountGUID // empty' "$run_dir/account_create.json")"
if [[ -z "$account_id" ]]; then
  echo "account_id missing from create response. See $run_dir/account_create.json"
  exit 6
fi

contact_payload="$(jq -nc --arg id "$account_id" --arg e "smoke.contact.$suffix@example.com" \
  '{strAccountGUID:$id,strFirstName:"Smoke",strLastName:"Contact",strEmail:$e,strLifecycleStage:"Customer"}')"
con_status="$(curl -sS -o "$run_dir/contact_create.json" -w "%{http_code}" "${auth_header[@]}" \
  -H 'Content-Type: application/json' -X POST "$BASE_URL/api/crm/contacts" -d "$contact_payload")"
contact_id="$(jq -r '.data.strContactGUID // empty' "$run_dir/contact_create.json")"
if [[ -z "$contact_id" ]]; then
  echo "contact_id missing from create response. See $run_dir/contact_create.json"
  exit 7
fi

lead_payload="$(jq -nc --arg e "smoke.lead.$suffix@example.com" \
  '{strFirstName:"Smoke",strLastName:"Lead",strEmail:$e,strCompanyName:"Smoke Co",strSource:"Website"}')"
lead_status="$(curl -sS -o "$run_dir/lead_create.json" -w "%{http_code}" "${auth_header[@]}" \
  -H 'Content-Type: application/json' -X POST "$BASE_URL/api/crm/leads" -d "$lead_payload")"
lead_id="$(jq -r '.data.strLeadGUID // empty' "$run_dir/lead_create.json")"
if [[ -z "$lead_id" ]]; then
  echo "lead_id missing from create response. See $run_dir/lead_create.json"
  exit 8
fi

opp_payload="$(jq -nc --arg n "SMOKE Opp $suffix" --arg aid "$account_id" --arg pid "$pipeline_id" --arg sid "$stage_id" --arg cid "$contact_id" \
  '{strOpportunityName:$n,strAccountGUID:$aid,strPipelineGUID:$pid,strStageGUID:$sid,dblAmount:150000,strCurrency:"INR",Contacts:[{strContactGUID:$cid,strRole:"Decision Maker",bolIsPrimary:true}]}' )"
opp_status="$(curl -sS -o "$run_dir/opportunity_create.json" -w "%{http_code}" "${auth_header[@]}" \
  -H 'Content-Type: application/json' -X POST "$BASE_URL/api/crm/opportunities" -d "$opp_payload")"
opp_id="$(jq -r '.data.strOpportunityGUID // empty' "$run_dir/opportunity_create.json")"
if [[ -z "$opp_id" ]]; then
  echo "opportunity_id missing from create response. See $run_dir/opportunity_create.json"
  exit 9
fi

activity_payload="$(jq -nc --arg aid "$account_id" --arg oid "$opp_id" --arg lid "$lead_id" --arg cid "$contact_id" \
  '{strActivityType:"Call",strSubject:"Smoke activity",strDescription:"Write smoke activity",Links:[{strEntityType:"Account",strEntityGUID:$aid},{strEntityType:"Opportunity",strEntityGUID:$oid},{strEntityType:"Lead",strEntityGUID:$lid},{strEntityType:"Contact",strEntityGUID:$cid}]}' )"
act_status="$(curl -sS -o "$run_dir/activity_create.json" -w "%{http_code}" "${auth_header[@]}" \
  -H 'Content-Type: application/json' -X POST "$BASE_URL/api/crm/activities" -d "$activity_payload")"
act_id="$(jq -r '.data.strActivityGUID // empty' "$run_dir/activity_create.json")"
if [[ -z "$act_id" ]]; then
  echo "activity_id missing from create response. See $run_dir/activity_create.json"
  exit 10
fi

acc_get="$(curl -sS -o "$run_dir/account_get.json" -w "%{http_code}" "${auth_header[@]}" "$BASE_URL/api/crm/accounts/$account_id")"
con_get="$(curl -sS -o "$run_dir/contact_get.json" -w "%{http_code}" "${auth_header[@]}" "$BASE_URL/api/crm/contacts/$contact_id")"
lead_get="$(curl -sS -o "$run_dir/lead_get.json" -w "%{http_code}" "${auth_header[@]}" "$BASE_URL/api/crm/leads/$lead_id")"
opp_get="$(curl -sS -o "$run_dir/opp_get.json" -w "%{http_code}" "${auth_header[@]}" "$BASE_URL/api/crm/opportunities/$opp_id")"
act_get="$(curl -sS -o "$run_dir/act_get.json" -w "%{http_code}" "${auth_header[@]}" "$BASE_URL/api/crm/activities/$act_id")"
dash_get="$(curl -sS -o "$run_dir/dashboard.json" -w "%{http_code}" "${auth_header[@]}" "$BASE_URL/api/crm/dashboard")"

summary="$run_dir/summary.txt"
{
  echo "run_dir=$run_dir"
  echo "pipeline_id=$pipeline_id"
  echo "stage_id=$stage_id"
  echo "account_create=$acc_status id=$account_id"
  echo "contact_create=$con_status id=$contact_id"
  echo "lead_create=$lead_status id=$lead_id"
  echo "opportunity_create=$opp_status id=$opp_id"
  echo "activity_create=$act_status id=$act_id"
  echo "account_get=$acc_get"
  echo "contact_get=$con_get"
  echo "lead_get=$lead_get"
  echo "opportunity_get=$opp_get"
  echo "activity_get=$act_get"
  echo "dashboard_get=$dash_get"
} | tee "$summary"

non_2xx=0
for code in "$acc_status" "$con_status" "$lead_status" "$opp_status" "$act_status" "$acc_get" "$con_get" "$lead_get" "$opp_get" "$act_get" "$dash_get"; do
  if [[ "$code" != 2* ]]; then
    non_2xx=$((non_2xx + 1))
  fi
done

if (( non_2xx > 0 )); then
  echo "Write smoke FAILED ($non_2xx non-2xx responses). See $run_dir"
  exit 5
fi

echo "Write smoke PASSED. See $run_dir"
