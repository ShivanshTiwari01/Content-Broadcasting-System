# Content Broadcasting System

A backend API for distributing subject-based educational content from teachers to students. Teachers upload content which, once approved by the Principal, is broadcasted via a public API with subject-based scheduling and rotation.

## Tech Stack

| Layer         | Technology          |
| ------------- | ------------------- |
| Runtime       | Node.js 20+         |
| Framework     | Express 5           |
| Language      | TypeScript          |
| ORM           | Prisma 7            |
| Database      | PostgreSQL          |
| Caching       | ioredis (Redis)     |
| Auth          | JWT + bcryptjs      |
| Validation    | Zod                 |
| File Uploads  | Multer (local disk) |
| Rate Limiting | express-rate-limit  |

## Setup

### Prerequisites

- Node.js 20+
- pnpm (`npm i -g pnpm`)
- PostgreSQL database
- Redis (optional — app degrades gracefully without it)

### Installation

```bash
# Clone the repo
git clone <repo-url>
cd content-broadcast-system

# Install dependencies
pnpm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# Run database migrations
pnpm db:migrate

# Generate Prisma client
pnpm db:generate

# Start dev server
pnpm dev
```

### Environment Variables

| Variable           | Description                  | Default                  |
| ------------------ | ---------------------------- | ------------------------ |
| `DATABASE_URL`     | PostgreSQL connection string | required                 |
| `PORT`             | Server port                  | `3000`                   |
| `NODE_ENV`         | Environment                  | `development`            |
| `JWT_SECRET`       | JWT signing secret           | required                 |
| `JWT_EXPIRES_IN`   | Token expiry                 | `7d`                     |
| `UPLOAD_DIR`       | Local upload directory       | `uploads`                |
| `MAX_FILE_SIZE_MB` | Max upload size in MB        | `10`                     |
| `REDIS_URL`        | Redis connection URL         | `redis://127.0.0.1:6379` |

## API Reference

> **Note:** For comprehensive API details, request/response formats, and headers, please refer to the [documentation.md](./documentation.md) file. All business endpoints are prefixed with `/api`.

### System

| Method | Endpoint  | Auth | Description           |
| ------ | --------- | ---- | --------------------- |
| GET    | `/`       | None | Root (Access Blocked) |
| GET    | `/health` | None | API Health check      |

### Authentication

| Method | Endpoint             | Auth | Description           |
| ------ | -------------------- | ---- | --------------------- |
| POST   | `/api/auth/register` | None | Register a new user   |
| POST   | `/api/auth/login`    | None | Login and receive JWT |

**Register body:**

```json
{
  "name": "John Doe",
  "email": "john@school.edu",
  "password": "securepassword",
  "role": "TEACHER"
}
```

### User

| Method | Endpoint              | Auth | Description       |
| ------ | --------------------- | ---- | ----------------- |
| GET    | `/api/users/me`       | Any  | Get own profile   |
| GET    | `/api/users/teachers` | Any  | List all teachers |

### Content (Teacher)

| Method | Endpoint              | Auth    | Description                  |
| ------ | --------------------- | ------- | ---------------------------- |
| POST   | `/api/content/upload` | TEACHER | Upload new content           |
| GET    | `/api/content/mine`   | TEACHER | View own content with status |
| GET    | `/api/content/:id`    | Any     | View single content item     |
| DELETE | `/api/content/:id`    | TEACHER | Delete own content           |

**Upload content** (`multipart/form-data`):

```
title: "Maths Chapter 1"
subject: "maths"
description: "Introduction to algebra" (optional)
startTime: "2026-04-26T08:00:00.000Z"
endTime: "2026-04-26T18:00:00.000Z"
rotationDuration: 5  (minutes, optional, default: 5)
file: <binary file — JPG/PNG/GIF, max 10MB>
```

### Approval (Principal)

| Method | Endpoint                    | Auth      | Description              |
| ------ | --------------------------- | --------- | ------------------------ |
| GET    | `/api/approval/pending`     | PRINCIPAL | View all pending content |
| PATCH  | `/api/approval/:id/approve` | PRINCIPAL | Approve content          |
| PATCH  | `/api/approval/:id/reject`  | PRINCIPAL | Reject with reason       |

**Reject body:**

```json
{
  "rejectionReason": "Content does not match curriculum"
}
```

### Content (Principal — view all)

| Method | Endpoint                                                   | Auth      | Description        |
| ------ | ---------------------------------------------------------- | --------- | ------------------ |
| GET    | `/api/content?status=APPROVED&subject=maths&teacherId=xxx` | PRINCIPAL | Filter all content |

### Public Broadcasting (Students — No Auth)

| Method | Endpoint                                     | Auth | Description                  |
| ------ | -------------------------------------------- | ---- | ---------------------------- |
| GET    | `/api/content/live/:teacherId`               | None | Get live content for teacher |
| GET    | `/api/content/live/:teacherId?subject=maths` | None | Filter by subject            |
| GET    | `/api/content/live/:teacherId/analytics`     | None | Subject analytics            |

**Live content response:**

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

**No content available:**

```json
{
  "success": true,
  "message": "No content available",
  "data": null
}
```

## Content Lifecycle

```
Teacher uploads → PENDING → Principal reviews
                              ├── APPROVED → Appears in /content/live (within time window)
                              └── REJECTED → Rejection reason visible to teacher
```

## Scheduling Logic

The broadcast API uses a **time-based modulo algorithm**:

1. Filter approved content to items whose `startTime ≤ now ≤ endTime`
2. Group by subject (each subject rotates independently)
3. Compute `totalCycle = sum of all durations` per subject group
4. `elapsed = Date.now() % totalCycle`
5. Walk sorted rotation list until elapsed is consumed → active content

This is purely deterministic — all students see the same content at the same moment. No cron jobs needed.

## Assumptions & Notes

- S3 upload was intentionally excluded (local disk storage used)
- Redis is optional — the app runs without it (graceful degradation)
- The `role` field can be set at registration time; in production this should be admin-controlled
- File uploads are served statically at `GET /uploads/<filename>`
- The broadcast endpoint returns `200 OK` (not 404) for edge cases like no content or invalid teacher per spec

## Project Structure

```
src/
├── config/env.ts
├── lib/prisma.ts, redis.ts
├── middlewares/
│   ├── auth.middleware.ts
│   ├── role.middleware.ts
│   ├── upload.middleware.ts
│   └── error.middleware.ts
├── modules/
│   ├── auth/
│   ├── user/
│   ├── content/
│   ├── approval/
│   └── broadcast/
└── utils/response.ts, jwt.ts, asyncHandler.ts
```

See `architecture-notes.txt` for a detailed design explanation.

## Contributing

Contributions are welcome! Please follow these guidelines to contribute to the project:

1. **Fork the repository**
2. **Create a new branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** and commit them: `git commit -m 'Add some feature'`
4. **Push to the branch**: `git push origin feature/your-feature-name`
5. **Open a Pull Request** describing your changes

Please ensure your code follows the existing style, and remember to update documentation or tests where applicable.

## License

This project is licensed under the MIT License.
