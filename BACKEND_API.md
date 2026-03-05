# UrbanRewear Backend API Documentation

**Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Base URL:** `https://ur.mztski-zhk.cc/api/v1`

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Health & Status](#health--status)
5. [User Management](#user-management)
6. [Authentication Endpoints](#authentication-endpoints)
7. [Cloth Analysis (AI-Powered)](#cloth-analysis-ai-powered)
8. [Object Management](#object-management)
9. [Search & Suggestions](#search--suggestions)
10. [Response Formats](#response-formats)
11. [Error Codes](#error-codes)
12. [Request Examples](#request-examples)

---

## Overview

UrbanRewear is an AI-powered clothing valuation and redesign platform. The backend API provides:

- **User Management**: Registration, authentication, profile updates
- **AI Analysis**: Cloth condition detection and redesign suggestions
- **Object Management**: Store and retrieve analyzed clothing items
- **Search**: Advanced search with filters and autocomplete suggestions

### Key Features

- ✅ JWT-based authentication
- ✅ Request tracking with unique IDs
- ✅ Comprehensive error handling
- ✅ Structured JSON responses
- ✅ File upload support (images)
- ✅ Full-text search capabilities

---

## Authentication

### Overview

The API uses JWT (JSON Web Token) for authentication. All protected endpoints require a valid Bearer token in the `Authorization` header.

### Token Acquisition

1. User signs up or logs in
2. Server returns JWT token
3. Include token in Authorization header for all subsequent requests

### Authorization Header Format

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration

Tokens expire after `ACCESS_TOKEN_EXPIRE_MINUTES` (typically 24 hours). Clients must handle token refresh by re-authenticating.

### Example

```javascript
// JavaScript
const response = await fetch('https://ur.mztski-zhk.cc/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

```python
# Python
headers = {
    'Authorization': f'Bearer {token}'
}
response = requests.get('https://ur.mztski-zhk.cc/api/v1/users/me', headers=headers)
```

---

## Error Handling

### Standard Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-facing error message",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "detail": "Technical details (optional)",
    "context": {
      "additional_info": "context_value"
    }
  }
}
```

### Request Tracking

Every error response includes a `request_id` that can be used to:
- Correlate with server logs
- Report issues to support
- Debug problems

### Example Error Response

```json
{
  "error": {
    "code": "AUTHENTICATION_ERROR",
    "message": "Invalid credentials",
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "detail": "Password verification failed"
  }
}
```

### Handling Errors in Frontend

```javascript
// JavaScript error handling
async function makeRequest(url, options) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error [${error.error.code}]: ${error.error.message}`);
    console.error(`Request ID: ${error.error.request_id}`);
    throw error;
  }
  
  return response.json();
}
```

---

## Health & Status

### Health Check (Public)

**GET** `https://ur.mztski-zhk.cc/health`

Check if the service is operational.

**Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` - Service is healthy
- `503 Service Unavailable` - Service is down

---

## User Management

### 1. Get Current User Profile

**GET** `/users/me`

Retrieve the authenticated user's profile information.

**Authentication:** Required ✅

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "uid": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "email": "john@example.com",
  "phone_num": "+1234567890",
  "homeaddress": {
    "address": "123 Main St",
    "street": "Main St",
    "city": "San Francisco",
    "country_or_region": "USA",
    "state": "CA",
    "zip_code": "94105",
    "address2": null
  },
  "disabled": false
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token provided
- `403 Forbidden` - User account is disabled

---

### 2. User Signup

**POST** `/users/signup`

Create a new user account.

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!",
  "email": "john@example.com",
  "phone_num": "+1234567890",
  "homeaddress": {
    "address": "123 Main St",
    "street": "Main St",
    "city": "San Francisco",
    "country_or_region": "USA",
    "state": "CA",
    "zip_code": "94105"
  }
}
```

**Field Constraints:**
- `username`: 6-20 characters, alphanumeric
- `password`: Must contain uppercase, digit, and special character
- `email`: Valid email format (required)
- `phone_num`: Valid phone format (optional)
- `homeaddress`: Complete address object (optional)

**Response:** `200 OK`
```json
{
  "message": "User signed up successfully.",
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `422 Unprocessable Entity` - Invalid input or user already exists
- `500 Internal Server Error` - Database error

---

### 3. Update User Profile

**POST** `/users/{user_uid}`

Update user's profile information.

**Authentication:** Required ✅

**Path Parameters:**
- `user_uid` (string, UUID): The user's unique identifier

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "username": "jane_doe",
  "email": "jane@example.com",
  "phone_num": "+1987654321",
  "homeaddress": {
    "address": "456 Oak Ave",
    "street": "Oak Ave",
    "city": "Los Angeles",
    "country_or_region": "USA"
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "User information updated successfully."
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `403 Forbidden` - Cannot update other user's profile
- `404 Not Found` - User not found
- `500 Internal Server Error` - Database error

---

### 4. Change Password

**PUT** `/users/{user_uid}`

Update user's password.

**Authentication:** Required ✅

**Path Parameters:**
- `user_uid` (string, UUID): The user's unique identifier

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "new_password": "NewSecurePass456!"
}
```

**Password Requirements:**
- At least one uppercase letter
- At least one digit
- At least one special character
- Typically 6-20 characters

**Response:** `200 OK`
```json
{
  "message": "Password updated successfully."
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `403 Forbidden` - Cannot change other user's password
- `422 Unprocessable Entity` - Password doesn't meet requirements
- `500 Internal Server Error` - Database error

---

### 5. Delete User Account

**DELETE** `/users/{user_uid}`

Permanently delete a user account.

**Authentication:** Required ✅

**Path Parameters:**
- `user_uid` (string, UUID): The user's unique identifier

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `403 Forbidden` - Cannot delete other user's account
- `404 Not Found` - User not found
- `500 Internal Server Error` - Database error

---

## Authentication Endpoints

### 1. Issue JWT Token (Login)

**POST** `/auth/token`

Authenticate user and receive JWT token. Uses OAuth2 form encoding.

**Authentication:** Not required

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Request Body (Form Data):**
```
username=john@example.com&password=SecurePass123!
```

**Username Can Be:**
- Email address
- Phone number
- Username

**Response:** `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Error Responses:**
- `400 Bad Request` - Missing username or password
- `401 Unauthorized` - Invalid credentials or disabled account
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

### Usage Example

```javascript
// JavaScript
const formData = new URLSearchParams();
formData.append('username', 'john@example.com');
formData.append('password', 'SecurePass123!');

const response = await fetch('https://ur.mztski-zhk.cc/api/v1/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: formData
});

const data = await response.json();
const token = data.access_token;
localStorage.setItem('token', token);
```

---

## Cloth Analysis (AI-Powered)

### 1. Analyze Cloth Condition (Using Cloud AI)

**POST** `/cloth/{userid}/conditions/`

Analyze cloth condition using cloud-based AI service (Gemini).

**Authentication:** Required ✅

**Path Parameters:**
- `userid` (string, UUID): The user's unique identifier

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
- cloth_front: <image_file>  (JPEG/PNG)
- cloth_back: <image_file>   (JPEG/PNG)
```

**Response:** `200 OK`
```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "condition": {
    "cloth_details": {
      "image": "front",
      "cloth_type": "T-shirt",
      "cloth_fabric": "Cotton",
      "is_dirty_or_damaged": false,
      "damage_description": null,
      "suitable_for_redesign": true,
      "suitable_for_upcycling": true
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token or unauthorized user
- `402 Payment Required` - AI service quota exceeded
- `422 Unprocessable Entity` - Invalid image format or missing files
- `502 Bad Gateway` - AI service unavailable
- `500 Internal Server Error` - Database or processing error

**Image Requirements:**
- Format: JPEG or PNG
- Max size: Typically 5-10 MB per image
- Resolution: Minimum 480x480 pixels recommended

---

### 2. Analyze Cloth Condition (Using Local AI)

**POST** `/localcloth/{userid}/conditions/`

Analyze cloth condition using local AI model (faster, no quota).

**Authentication:** Required ✅

**Path Parameters:**
- `userid` (string, UUID): The user's unique identifier

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
- cloth_front: <image_file>  (JPEG/PNG)
- cloth_back: <image_file>   (JPEG/PNG)
```

**Response:** `200 OK`
```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "condition": {
    "cloth_details": {
      "image": "front",
      "cloth_type": "T-shirt",
      "cloth_fabric": "Cotton",
      "is_dirty_or_damaged": false,
      "suitable_for_redesign": true,
      "suitable_for_upcycling": true
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token or unauthorized user
- `422 Unprocessable Entity` - Invalid image format or missing files
- `502 Bad Gateway` - Local AI service unavailable
- `500 Internal Server Error` - Processing error

---

### 3. Generate Cloth Redesign (Cloud AI)

**PUT** `/cloth/{userid}/redesign/`

Generate redesign suggestions for cloth using cloud AI.

**Authentication:** Required ✅

**Path Parameters:**
- `userid` (string, UUID): The user's unique identifier

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
- before_cloth_front: <image_file>     (original front)
- before_cloth_back: <image_file>      (original back)
- after_cloth_front: <image_file>      (optional: user's redesign front)
- after_cloth_back: <image_file>       (optional: user's redesign back)
```

**Response:** `200 OK`
```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "after_file_id": "550e8400-e29b-41d4-a716-446655440001",
  "redesign_analysis": {
    "cloth_details": {
      "suitable_for_redesign": true,
      "redesign_suggestions": [
        "Consider adding decorative patches",
        "Shorten the sleeves for a cropped look"
      ]
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `402 Payment Required` - AI quota exceeded
- `422 Unprocessable Entity` - Invalid image format
- `502 Bad Gateway` - AI service unavailable
- `500 Internal Server Error` - Processing error

---

### 4. Generate Cloth Redesign (Local AI)

**PUT** `/localcloth/{userid}/redesign/`

Generate redesign suggestions using local AI model.

**Authentication:** Required ✅

**Path Parameters:**
- `userid` (string, UUID): The user's unique identifier
- Must include `file_id` as query parameter

**Query Parameters:**
- `file_id` (string, UUID): ID of the cloth to redesign

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
- before_cloth_front: <image_file>     (original front)
- before_cloth_back: <image_file>      (original back)
- after_cloth_front: <image_file>      (optional: redesign front)
- after_cloth_back: <image_file>       (optional: redesign back)
```

**Response:** `200 OK`
```json
{
  "file_id": "550e8400-e29b-41d4-a716-446655440000",
  "after_file_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `404 Not Found` - Cloth file not found
- `422 Unprocessable Entity` - Invalid image format
- `502 Bad Gateway` - Local AI unavailable
- `500 Internal Server Error` - Processing error

---

## Object Management

### 1. Get User's Objects

**GET** `/obj/{userid}`

Retrieve all analyzed cloth objects for a user.

**Authentication:** Required ✅

**Path Parameters:**
- `userid` (string, UUID): The user's unique identifier

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "objects": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "file_available": ["front_cloth", "back_cloth"],
      "cloth_status": {
        "type": "front",
        "cloth_type": "T-shirt",
        "cloth_fabric": "Cotton",
        "is_dirty_or_damaged": false,
        "suitable_for_redesign": true,
        "suitable_for_upcycling": true
      },
      "created_at": "2026-03-05T10:30:45.123456Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `403 Forbidden` - Cannot access other user's objects
- `404 Not Found` - Objects not found
- `500 Internal Server Error` - Database error

---

## Search & Suggestions

### 1. Simple Cloth Search

**POST** `/search/simple`

Perform a simple text search for cloth items.

**Authentication:** Required ✅

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "red cotton shirt",
  "limit": 20,
  "offset": 0
}
```

**Query Parameters:**
- `query` (string): Search term(s), 1-500 characters
- `limit` (integer): Results per page, 1-100 (default: 20)
- `offset` (integer): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "file_available": ["front_cloth", "back_cloth"],
      "cloth_status": {
        "cloth_type": "Shirt",
        "cloth_fabric": "Cotton",
        "color": "Red"
      },
      "relevance_rank": 0.95,
      "created_at": "2026-03-05T10:30:45.123456Z"
    }
  ],
  "total_returned": 1,
  "query": "red cotton shirt",
  "limit": 20,
  "offset": 0,
  "has_more": false
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `422 Unprocessable Entity` - Invalid search parameters
- `500 Internal Server Error` - Search service error

---

### 2. Advanced Cloth Search

**POST** `/search/advanced`

Perform advanced search with filters.

**Authentication:** Required ✅

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "shirt",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "is_public_only": false,
  "limit": 50,
  "offset": 0,
  "min_date": "2026-01-01T00:00:00Z",
  "max_date": "2026-12-31T23:59:59Z",
  "need_fix": false,
  "suitable_for_redesign": true,
  "suitable_for_upcycling": true,
  "fabric_types": ["cotton", "linen"],
  "cloth_types": ["shirt", "t-shirt"],
  "colors": ["red", "blue"]
}
```

**Filter Options:**
- `user_id`: Filter by specific user (UUID)
- `is_public_only`: Only public items (boolean)
- `min_date`, `max_date`: Date range filters (ISO 8601)
- `need_fix`: Items needing repairs (boolean)
- `suitable_for_redesign`: Redesign-suitable items (boolean)
- `suitable_for_upcycling`: Upcycling-suitable items (boolean)
- `fabric_types`: Array of fabric types
- `cloth_types`: Array of clothing types
- `colors`: Array of colors

**Response:** `200 OK` (Same as simple search)

**Error Responses:**
- `401 Unauthorized` - No valid token
- `422 Unprocessable Entity` - Invalid filters
- `500 Internal Server Error` - Search service error

---

### 3. Search with Highlighted Results

**POST** `/search/highlighted`

Search with HTML-highlighted matching terms.

**Authentication:** Required ✅

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "cotton",
  "limit": 20,
  "offset": 0
}
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "cloth_status": {
        "cloth_fabric": "<mark>Cotton</mark> blend"
      },
      "fabric_highlight": "<mark>Cotton</mark> blend"
    }
  ],
  "total_returned": 1,
  "query": "cotton",
  "limit": 20,
  "offset": 0,
  "has_more": false
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `500 Internal Server Error` - Search service error

---

### 4. Get Autocomplete Suggestions

**GET** `/search/autocomplete`

Get autocomplete suggestions while user types.

**Authentication:** Required ✅

**Query Parameters:**
- `q` (string, required): Partial search term, 1-100 characters
- `limit` (integer): Max suggestions, 1-50 (default: 10)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "suggestions": [
    {
      "suggestion": "cotton",
      "field_name": "fabric",
      "frequency": 125,
      "similarity_score": 0.98
    },
    {
      "suggestion": "cotton blend",
      "field_name": "fabric",
      "frequency": 87,
      "similarity_score": 0.95
    }
  ],
  "partial_query": "cot",
  "total_returned": 2
}
```

**Error Responses:**
- `401 Unauthorized` - No valid token
- `422 Unprocessable Entity` - Query too short/long
- `500 Internal Server Error` - Autocomplete service error

---

### 5. Fuzzy Search

**GET** `/search/fuzzy`

Search with typo tolerance.

**Authentication:** Required ✅

**Query Parameters:**
- `q` (string, required): Search term with potential typos
- `limit` (integer): Max results, 1-100 (default: 20)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK` (Same as simple search)

**Error Responses:**
- `401 Unauthorized` - No valid token
- `500 Internal Server Error` - Search service error

---

### 6. Quick Search

**GET** `/search/quick`

Fast search for immediate results.

**Authentication:** Required ✅

**Query Parameters:**
- `q` (string, required): Search term
- `limit` (integer): Max results, 1-100 (default: 20)
- `public_only` (boolean): Only public items (default: false)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK` (Same as simple search)

**Error Responses:**
- `401 Unauthorized` - No valid token
- `500 Internal Server Error` - Search service error

---

### 7. Search Service Health

**GET** `/search/health`

Check search service status.

**Authentication:** Required ✅

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "service": "full_text_search",
  "features": [
    "simple_search",
    "advanced_search",
    "highlighted_search",
    "autocomplete",
    "fuzzy_search",
    "quick_search"
  ]
}
```

---

## Response Formats

### Success Response Structure

```json
{
  "data": {},
  "message": "Operation successful"
}
```

### Paginated Response Structure

```json
{
  "results": [],
  "total_returned": 10,
  "query": "search_term",
  "limit": 20,
  "offset": 0,
  "has_more": false
}
```

### Error Response Structure

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-facing message",
    "request_id": "uuid-string",
    "detail": "Technical details",
    "context": {}
  }
}
```

---

## Error Codes

| Code | HTTP | Description | Action |
|------|------|-------------|--------|
| `VALIDATION_ERROR` | 422 | Input validation failed | Check request format |
| `AUTHENTICATION_ERROR` | 401 | Login/token invalid | Re-authenticate user |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions | Check user permissions |
| `RESOURCE_NOT_FOUND` | 404 | Resource not found | Verify resource exists |
| `CONFLICT` | 409 | Resource already exists | Handle duplicate |
| `FILE_PROCESSING_ERROR` | 422 | File operation failed | Check file format |
| `DATABASE_ERROR` | 500 | Database operation failed | Retry or contact support |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service failed | Retry after delay |
| `CONFIGURATION_ERROR` | 500 | Configuration issue | Contact support |
| `INTERNAL_ERROR` | 500 | Unexpected error | Contact support with request_id |

---

## Request Examples

### Complete Login Flow

```javascript
// Step 1: Login
const loginResponse = await fetch('https://ur.mztski-zhk.cc/api/v1/auth/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: 'username=user@example.com&password=Pass123!'
});

const loginData = await loginResponse.json();
const token = loginData.access_token;

// Step 2: Get user profile
const profileResponse = await fetch('https://ur.mztski-zhk.cc/api/v1/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const profile = await profileResponse.json();
console.log('User:', profile);

// Step 3: Store token for future requests
localStorage.setItem('token', token);
```

### Complete Cloth Analysis Flow

```javascript
// Assuming token is already obtained
const token = localStorage.getItem('token');

// Step 1: Prepare FormData with images
const formData = new FormData();
const frontFile = document.getElementById('front-input').files[0];
const backFile = document.getElementById('back-input').files[0];

formData.append('cloth_front', frontFile);
formData.append('cloth_back', backFile);

// Step 2: Analyze cloth
const analysisResponse = await fetch(
  `https://ur.mztski-zhk.cc/api/v1/localcloth/${userId}/conditions/`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  }
);

if (!analysisResponse.ok) {
  const error = await analysisResponse.json();
  console.error('Analysis failed:', error.error);
  return;
}

const analysis = await analysisResponse.json();
console.log('Condition:', analysis.condition);
console.log('File ID:', analysis.file_id);

// Step 3: Store or display results
displayAnalysisResults(analysis);
```

### Search with Advanced Filters

```javascript
const token = localStorage.getItem('token');

const searchParams = {
  query: "redesignable clothing",
  suitable_for_redesign: true,
  suitable_for_upcycling: true,
  fabric_types: ["cotton", "wool"],
  limit: 20,
  offset: 0
};

const searchResponse = await fetch(
  'https://ur.mztski-zhk.cc/api/v1/search/advanced',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(searchParams)
  }
);

const results = await searchResponse.json();
console.log(`Found ${results.total_returned} items`);
console.log('Results:', results.results);
```

---

## Ports & Services

| Service | Host | Status |
|---------|------|--------|
| Frontend (Vite dev) | `localhost:8080` | ✅ Active (dev only) |
| Production API | `https://ur.mztski-zhk.cc` | ✅ Active |
| AI Worker | Internal | ✅ Active |

---

## Rate Limiting

Currently, the API does not implement strict rate limiting but may be added in future versions. It's recommended to implement exponential backoff for retries.

---

## CORS Support

Cross-Origin requests are supported. Ensure your frontend domain is configured in the server's CORS settings.

---

## Versioning

The API uses URL versioning (`/api/v1/`). Future versions will be available at `/api/v2/`, etc.

---

## Support & Feedback

For issues, bugs, or feature requests, please:

1. Check the `request_id` in error responses
2. Review the detailed error messages and context
3. Consult this documentation
4. Contact the development team with the request ID

---

**Last Updated:** March 5, 2026  
**Documentation Version:** 1.0.0
