# Patient Document Portal - Design Document

## 1. Tech Stack Choices

### Q1. What frontend framework did you use and why?

**Choice: React with Vite**

I chose React for the following reasons:

- **Component-Based Architecture**: React's component model allows for reusable UI elements (file cards, upload forms, buttons), making the code modular and maintainable.
- **Rich Ecosystem**: Extensive libraries for file handling, state management, and UI components.
- **Virtual DOM**: Efficient rendering when the document list updates after uploads/deletions.
- **Industry Standard**: Widely adopted in production, making it easier for teams to collaborate.
- **Vite Build Tool**: Faster development experience with hot module replacement (HMR) and optimized production builds.

### Q2. What backend framework did you choose and why?

**Choice: Express.js (Node.js)**

I chose Express.js for the following reasons:

- **Simplicity**: Minimal boilerplate for setting up REST APIs quickly.
- **Middleware Support**: Easy integration with multer for file uploads, cors for cross-origin requests, and custom error handling.
- **JavaScript Ecosystem**: Shared language with frontend reduces context switching.
- **Non-Blocking I/O**: Efficient handling of file upload/download operations.
- **Large Community**: Extensive documentation and community support for troubleshooting.

### Q3. What database did you choose and why?

**Choice: SQLite**

I chose SQLite for the following reasons:

- **Zero Configuration**: No separate database server needed; the database is a single file.
- **Perfect for Local Development**: Runs entirely on the local machine without external dependencies.
- **Lightweight**: Small footprint, ideal for this single-user application.
- **ACID Compliant**: Reliable data integrity for document metadata.
- **Easy Setup**: No installation or authentication required.

### Q4. If you were to support 1,000 users, what changes would you consider?

For scaling to 1,000 users, I would implement the following changes:

1. **Database Migration**: Move from SQLite to PostgreSQL or MySQL for:
   - Better concurrent read/write handling
   - Connection pooling
   - Advanced indexing and query optimization

2. **Authentication & Authorization**:
   - Implement JWT-based authentication
   - Add user registration/login endpoints
   - Associate documents with user IDs
   - Row-level security for document access

3. **File Storage**:
   - Migrate from local filesystem to cloud storage (AWS S3, Google Cloud Storage)
   - Implement CDN for faster file delivery
   - Use pre-signed URLs for secure downloads

4. **Backend Scaling**:
   - Containerize with Docker
   - Deploy behind a load balancer
   - Implement caching (Redis) for metadata queries
   - Add rate limiting to prevent abuse

5. **Infrastructure**:
   - Use Kubernetes or similar for orchestration
   - Implement health checks and monitoring
   - Add logging and error tracking (e.g., Sentry)

---

## 2. Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     React Frontend (Vite)                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │ Upload Form  │  │ Document List│  │ Success/Error Messages   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP Requests (REST API)
                                    │ Port 5001
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS.JS BACKEND                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Middleware Layer                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  CORS    │  │  Multer  │  │  Morgan  │  │  Error Handler   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Route Handlers                                │   │
│  │  POST /documents/upload  │  GET /documents  │  GET/DELETE /:id     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                       │
                    │                                       │
                    ▼                                       ▼
┌────────────────────────────┐           ┌────────────────────────────────────┐
│       SQLite Database      │           │         Local File System          │
│  ┌──────────────────────┐ │           │  ┌──────────────────────────────┐ │
│  │   documents table    │ │           │  │      uploads/ folder         │ │
│  │  - id (PRIMARY KEY)  │ │           │  │  - {uuid}_filename.pdf       │ │
│  │  - filename          │ │           │  │  - {uuid}_filename.pdf       │ │
│  │  - filepath          │ │           │  └──────────────────────────────┘ │
│  │  - filesize          │ │           └────────────────────────────────────┘
│  │  - created_at        │ │
│  └──────────────────────┘ │
└────────────────────────────┘
```

### Data Flow Summary

1. **Frontend → Backend**: HTTP requests via Axios
2. **Backend → Database**: SQLite queries via better-sqlite3
3. **Backend → File System**: File operations via Node.js fs module
4. **Backend → Frontend**: JSON responses with document metadata

---

## 3. API Specification

### Endpoint 1: Upload a PDF

| Attribute | Value |
|-----------|-------|
| **URL** | `/documents/upload` |
| **Method** | `POST` |
| **Content-Type** | `multipart/form-data` |
| **Description** | Uploads a PDF file and stores its metadata in the database |

**Request:**
```bash
curl -X POST http://localhost:5001/documents/upload \
  -F "file=@/path/to/prescription.pdf"
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "document": {
    "id": 1,
    "filename": "prescription.pdf",
    "filepath": "uploads/a1b2c3d4_prescription.pdf",
    "filesize": 102400,
    "created_at": "2025-12-11T10:30:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Only PDF files are allowed"
}
```

---

### Endpoint 2: List All Documents

| Attribute | Value |
|-----------|-------|
| **URL** | `/documents` |
| **Method** | `GET` |
| **Description** | Retrieves a list of all uploaded documents with metadata |

**Request:**
```bash
curl -X GET http://localhost:5001/documents
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "documents": [
    {
      "id": 1,
      "filename": "prescription.pdf",
      "filepath": "uploads/a1b2c3d4_prescription.pdf",
      "filesize": 102400,
      "created_at": "2025-12-11T10:30:00.000Z"
    },
    {
      "id": 2,
      "filename": "blood_test_results.pdf",
      "filepath": "uploads/e5f6g7h8_blood_test_results.pdf",
      "filesize": 256000,
      "created_at": "2025-12-11T11:00:00.000Z"
    }
  ]
}
```

---

### Endpoint 3: Download a File

| Attribute | Value |
|-----------|-------|
| **URL** | `/documents/:id` |
| **Method** | `GET` |
| **Description** | Downloads a specific document by its ID |

**Request:**
```bash
curl -X GET http://localhost:5001/documents/1 --output downloaded_file.pdf
```

**Success Response (200 OK):**
- Returns the PDF file as binary data
- Headers: `Content-Type: application/pdf`, `Content-Disposition: attachment`

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Document not found"
}
```

---

### Endpoint 4: Delete a File

| Attribute | Value |
|-----------|-------|
| **URL** | `/documents/:id` |
| **Method** | `DELETE` |
| **Description** | Deletes a document and its metadata from the system |

**Request:**
```bash
curl -X DELETE http://localhost:5001/documents/1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Document not found"
}
```

---

## 4. Data Flow Description

### Q5. Describe the step-by-step process of what happens when a file is uploaded and when it is downloaded.

#### File Upload Process

```
User Action: Selects PDF and clicks "Upload"
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Frontend Validation                                  │
│ - Check if file is selected                                  │
│ - Verify file type is PDF (client-side check)               │
│ - Create FormData object with the file                       │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: HTTP Request                                         │
│ - Send POST request to /documents/upload                     │
│ - Content-Type: multipart/form-data                          │
│ - Include file binary in request body                        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Backend - Multer Middleware                          │
│ - Parse multipart form data                                  │
│ - Validate file MIME type (application/pdf)                  │
│ - Generate unique filename with UUID prefix                  │
│ - Save file to uploads/ directory                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Database Insert                                      │
│ - Extract metadata (filename, size, path)                    │
│ - Insert record into documents table                         │
│ - SQLite auto-generates ID and timestamp                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Response                                             │
│ - Return JSON with document metadata                         │
│ - Frontend displays success message                          │
│ - Document list refreshes to show new file                   │
└─────────────────────────────────────────────────────────────┘
```

#### File Download Process

```
User Action: Clicks "Download" button on a document
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: HTTP Request                                         │
│ - Send GET request to /documents/:id                         │
│ - Document ID extracted from button click event              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Database Lookup                                      │
│ - Query documents table by ID                                │
│ - Retrieve filepath and filename                             │
│ - Return 404 if document not found                           │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: File System Read                                     │
│ - Resolve absolute path to file                              │
│ - Check if file exists on disk                               │
│ - Read file from uploads/ directory                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Stream Response                                      │
│ - Set headers: Content-Type, Content-Disposition             │
│ - Stream file binary to client                               │
│ - Browser triggers download with original filename           │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Assumptions

### Q6. What assumptions did you make while building this?

1. **Single User System**:
   - No authentication or user management required
   - All documents belong to a single implicit user
   - No need for access control or document ownership

2. **File Size Limits**:
   - Maximum file size: 10MB per document
   - Reasonable for typical medical documents (prescriptions, test results)
   - Configurable in production if needed

3. **File Type Restriction**:
   - Only PDF files are accepted
   - MIME type validation on both client and server
   - Other formats (images, DOCX) are rejected

4. **Local Storage**:
   - Files stored in local `uploads/` folder
   - Adequate for development/demo purposes
   - Would migrate to cloud storage for production

5. **No Concurrent Access Issues**:
   - Single user assumption means no race conditions
   - SQLite handles sequential operations well
   - No need for file locking mechanisms

6. **Filename Handling**:
   - Original filenames preserved for display
   - UUID prefix added to stored files to prevent collisions
   - Special characters in filenames are sanitized

7. **No File Versioning**:
   - Uploading a file with the same name creates a new entry
   - No version history or duplicate detection
   - Each upload is treated as unique

8. **Browser Compatibility**:
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - ES6+ JavaScript features supported
   - FormData API available for file uploads

9. **Development Environment**:
   - Node.js v18+ installed
   - npm available for package management
   - Ports 3000 (frontend) and 5000 (backend) available

10. **Error Handling**:
    - Basic error messages shown to user
    - Server errors logged to console
    - No retry mechanisms for failed operations

---

## Conclusion

This design prioritizes simplicity and clarity while maintaining a clean separation of concerns. The architecture can be easily extended to support additional features like user authentication, cloud storage, and horizontal scaling as requirements evolve.

