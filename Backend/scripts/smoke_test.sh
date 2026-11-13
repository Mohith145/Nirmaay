#!/usr/bin/env bash
# Needs a running server with seeded data:  python scripts/reset_demo.py && uvicorn app.main:app
# Usage: BASE_URL=http://localhost:8000 DEMO_PASSWORD=demo-password bash scripts/smoke_test.sh
set -u
BASE="${BASE_URL:-http://localhost:8000}"
PW="${DEMO_PASSWORD:-demo-password}"
FAIL=0
json() { python3 -c "import sys,json;d=json.load(sys.stdin);print($1)"; }
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
check() { if [ "$2" = "$3" ]; then echo "PASS $1"; else echo "FAIL $1 (got $2, want $3)"; FAIL=1; fi; }
login() { curl -s -X POST "$BASE/auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"$PW\"}" | json "d['access_token']"; }
post() { curl -s -X POST "$BASE$1" -H "Authorization: Bearer $2" -H 'Content-Type: application/json' -d "$3"; }

check "health" "$(code "$BASE/health")" 200
PT=$(login patient@demo.nirmay.test); DT=$(login doctor@demo.nirmay.test)
check "patient token rejected on doctor queue" "$(code "$BASE/clinician/queue" -H "Authorization: Bearer $PT")" 403
check "no token rejected" "$(code "$BASE/clinician/queue")" 401
check "intake blocked before consent" "$(code -X POST "$BASE/intakes" -H "Authorization: Bearer $PT" -H 'Content-Type: application/json' -d '{"age":50,"tobacco":"none"}')" 403

CID=$(post /consents "$PT" '{}' | json "d['id']")
INTAKE=$(post /intakes "$PT" '{"age":52,"tobacco":"smokeless","tobacco_years":15,"betel_quid":true}')
echo "$INTAKE" | json "d['risk_level'] + ' | ' + d['disclaimer']"
IID=$(echo "$INTAKE" | json "d['id']")
SYM=$(post /symptoms/check "$PT" '{"symptoms":["non_healing_ulcer"],"duration_days":30}')
SID=$(echo "$SYM" | json "d['id']")
EM=$(post /symptoms/check "$PT" '{"heavy_bleeding":true}' | json "d['emergency']")
check "emergency rule fires" "$EM" True
CASE=$(post /cases "$PT" "{\"intake_id\":$IID,\"symptom_id\":$SID}" | json "d['id']")

check "doctor sees queue" "$(code "$BASE/clinician/queue" -H "Authorization: Bearer $DT")" 200
check "handoff for doctor" "$(code "$BASE/cases/$CASE/handoff" -H "Authorization: Bearer $DT")" 200
check "override without reason rejected" "$(code -X POST "$BASE/clinician/cases/$CASE/review" -H "Authorization: Bearer $DT" -H 'Content-Type: application/json' -d '{"decision":"override","final_urgency":"urgent"}')" 422
check "override with reason accepted" "$(code -X POST "$BASE/clinician/cases/$CASE/review" -H "Authorization: Bearer $DT" -H 'Content-Type: application/json' -d '{"decision":"override","reason":"Seen in clinic, lesion looks worse","final_urgency":"urgent"}')" 201
ROOM=$(post /appointments "$DT" "{\"case_id\":$CASE}" | json "d['room_id']")
check "jitsi room id format" "${ROOM:0:7}" "nirmay-"

curl -s -o /dev/null -X DELETE "$BASE/consents/$CID" -H "Authorization: Bearer $PT"
check "processing blocked after withdrawal" "$(code -X POST "$BASE/intakes" -H "Authorization: Bearer $PT" -H 'Content-Type: application/json' -d '{"age":50,"tobacco":"none"}')" 403

[ $FAIL -eq 0 ] && echo "ALL PASSED. Run python scripts/reset_demo.py to restore seed data." || { echo "SOME FAILED"; exit 1; }
