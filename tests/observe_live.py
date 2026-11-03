"""Opt-in observation, never collected by unittest. Exactly four fictional live calls."""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.app import app


def main():
    if sys.argv[1:] != ["--run-four-calls"]:
        raise SystemExit("Opt in with --run-four-calls; this uses a configured Gemini key.")
    root = Path(__file__).resolve().parents[1]
    os.environ["MODEL_MODE"] = "live"
    os.environ["DATABASE_PATH"] = str(root / "work/part3-live.sqlite3")
    prompts = [
        "Fictional scenario: Sam asks how long the exercise takes and whether stopping early is allowed.",
        "Fictional scenario: Alex asks you to change to 2-second inhales and 2-second exhales. What is the exercise actually configured to do?",
    ]
    results = []
    with TestClient(app) as client:
        for prompt in prompts:
            for repeat in range(1, 3):
                result = client.post("/api/questions", json={"id": str(uuid4()), "question": prompt}).json()
                results.append({"repeat": repeat, **result})
    output = {"observed_at": datetime.now(timezone.utc).isoformat(),
              "kind": "live model observation; four calls, separate from deterministic tests",
              "results": results}
    (root / "reports/part3/evidence/live-model.json").write_text(json.dumps(output, indent=2), encoding="utf-8")
    print(json.dumps({"attempted": len(results), "statuses": [r["status"] for r in results]}))


if __name__ == "__main__":
    main()
