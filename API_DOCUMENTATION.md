# School Management SOA System - Complete API Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

---

## Architecture Overview

This is a Service-Oriented Architecture (SOA) system built with Node.js/Express and MySQL. It follows microservices pattern with an API Gateway.

### Services:
- **API Gateway** (Port 3000) - Routes requests to services
- **Auth Service** (Port 3008) - User authentication & JWT
- **Student Service** (Port 3001) - Student management
- **Teacher Service** (Port 3002) - Teacher management
- **Enrollment Service** (Port 3003) - Student enrollments
- **Academic Service** (Port 3004) - Grades & academic records
- **Attendance Service** (Port 3005) - Attendance tracking
- **Payment Service** (Port 3006) - Invoices & payments
- **Notification Service** (Port 3007) - Email/SMS/In-app notifications

---

## Authentication

### JWT Token
All protected endpoints require JWT authentication.

**Token Header Format:**
```
Authorization: Bearer <token>
```

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "student",
    "token": "eyJhbGc..."
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

---

## API Endpoints

### STUDENT SERVICE

#### Create Student
```http
POST /api/students
Content-Type: application/json

{
  "enrollmentNumber": "STU-2024-001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "dateOfBirth": "2005-05-15",
  "gender": "M",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001"
}
```

#### Get All Students
```http
GET /api/students?page=1&limit=50
Authorization: Bearer <token>
```

#### Get Student by ID
```http
GET /api/students/{id}
Authorization: Bearer <token>
```

#### Get Student Academic Record
```http
GET /api/students/{id}/academic-record
Authorization: Bearer <token>
```

#### Get Student Enrollment History
```http
GET /api/students/{id}/enrollment-history
Authorization: Bearer <token>
```

#### Update Student
```http
PUT /api/students/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jonathan",
  "phone": "+1987654321"
}
```

#### Search Students
```http
GET /api/students/search?firstName=John&lastName=Doe&grade=10
Authorization: Bearer <token>
```

#### Delete Student
```http
DELETE /api/students/{id}
Authorization: Bearer <token>
```

---

### TEACHER SERVICE

#### Create Teacher
```http
POST /api/teachers
Content-Type: application/json

{
  "employeeId": "EMP-2024-001",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "password": "password123",
  "specialization": "Mathematics",
  "phone": "+1234567890",
  "hireDate": "2023-01-15"
}
```

#### Get All Teachers
```http
GET /api/teachers?page=1&limit=50
Authorization: Bearer <token>
```

#### Get Teacher by ID
```http
GET /api/teachers/{id}
Authorization: Bearer <token>
```

#### Get Teacher Courses
```http
GET /api/teachers/{teacherId}/courses
Authorization: Bearer <token>
```

#### Assign Teacher to Course
```http
POST /api/teachers/{teacherId}/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": 5
}
```

#### Update Teacher
```http
PUT /api/teachers/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "specialization": "Advanced Mathematics"
}
```

#### Delete Teacher
```http
DELETE /api/teachers/{id}
Authorization: Bearer <token>
```

---

### ENROLLMENT SERVICE

#### Enroll Student
```http
POST /api/enrollments
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "classroomId": 2,
  "enrollmentDate": "2024-01-15"
}
```

#### Get Student Enrollments
```http
GET /api/enrollments/student/{studentId}
Authorization: Bearer <token>
```

#### Get Classroom Enrollments
```http
GET /api/enrollments/classroom/{classroomId}
Authorization: Bearer <token>
```

#### Update Enrollment Status
```http
PUT /api/enrollments/{enrollmentId}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "graduated"
}
```

Valid statuses: `active`, `graduated`, `dropped`, `suspended`

#### Get Enrollments by Date Range
```http
GET /api/enrollments/date-range/report?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Delete Enrollment
```http
DELETE /api/enrollments/{enrollmentId}
Authorization: Bearer <token>
```

---

### ACADEMIC SERVICE

#### Register Grades
```http
POST /api/academic/grades
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 3,
  "teacherId": 2,
  "midtermScore": 85.5,
  "finalScore": 92.0,
  "recordedDate": "2024-04-15"
}
```

#### Get Student Academic History
```http
GET /api/academic/students/{studentId}/history
Authorization: Bearer <token>
```

#### Get Student GPA
```http
GET /api/academic/students/{studentId}/gpa
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gpa": 88.5,
    "total_courses": 5,
    "grade_a_count": 2,
    "grade_b_count": 3,
    "grade_c_count": 0,
    "grade_d_count": 0,
    "grade_f_count": 0
  }
}
```

#### Get Course Grades
```http
GET /api/academic/courses/{courseId}/grades
Authorization: Bearer <token>
```

#### Get Course Average
```http
GET /api/academic/courses/{courseId}/average
Authorization: Bearer <token>
```

#### Update Grade
```http
PUT /api/academic/grades/{gradeId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "midtermScore": 87.0,
  "finalScore": 93.0
}
```

---

### ATTENDANCE SERVICE

#### Mark Attendance
```http
POST /api/attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "classroomId": 2,
  "attendanceDate": "2024-04-15",
  "status": "present",
  "remarks": "On time",
  "markedBy": 3
}
```

Status values: `present`, `absent`, `late`, `excused`

#### Get Student Attendance
```http
GET /api/attendance/students/{studentId}?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

#### Get Attendance Summary
```http
GET /api/attendance/students/{studentId}/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "present": 45,
    "absent": 3,
    "late": 2,
    "excused": 1
  }
}
```

#### Get Monthly Attendance Report
```http
GET /api/attendance/students/{studentId}/monthly?month=4&year=2024
Authorization: Bearer <token>
```

#### Get Classroom Report
```http
GET /api/attendance/report/classroom?classroomId=2&attendanceDate=2024-04-15
Authorization: Bearer <token>
```

#### Update Attendance
```http
PUT /api/attendance/{attendanceId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "late",
  "remarks": "Traffic delay"
}
```

---

### PAYMENT SERVICE

#### Generate Invoice
```http
POST /api/payments/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "studentId": 1,
  "feeType": "Tuition",
  "amount": 5000.00,
  "dueDate": "2024-05-31"
}
```

#### Get Student Invoices
```http
GET /api/payments/students/{studentId}/invoices?status=pending
Authorization: Bearer <token>
```

#### Get Payment Summary
```http
GET /api/payments/students/{studentId}/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_paid": 15000.00,
    "total_pending": 5000.00,
    "total_overdue": 2000.00,
    "total_invoices": 4,
    "paid_count": 1,
    "pending_count": 3
  }
}
```

#### Track Payment
```http
GET /api/payments/{paymentId}
Authorization: Bearer <token>
```

#### Record Payment
```http
POST /api/payments/{paymentId}/record
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "card",
  "transactionId": "TXN-12345"
}
```

#### Get Overdue Payments
```http
GET /api/payments/report/overdue
Authorization: Bearer <token>
```

#### Cancel Payment
```http
PUT /api/payments/{paymentId}/cancel
Authorization: Bearer <token>
```

---

### NOTIFICATION SERVICE

#### Send Email Notification
```http
POST /api/notifications/send/email
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientUserId": 5,
  "subject": "Grade Report",
  "message": "Your grades have been posted",
  "recipientEmail": "parent@example.com"
}
```

#### Send SMS Notification
```http
POST /api/notifications/send/sms
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientUserId": 5,
  "subject": "Attendance Alert",
  "message": "Your child was marked absent",
  "phoneNumber": "+1234567890"
}
```

#### Send In-App Notification
```http
POST /api/notifications/send/in-app
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientUserId": 5,
  "subject": "System Update",
  "message": "New features available"
}
```

#### Get User Notifications
```http
GET /api/notifications/users/{userId}?unreadOnly=true
Authorization: Bearer <token>
```

#### Mark Notification as Read
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <token>
```

#### Broadcast Notification
```http
POST /api/notifications/broadcast
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientUserIds": [1, 2, 3, 4, 5],
  "subject": "Important Announcement",
  "message": "School will be closed on Friday",
  "notificationType": "email"
}
```

#### Delete Notification
```http
DELETE /api/notifications/{notificationId}
Authorization: Bearer <token>
```

---

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "details": "Additional details if available",
  "timestamp": "2024-04-15T10:30:00.000Z"
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `500` - Server Error

---

## Best Practices

### SOLID Principles

1. **Single Responsibility** - Each service handles one domain
2. **Open/Closed** - Services are open for extension via inheritance
3. **Liskov Substitution** - Controllers can be substituted with different implementations
4. **Interface Segregation** - Services expose only necessary methods
5. **Dependency Inversion** - Services depend on abstractions, not concrete implementations

### DRY (Don't Repeat Yourself)

- Shared utilities in `/shared` directory
- Common middleware for authentication & error handling
- Reusable validation rules

### Coding Standards

**Error Handling:**
```javascript
try {
  // operation
  await repository.operation();
} catch (error) {
  if (error instanceof APIError) throw error;
  throw new APIError(500, 'Operation failed', error.message);
}
```

**Validation:**
```javascript
const { validateRequest, validateStudent } = require('../shared/validators');

router.post('/', validateStudent, validateRequest, handler);
```

**Async Operations:**
```javascript
const { asyncHandler } = require('../shared/errors');

const handler = asyncHandler(async (req, res) => {
  const result = await service.operation();
  res.json({ success: true, data: result });
});
```

### Security Considerations

1. **Password Hashing** - Use bcrypt with salt rounds ≥ 10
2. **JWT Secrets** - Use strong, unique secrets in production
3. **Input Validation** - Always validate user input
4. **SQL Injection** - Use prepared statements (parameterized queries)
5. **Rate Limiting** - Implement rate limiting on public endpoints
6. **CORS** - Configure CORS appropriately for your domain

### Performance Tips

1. Use database indexes on frequently queried fields
2. Implement pagination for large datasets
3. Cache frequently accessed data
4. Use connection pooling for database queries
5. Monitor service health and response times

---

## Installation & Setup

See README.md for setup instructions.
