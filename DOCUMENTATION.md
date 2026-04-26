# API Documentation

This document provides detailed API documentation for the Content Broadcasting System, akin to an OpenAPI/Swagger specification.

## Base URL

All API routes are prefixed with `/api` except for system endpoints.

---

## 1. System Endpoints

### 1.1 Check Health

- **URL**: `/health`
- **Method**: `GET`
- **Auth Required**: No
- **Description**: Returns the health status of the API.

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Content Broadcast System is running",
  "timestamp": "2026-04-26T10:00:00.000Z",
  "environment": "development"
}
```

### 1.2 Root

- **URL**: `/`
- **Method**: `GET`
- **Auth Required**: No

**Response (200 OK)**:

```text
ACCESS BLOCKED
```

---

## 2. Authentication

### 2.1 Register User

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Registers a new user.

**Request Body** (`application/json`):

```json
{
  "name": "John Doe",
  "email": "john@school.edu",
  "password": "securepassword",
  "role": "TEACHER" // optional, defaults to STUDENT (or depends on schema)
}
```

**Response (201 Created)**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@school.edu",
    "role": "TEACHER"
  }
}
```

### 2.2 Login User

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Auth Required**: No
- **Description**: Authenticates a user and returns a JWT token.

**Request Body** (`application/json`):

```json
{
  "email": "john@school.edu",
  "password": "securepassword"
}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "token": "jwt.token.string"
}
```

---

## 3. Users

### 3.1 Get Profile

- **URL**: `/api/users/me`
- **Method**: `GET`
- **Auth Required**: Yes (Any valid JWT)
- **Description**: Retrieves the authenticated user's profile.

**Response (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@school.edu",
    "role": "TEACHER"
  }
}
```

### 3.2 List Teachers

- **URL**: `/api/users/teachers`
- **Method**: `GET`
- **Auth Required**: Yes (`PRINCIPAL` or `TEACHER`)
- **Description**: Returns a list of all users with the `TEACHER` role.

**Response (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Teacher Name",
      "email": "teacher@school.edu"
    }
  ]
}
```

---

## 4. Content (Teacher)

### 4.1 Upload Content

- **URL**: `/api/content/upload`
- **Method**: `POST`
- **Auth Required**: Yes (`TEACHER`)
- **Description**: Uploads new content for broadcasting.

**Request Body** (`multipart/form-data`):

- `title`: String (required)
- `subject`: String (required)
- `description`: String (optional)
- `startTime`: ISO 8601 Date String (required)
- `endTime`: ISO 8601 Date String (required)
- `rotationDuration`: Integer (optional, minutes, default 5)
- `file`: Binary file (required, max 10MB)

**Response (201 Created)**:

```json
{
  "success": true,
  "message": "Content uploaded successfully",
  "data": {
    "id": "uuid",
    "title": "Maths Chapter 1",
    "status": "PENDING"
  }
}
```

### 4.2 Get My Content

- **URL**: `/api/content/mine`
- **Method**: `GET`
- **Auth Required**: Yes (`TEACHER`)
- **Description**: Returns a list of content uploaded by the authenticated teacher.

**Response (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Maths Chapter 1",
      "subject": "maths",
      "status": "PENDING",
      "startTime": "...",
      "endTime": "..."
    }
  ]
}
```

### 4.3 Get Single Content

- **URL**: `/api/content/:id`
- **Method**: `GET`
- **Auth Required**: Yes (Any valid JWT)
- **Description**: Fetches details for a specific content item by ID.

**Response (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Maths Chapter 1",
    "subject": "maths",
    "fileUrl": "/uploads/filename.jpg",
    "status": "APPROVED",
    "uploaderId": "uuid"
  }
}
```

### 4.4 Delete Content

- **URL**: `/api/content/:id`
- **Method**: `DELETE`
- **Auth Required**: Yes (`TEACHER`)
- **Description**: Deletes a specific content item. Only the owner can delete it.

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

---

## 5. Approval (Principal)

### 5.1 List Pending Content

- **URL**: `/api/approval/pending`
- **Method**: `GET`
- **Auth Required**: Yes (`PRINCIPAL`)
- **Description**: Lists all content items awaiting approval.

**Response (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Maths Chapter 1",
      "subject": "maths",
      "status": "PENDING",
      "uploadedBy": {
        "name": "Teacher Name"
      }
    }
  ]
}
```

### 5.2 Approve Content

- **URL**: `/api/approval/:id/approve`
- **Method**: `PATCH`
- **Auth Required**: Yes (`PRINCIPAL`)
- **Description**: Approves a pending content item.

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Content approved"
}
```

### 5.3 Reject Content

- **URL**: `/api/approval/:id/reject`
- **Method**: `PATCH`
- **Auth Required**: Yes (`PRINCIPAL`)
- **Description**: Rejects a pending content item with a reason.

**Request Body** (`application/json`):

```json
{
  "rejectionReason": "Content does not match curriculum"
}
```

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Content rejected"
}
```

---

## 6. Content Filtering (Principal)

### 6.1 Get All Content

- **URL**: `/api/content`
- **Method**: `GET`
- **Auth Required**: Yes (`PRINCIPAL`)
- **Description**: Retrieves all content, optionally filtered by query parameters.

**Query Parameters**:

- `status` (optional): `PENDING`, `APPROVED`, `REJECTED`
- `subject` (optional): e.g., `maths`, `science`
- `teacherId` (optional): UUID of a teacher

**Response (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Maths Chapter 1",
      "status": "APPROVED",
      "subject": "maths"
    }
  ]
}
```

---

## 7. Public Broadcasting

### 7.1 Get Live Content

- **URL**: `/api/content/live/:teacherId`
- **Method**: `GET`
- **Auth Required**: No (Rate limited)
- **Description**: Fetches the currently live broadcasting content for a specific teacher. This endpoint is purely deterministic based on the current time and content schedules.

**Query Parameters**:

- `subject` (optional): Filter live content by a specific subject.

**Response (200 OK)**:

```json
{
  "success": true,
  "message": "Live content fetched successfully",
  "data": {
    "maths": {
      "id": "uuid",
      "title": "Maths Chapter 1",
      "subject": "maths",
      "fileUrl": "/uploads/filename.jpg",
      "fileType": "image/jpeg",
      "fileSize": 204800,
      "uploadedBy": { "id": "uuid", "name": "Teacher Name" },
      "schedule": {
        "rotationOrder": 1,
        "duration": 5,
        "startTime": "2026-04-26T08:00:00.000Z",
        "endTime": "2026-04-26T18:00:00.000Z"
      }
    },
    "science": null
  }
}
```

**Response (No Content Available)**:

```json
{
  "success": true,
  "message": "No content available",
  "data": null
}
```

### 7.2 Get Broadcast Analytics

- **URL**: `/api/content/live/:teacherId/analytics`
- **Method**: `GET`
- **Auth Required**: No (Rate limited)
- **Description**: Returns analytics and scheduling data for the teacher's active content.

**Response (200 OK)**:

```json
{
  "success": true,
  "data": {
    "maths": {
      "totalCycleDuration": 15,
      "activeContentCount": 3,
      "currentContentId": "uuid"
    }
  }
}
```
