# Assignment 3 Part 3 Report

Repository: [mental-health-app](https://github.com/dw477/mental-health-app)

Commit: [3a873427a75273d77a4a8eb02ba78ab6e56a494f](https://github.com/dw477/mental-health-app/commit/3a873427a75273d77a4a8eb02ba78ab6e56a494f)

- [README](https://github.com/dw477/mental-health-app/blob/main/docs/README.md)
- [Evaluation](https://github.com/dw477/mental-health-app/blob/main/reports/part3/evaluation.md)

Demonstrations:
- [Successful Session](https://github.com/dw477/mental-health-app/blob/main/reports/part3/recording-session-success.mp4)
- [Overall Testing](https://github.com/dw477/mental-health-app/blob/main/reports/part3/recording-testing-features.mp4)

## Application and design

The Vue, FastAPI and SQLite application provides one paced breathing exercise. A 4 second inhale and 6 second exhale for six cycles. Stopping and crisis resources are available. The optional model explains the fixed exercise. Questions, replies and session outcomes are saved in SQLite and shown in history. 

Part 1 proposed a questionnaire, profile information and adjustable duration. The implementation uses 60 seconds (R1) and avoids required disclosure or setup (D3). Part 3 adds "reopen my last answer", using existing history to reduce repeated typing (D5). It is optional, and the user can ask something new, stop or leave (R4).

The shortcut shows the latest successful answer with its original question, date and source while preserving a new draft. Reopening copies the saved record into the displayed answer without making another model request. This saves effort but can resurface an answer the user no longer wants.

## Verification

The linked evaluation records fifteen fictional scenarios and three behavior checks: fixed timing with separate setup, independent crisis/exit controls, and saved-answer reuse after restart without another model call.

A fresh checkout with a new virtual environment installed the pinned requirements, ran in mock mode using the README, and passed the tests. Crisis resources also opened after model failure and with the server stopped after page load.

Four live Gemini observations used two fictional prompts twice each. All four retained the fixed pace, six cycles, 60 second duration, and permission to stop. Wording and additional context varied. These live observations are separate from the mocked checks.

## Finding and limitation

A surprising Part 2 finding was 98.512 seconds of setup for an exercise stopped after 3.255 seconds. The setup clock had included time from a previous session. Resetting readiness when an exercise ends or the user returns to Breathe corrected this.