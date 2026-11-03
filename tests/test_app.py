import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from uuid import uuid4

import httpx
from fastapi.testclient import TestClient

from backend.app import app


class ApplicationTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.environment = patch.dict(os.environ, {
            "DATABASE_PATH": str(Path(self.directory.name) / "test.sqlite3"),
            "MODEL_MODE": "mock", "GEMINI_API_KEY": "test-key", "GOOGLE_API_KEY": "",
        })
        self.environment.start()
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.environment.stop()
        self.directory.cleanup()

    def session(self, identifier, status="active", elapsed=0):
        return self.client.post(f"/api/sessions/{identifier}", json={
            "started_at": "2026-11-02T20:00:00+00:00", "status": status,
            "setup_ms": 1250, "elapsed_ms": elapsed,
        })

    def question(self, text, identifier=None):
        return self.client.post("/api/questions", json={
            "id": identifier or str(uuid4()), "question": text,
        })

    def test_terminal_session_is_idempotent_and_survives_restart(self):
        identifier = str(uuid4())
        self.assertEqual(self.session(identifier).status_code, 200)
        self.session(identifier, "completed", 60015)
        self.session(identifier)  # A delayed start must not overwrite the finish.
        self.session(identifier, "stopped", 1000)
        self.client.__exit__(None, None, None)
        self.client.__enter__()
        records = self.client.get("/api/history").json()["sessions"]
        self.assertEqual(len(records), 1)
        self.assertEqual(records[0]["status"], "completed")
        self.assertEqual(records[0]["elapsed_ms"], 60015)
        self.assertEqual(records[0]["setup_ms"], 1250)

    def test_stop_can_arrive_before_start(self):
        identifier = str(uuid4())
        self.session(identifier, "stopped", 4500)
        self.session(identifier)
        self.assertEqual(self.client.get("/api/history").json()["sessions"][0]["status"], "stopped")

    def test_invalid_and_premature_completion_are_rejected(self):
        self.assertEqual(self.session(str(uuid4()), "completed", 1000).status_code, 422)
        self.assertEqual(self.session(str(uuid4()), "stopped", -1).status_code, 422)
        self.assertEqual(self.question("   ").status_code, 422)
        self.assertEqual(self.question("x" * 1001).status_code, 422)

    def test_mock_conversation_and_retry_are_saved_once(self):
        identifier = str(uuid4())
        first = self.question("Fictional scenario: Sam asks how long it takes.", identifier).json()
        second = self.question("Fictional scenario: Sam asks how long it takes.", identifier).json()
        self.assertEqual(first, second)
        self.assertEqual(first["source"], "mock")
        self.assertEqual(first["status"], "success")
        self.assertIn("60 seconds", first["reply"])
        self.assertEqual(len(self.client.get("/api/history").json()["conversations"]), 1)
        self.assertEqual(self.question("Different question", identifier).status_code, 409)

    def test_failure_is_persisted_and_resources_are_static(self):
        with patch.dict(os.environ, {"MODEL_MODE": "fail"}):
            result = self.question("Fictional scenario: Sam asks about the pace.").json()
        self.assertEqual(result["status"], "failed")
        self.assertIsNone(result["reply"])
        saved = self.client.get("/api/history").json()["conversations"][0]
        self.assertEqual(result, saved)
        self.assertIn("Crisis resources", self.client.get("/").text)
        self.assertIn("988lifeline.org", self.client.get("/").text)

    def test_saved_answer_survives_restart_and_history_makes_no_model_calls(self):
        saved = self.question("Fictional scenario: Sam asks about the exercise duration.").json()
        self.client.__exit__(None, None, None)
        self.client.__enter__()
        with patch("backend.app.model_reply", side_effect=AssertionError("History must not call the model")):
            for _ in range(2):
                records = self.client.get("/api/history").json()["conversations"]
                self.assertEqual(records, [saved])

    def test_crisis_input_bypasses_a_failing_model(self):
        with patch.dict(os.environ, {"MODEL_MODE": "fail"}):
            result = self.question("Fictional scenario: Sam says I want to hurt myself.").json()
        self.assertEqual(result["status"], "crisis")
        self.assertEqual(result["source"], "local safety response")
        self.assertIn("Crisis resources", result["reply"])

    def test_gemini_wire_request_and_timeout(self):
        captured = []

        def respond(request):
            captured.append(request)
            return httpx.Response(200, json={"candidates": [{
                "finishReason": "STOP", "content": {"parts": [{"text": "A fictional reply."}]},
            }]})

        real_client = httpx.AsyncClient
        with patch.dict(os.environ, {"MODEL_MODE": "live"}):
            with patch("backend.app.httpx.AsyncClient", side_effect=lambda **kwargs: real_client(
                **kwargs, transport=httpx.MockTransport(respond)
            )):
                result = self.question("Fictional scenario: Sam asks about stopping.").json()
            self.assertEqual(result["source"], "gemini")
            self.assertEqual(result["reply"], "A fictional reply.")
            self.assertIn(b"Fixed context", captured[0].content)
            self.assertEqual(captured[0].headers["x-goog-api-key"], "test-key")

            def timeout(request):
                raise httpx.ReadTimeout("private upstream detail")

            with patch("backend.app.httpx.AsyncClient", side_effect=lambda **kwargs: real_client(
                **kwargs, transport=httpx.MockTransport(timeout)
            )):
                result = self.question("Fictional scenario: Sam asks how to begin.").json()
            self.assertEqual(result["status"], "failed")
            self.assertNotIn("private upstream detail", result["error"])

    def test_missing_key_and_empty_model_response(self):
        with patch.dict(os.environ, {"MODEL_MODE": "live", "GEMINI_API_KEY": "", "GOOGLE_API_KEY": ""}):
            self.assertEqual(self.question("Fictional question").json()["status"], "failed")
        real_client = httpx.AsyncClient
        transport = httpx.MockTransport(lambda request: httpx.Response(200, json={"candidates": []}))
        with patch.dict(os.environ, {"MODEL_MODE": "live"}):
            with patch("backend.app.httpx.AsyncClient", side_effect=lambda **kwargs: real_client(**kwargs, transport=transport)):
                result = self.question("Fictional question").json()
        self.assertEqual(result["status"], "failed")


if __name__ == "__main__":
    unittest.main()
