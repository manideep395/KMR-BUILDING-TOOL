import urllib.request
import urllib.error
import json

data = {
    "project_name": "Test Project",
    "project_type": "Residential",
    "city": "Mumbai",
    "state": "Maharashtra",
    "area_sqft": 1000,
    "floors": 2,
    "quality_grade": "Standard",
    "budget": 5000000,
    "start_date": "2025-04-01",
    "end_date": "2026-04-01",
    "optimization_priority": "Balanced",
    "currency": "INR"
}

req = urllib.request.Request(
    "http://localhost:8000/api/calculate",
    data=json.dumps(data).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
try:
    with urllib.request.urlopen(req) as res:
        print("STATUS", res.status)
        body = json.loads(res.read().decode('utf-8'))
        print("Total Cost: ₹", body.get("total_project_cost", "N/A"))
        print("Cost/sqft: ₹", body.get("cost_per_sqft", "N/A"))
except urllib.error.HTTPError as e:
    print("ERROR STATUS", e.code)
    print("ERROR RESPONSE", e.read().decode('utf-8'))
except Exception as e:
    print("ERROR", str(e))
