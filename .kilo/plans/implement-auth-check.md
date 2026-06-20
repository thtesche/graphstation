# Plan: Implement Authentication Validity Check (checkauth)

## Context
Currently, the application relies on local cookies and a backend cache to manage sessions. However, it does not proactively verify if the Synology session (`sid`) is still valid on the NAS itself. This can lead to a poor user experience if the session expires on the NAS but the frontend still thinks it is logged in.

## Goals
Implement a mechanism to verify the validity of the Synology authentication session using the `checkauth` method.

## Implementation Plan

### 1. Backend: Add `/checkauth` endpoint
- **File**: `backend/main.py`
- **Task**: Create a new route `@app.route('/checkauth', methods=['GET', 'POST'])`.
- **Logic**:
    1. Extract `sid` from request cookies.
    2. If no `sid`, return `401 Unauthorized`.
    3. Check local cache via `get_user_from_sid(sid)`. If not found, return `401`.
    4. Construct a payload for Synology:
       - `api=SYNO.API.Auth`
       - `version=6`
       - `method=checkauth`
       - `_sid={sid}`
    5. Perform a `GET` request to `{synology_url}/webapi/auth.cgi` with the payload as query parameters.
    6. Return the JSON response from Synology to the frontend.

### 2. Frontend: Update `useAuth` hook
- **File**: `frontend/src/hooks/useAuth.js`
- **Task**: Add a `checkAuth` function to the returned object of `useAuth`.
- **Logic**:
    1. Perform a `fetch` to `${apiBase}/checkauth`.
    2. If the response indicates an invalid session (e.g., `success: false` or `401`), trigger a logout/cleanup.

### 3. Frontend: Integrate into `App.jsx`
- **File**: `frontend/src/App.jsx`
- **Task**: Call `checkAuth` when the application mounts (`useEffect`).
- **Logic**:
    1. On mount, if `authData.sid` exists, call `checkAuth()`.
    2. If `checkAuth()` fails, clear local auth state and redirect to login.

## Validation Plan
- **Scenario 1: Valid Session**: App loads, `checkAuth` returns `success: true`, user stays on the dashboard.
- **Scenario 2: Expired Session (NAS)**: App loads, `checkAuth` returns `success: false`, user is redirected to login.
- **Scenario 3: No Session**: App loads, no `sid` in cookies, user is shown the login form.
- **Scenario 4: Expired Local Cache**: `checkAuth` returns `401` from backend, user is redirected to login.
