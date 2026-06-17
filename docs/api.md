# API Reference

This document provides a detailed description of the GraphStation Backend API.

## Base URL

The base URL depends on your deployment:

- **Local Development:** `http://localhost:5000`
- **Synology NAS (Web Station):** `http://<nas-ip>/graphstation-api`
- **Docker Deployment:** `http://<target-ip>:5000`

---

## Authentication

GraphStation uses Synology DSM session cookies for authentication.

### Login

Authenticates a user against the Synology NAS.

- **Endpoint:** `/login`
- **Method:** `POST`
- **Payload (JSON):**
  | Field | Type | Description |
  |---|---|---|
  | `account` | string | The DSM username |
  | `passwd` | string | The DSM password |
  | `otp_code` | string | (Optional) 2FA code if enabled on NAS |

- **Success Response:** Returns the JSON response from Synology's `SYNO.API.Auth`. A successful login will set a `sid` cookie in the browser.
- **Error Response:** `400 Bad Request` for missing credentials, or `500 Internal Server Error` if the NAS is unreachable.

---

## Error Responses

All error responses follow this standard format:

| Field     | Type   | Description                                                  |
| --------- | ------ | ------------------------------------------------------------ |
| `error`   | string | A short error identifier (e.g., `UNAUTHORIZED`, `NOT_FOUND`) |
| `message` | string | A human-readable error message                               |

**Example Error Response (401 Unauthorized):**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or expired session cookie."
}
```

**Example Error Response (404 Not Found):**

```json
{
  "error": "NOT_FOUND",
  "message": "The requested photo ID does not exist."
}
```

---

## Endpoints

### Health Check

Checks if the backend service is running.

- **Endpoint:** `/health`
- **Method:** `GET`
- **Success Response:** `200 OK` with `{"status": "ok", "message": "..."}`

### Filters

Retrieves available metadata filters (Families, Persons, Countries) for the logged-in user.

- **Endpoint:** `/filters`
- **Method:** `GET`
- **Authentication Required:** Yes (via `sid` cookie)
- **Success Response:** `200 OK`
  ```json
  {
    "families": ["Smith", "Doe"],
    "persons": ["John", "Jane"],
    "countries": ["Germany", "USA"]
  }
  ```

### Photos

Retrieves a list of photos owned by the logged-in user.

- **Endpoint:** `/photos`
- **Method:** `GET`
- **Authentication Required:** Yes (via `sid` cookie)
- **Query Parameters:**
  | Parameter | Type | Description |
  |---|---|---|
  | `family` | string | Filter by family name |
  | `person` | string | Filter by person name |
  | `country` | string | Filter by country name |

- **Success Response:** `200 OK`
  ```json
  {
    "owner": "username",
    "photos": [
      { "id": 1, "cache_key": "...", "takentime": 1623456789 },
      ...
    ]
  }
  ```

**Note on Data Types:**

- `id`: Integer (unique photo identifier)
- `cache_key`: String (used for thumbnail fetching)
- `takentime`: Integer (Unix timestamp in seconds)

### Photo Details

Retrieves metadata for a specific photo.

- **Endpoint:** `/photo/<photo_id>/details`
- **Method:** `GET`
- **Authentication Required:** Yes (via `sid` cookie)
- **Success Response:** `200 OK`
  ```json
  {
    "persons_in_photo": ["John"],
    "families": [{ "name": "Smith", "members": ["John", "Jane"] }]
  }
  ```

### Grouped Photos

Retrieves photos grouped by a specific metadata field.

- **Endpoint:** `/photos/grouped`
- **Method:** `GET`
- **Authentication Required:** Yes (via `sid` cookie)
- **Query Parameters:**
  | Parameter | Type | Description | Default |
  |---|---|---|---|
  | `by` | string | Grouping field: `family`, `person`, or `location` | `family` |

- **Success Response:** `200 OK`
  ```json
  [
    {
      "group_name": "Smith",
      "photos": [ { "id": 1, "cache_key": "...", "takentime": ... }, ... ]
    },
    ...
  ]
  ```

### Graph Data

Retrieves a small subset of the photo graph for visualization.

- **Endpoint:** `/graph`
- **Method:** `GET`
- **Authentication Required:** Yes (via `sid` cookie)
- **Query Parameters:**
  | Parameter | Type | Description | Default |
  |---|---|---|---|
  | `limit` | integer | Number of photos to include in the graph | `20` |

- **Success Response:** `200 OK`
  ```json
  {
    "nodes": [
      { "id": "photo_1", "label": "IMG_123.jpg", "type": "Photo", ... },
      { "id": "person_2", "label": "John", "type": "Person", ... }
    ],
    "links": [
      { "source": "photo_1", "target": "person_2", "type": "HAS_PERSON" }
    ]
  }
  ```
