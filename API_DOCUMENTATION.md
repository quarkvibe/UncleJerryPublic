# Uncle Jerry Blueprint Analyzer API Documentation

This document provides detailed information about the Uncle Jerry Blueprint Analyzer API endpoints.

## Base URL

```
http://localhost:3001
```

For production, the API is available at your deployed domain:

```
https://unclejerry.ai/api
```

## Authentication

Currently, the API uses a simple user ID system without formal authentication. Future versions will implement proper authentication.

## API Endpoints

### Blueprint Analysis

#### Analyze Blueprint

Submits a blueprint image for analysis by Claude AI.

**URL**: `/api/analyze-blueprint`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Form Parameters**:

| Parameter | Type   | Required | Description                           |
|-----------|--------|----------|---------------------------------------|
| blueprint | File   | Yes      | The blueprint image file to analyze   |
| userId    | String | No       | User identifier (defaults to 'anonymous') |
| trade     | String | No       | Trade type (electrical, plumbing, etc.) - defaults to 'general' |

**Success Response**:

- **Code**: `200 OK`
- **Content**:
  ```json
  {
    "analysis": "Detailed analysis results from Claude...",
    "projectId": "mongo-generated-id"
  }
  ```

**Error Response**:

- **Code**: `400 Bad Request`
- **Content**:
  ```json
  {
    "error": "No file uploaded"
  }
  ```

OR

- **Code**: `500 Internal Server Error`
- **Content**:
  ```json
  {
    "error": "Failed to analyze blueprint"
  }
  ```

**Example Request**:

```bash
curl -X POST \
  http://localhost:3001/api/analyze-blueprint \
  -H 'Content-Type: multipart/form-data' \
  -F 'blueprint=@/path/to/your/blueprint.jpg' \
  -F 'userId=user123' \
  -F 'trade=electrical'
```

### Projects

#### Get User Projects

Retrieves all projects for a specific user.

**URL**: `/api/projects/:userId`

**Method**: `GET`

**URL Parameters**:

| Parameter | Type   | Required | Description      |
|-----------|--------|----------|------------------|
| userId    | String | Yes      | User identifier  |

**Success Response**:

- **Code**: `200 OK`
- **Content**:
  ```json
  [
    {
      "_id": "project-id-1",
      "userId": "user123",
      "trade": "electrical",
      "analysis": "Analysis results...",
      "createdAt": "2023-04-08T15:30:45.123Z"
    },
    {
      "_id": "project-id-2",
      "userId": "user123",
      "trade": "plumbing",
      "analysis": "Analysis results...",
      "createdAt": "2023-04-07T10:15:22.456Z"
    }
  ]
  ```

**Error Response**:

- **Code**: `500 Internal Server Error`
- **Content**:
  ```json
  {
    "error": "Failed to retrieve projects"
  }
  ```

**Example Request**:

```bash
curl -X GET http://localhost:3001/api/projects/user123
```

### System Status

#### Test API Status

Checks if the API is operational.

**URL**: `/api/test`

**Method**: `GET`

**Success Response**:

- **Code**: `200 OK`
- **Content**:
  ```json
  {
    "message": "API is working!"
  }
  ```

**Example Request**:

```bash
curl -X GET http://localhost:3001/api/test
```

## Error Handling

All API endpoints return JSON responses. In case of errors, the response will include an `error` field with a description of the error.

## Rate Limiting

There are currently no rate limits implemented, but please be considerate with API usage to avoid excessive load on the server and Claude API.

## Data Models

### Project

| Field      | Type     | Description                                  |
|------------|----------|----------------------------------------------|
| _id        | ObjectId | MongoDB generated ID                         |
| userId     | String   | User identifier                              |
| trade      | String   | Trade type (electrical, plumbing, etc.)      |
| imageUrl   | String   | URL or reference to stored blueprint image   |
| analysis   | String   | Analysis results from Claude                 |
| createdAt  | Date     | Timestamp when the project was created       |

## Future Enhancements

The following API enhancements are planned for future releases:

1. User authentication with JWT
2. Ability to update and delete projects
3. Sharing projects between users
4. Export projects to PDF
5. Integration with cost estimating databases