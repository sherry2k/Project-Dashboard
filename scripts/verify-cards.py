#!/usr/bin/env python3
"""
Verifies that every stat card on the dashboard header returns the COMPLETE
list of projects it counts, and that the notification feed reports changes
made by other users.

Usage:
    python3 scripts/verify-cards.py [base_url] [cookie_jar]
"""
import json
import subprocess
import sys
import urllib.parse

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"
JAR = sys.argv[2] if len(sys.argv) > 2 else "/tmp/alice.jar"

# card key -> query string that the dashboard sends when the card is clicked
CARD_QUERY = {
    "total": "",
    "active": "activeOnly=true",
    "permitIssued": "status=" + urllib.parse.quote("Permit Issued"),
    "waitingOwner": "status=" + urllib.parse.quote("Waiting Owner"),
    "waitingSoilReport": "status=" + urllib.parse.quote("Waiting Soil Report"),
    "waitingTender": "status=" + urllib.parse.quote("Waiting Tender"),
    "waitingPayment": "noc=" + urllib.parse.quote("Waiting Payment"),
    "projectCancelled": "status=" + urllib.parse.quote("Project Cancelled"),
    "completed": "status=" + urllib.parse.quote("Completed"),
    "inProgress": "status=" + urllib.parse.quote("In Progress"),
}


def get(path):
    out = subprocess.run(
        ["curl", "-s", "--max-time", "60", "-b", JAR, f"{BASE}{path}"],
        capture_output=True, text=True,
    ).stdout
    return json.loads(out)


def main():
    base = get("/api/projects")
    stats = base["stats"]

    print(f"{'CARD':<20}{'CARD COUNT':>12}{'ROWS SHOWN':>12}   RESULT")
    print("-" * 58)

    failures = 0
    for key, query in CARD_QUERY.items():
        expected = stats[key]
        rows = len(get(f"/api/projects?{query}")["projects"])
        ok = rows == expected
        if not ok:
            failures += 1
        print(f"{key:<20}{expected:>12}{rows:>12}   {'PASS' if ok else 'FAIL'}")

    print("-" * 58)

    # Notifications feed must expose changes and flag other users' edits
    notif = get("/api/notifications?limit=50")
    items = notif.get("notifications", [])
    print(f"notifications returned : {len(items)}")
    print(f"by other users         : {sum(1 for n in items if n['byOther'])}")
    if not items:
        failures += 1
        print("FAIL: expected at least one notification")

    required = {"id", "projectId", "projectNo", "field", "editedBy", "createdAt", "byOther"}
    if items and not required.issubset(items[0]):
        failures += 1
        print(f"FAIL: notification missing keys {required - set(items[0])}")

    print("\n" + ("ALL CHECKS PASSED" if failures == 0 else f"{failures} CHECK(S) FAILED"))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
