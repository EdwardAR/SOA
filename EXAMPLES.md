# Example API Usage Guide

This document provides practical examples of using the School Management SOA System.

## 1. User Authentication Flow

### Step 1: Register a Student
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "john_student",
  "email": "john.student@school.com",
  "password": "SecurePass123!",
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
    "username": "john_student",
    "email": "john.student@school.com",
    "role": "student",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Step 2: Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john.student@school.com",
  "password": "SecurePass123!"
}
```

### Step 3: Save Token
Store the returned token for subsequent requests:
```
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 2. Student Management

### Create Student Profile
```bash
POST http://localhost:3000/api/students
Content-Type: application/json

{
  "enrollmentNumber": "STU-2024-001",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@school.com",
  "password": "InitialPass123",
  "dateOfBirth": "2006-03-15",
  "gender": "M",
  "phone": "+1-555-0100",
  "address": "123 Main Street",
  "city": "Springfield",
  "state": "IL",
  "postalCode": "62701"
}
```

### Get Student Information
```bash
GET http://localhost:3000/api/students/1
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": 1,
    "enrollment_number": "STU-2024-001",
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "2006-03-15",
    "gender": "M",
    "phone": "+1-555-0100",
    "address": "123 Main Street",
    "city": "Springfield",
    "state": "IL",
    "postal_code": "62701",
    "email": "john.doe@school.com",
    "role": "student"
  }
}
```

### Update Student Information
```bash
PUT http://localhost:3000/api/students/1
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "phone": "+1-555-0200",
  "address": "456 Oak Avenue"
}
```

### Search Students
```bash
GET http://localhost:3000/api/students/search?firstName=John&lastName=Doe
Authorization: Bearer {TOKEN}
```

---

## 3. Teacher Management

### Create Teacher
```bash
POST http://localhost:3000/api/teachers
Content-Type: application/json

{
  "employeeId": "EMP-2024-001",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@school.com",
  "password": "SecurePass456!",
  "specialization": "Mathematics",
  "phone": "+1-555-0300",
  "hireDate": "2023-08-01"
}
```

### Get All Teachers
```bash
GET http://localhost:3000/api/teachers?page=1&limit=20
Authorization: Bearer {TOKEN}
```

### Assign Teacher to Course
First, create a course (manually in database), then:
```bash
POST http://localhost:3000/api/teachers/1/courses
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "courseId": 1
}
```

### Get Teacher Courses
```bash
GET http://localhost:3000/api/teachers/1/courses
Authorization: Bearer {TOKEN}
```

---

## 4. Classroom & Enrollment Management

### Create Classroom (in database)
```sql
INSERT INTO classrooms (name, grade_level, capacity, room_number)
VALUES ('10-A', 10, 35, '101');
```

### Enroll Student in Classroom
```bash
POST http://localhost:3000/api/enrollments
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "studentId": 1,
  "classroomId": 1,
  "enrollmentDate": "2024-01-15"
}
```

### Get Student Enrollments
```bash
GET http://localhost:3000/api/enrollments/student/1
Authorization: Bearer {TOKEN}
```

### Get Classroom Enrollments
```bash
GET http://localhost:3000/api/enrollments/classroom/1
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "classroom_id": 1,
      "enrollment_date": "2024-01-15",
      "status": "active",
      "enrollment_number": "STU-2024-001",
      "first_name": "John",
      "last_name": "Doe",
      "classroom_name": "10-A"
    }
  ],
  "totalEnrollments": 1
}
```

---

## 5. Academic Records

### Register Grades
```bash
POST http://localhost:3000/api/academic/grades
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "studentId": 1,
  "courseId": 1,
  "teacherId": 1,
  "midtermScore": 85.5,
  "finalScore": 92.0,
  "recordedDate": "2024-04-15"
}
```

### Get Student Academic History
```bash
GET http://localhost:3000/api/academic/students/1/history
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "student_id": 1,
      "course_id": 1,
      "teacher_id": 1,
      "midterm_score": 85.5,
      "final_score": 92.0,
      "overall_score": 88.75,
      "grade": "B",
      "recorded_date": "2024-04-15",
      "course_name": "Mathematics",
      "course_code": "MATH-101",
      "teacher_first_name": "Jane",
      "teacher_last_name": "Smith"
    }
  ]
}
```

### Get Student GPA
```bash
GET http://localhost:3000/api/academic/students/1/gpa
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gpa": 88.75,
    "total_courses": 1,
    "grade_a_count": 0,
    "grade_b_count": 1,
    "grade_c_count": 0,
    "grade_d_count": 0,
    "grade_f_count": 0
  }
}
```

---

## 6. Attendance Tracking

### Mark Attendance
```bash
POST http://localhost:3000/api/attendance
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "studentId": 1,
  "classroomId": 1,
  "attendanceDate": "2024-04-15",
  "status": "present",
  "remarks": "On time",
  "markedBy": 1
}
```

### Get Student Attendance
```bash
GET http://localhost:3000/api/attendance/students/1?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {TOKEN}
```

### Get Attendance Summary
```bash
GET http://localhost:3000/api/attendance/students/1/summary
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "present": 75,
    "absent": 3,
    "late": 2,
    "excused": 0
  }
}
```

### Get Monthly Attendance Report
```bash
GET http://localhost:3000/api/attendance/students/1/monthly?month=4&year=2024
Authorization: Bearer {TOKEN}
```

### Get Classroom Attendance Report
```bash
GET http://localhost:3000/api/attendance/report/classroom?classroomId=1&attendanceDate=2024-04-15
Authorization: Bearer {TOKEN}
```

---

## 7. Payment Management

### Generate Invoice
```bash
POST http://localhost:3000/api/payments/invoices
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "studentId": 1,
  "feeType": "Tuition",
  "amount": 5000.00,
  "dueDate": "2024-05-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "data": {
    "id": 1,
    "invoiceId": "INV-1713196200000-abc123def",
    "studentId": 1,
    "feeType": "Tuition",
    "amount": 5000.00,
    "dueDate": "2024-05-31",
    "status": "pending",
    "createdAt": "2024-04-15T10:30:00.000Z"
  }
}
```

### Get Student Invoices
```bash
GET http://localhost:3000/api/payments/students/1/invoices?status=pending
Authorization: Bearer {TOKEN}
```

### Record Payment
```bash
POST http://localhost:3000/api/payments/1/record
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "paymentMethod": "credit_card",
  "transactionId": "TXN-2024-001"
}
```

### Get Payment Summary
```bash
GET http://localhost:3000/api/payments/students/1/summary
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_paid": 5000.00,
    "total_pending": 5000.00,
    "total_overdue": 0.00,
    "total_invoices": 2,
    "paid_count": 1,
    "pending_count": 1
  }
}
```

### Get Overdue Payments
```bash
GET http://localhost:3000/api/payments/report/overdue
Authorization: Bearer {TOKEN}
```

---

## 8. Notifications

### Send Email Notification
```bash
POST http://localhost:3000/api/notifications/send/email
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "recipientUserId": 1,
  "subject": "Grade Report Available",
  "message": "Your grades for the current semester have been posted. Please check your portal.",
  "recipientEmail": "john.doe@school.com"
}
```

### Send SMS Notification
```bash
POST http://localhost:3000/api/notifications/send/sms
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "recipientUserId": 1,
  "subject": "Attendance Alert",
  "message": "Your child was marked absent today",
  "phoneNumber": "+1-555-0100"
}
```

### Send In-App Notification
```bash
POST http://localhost:3000/api/notifications/send/in-app
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "recipientUserId": 1,
  "subject": "New Announcement",
  "message": "School will be closed on Friday for professional development day"
}
```

### Get User Notifications
```bash
GET http://localhost:3000/api/notifications/users/1?unreadOnly=true
Authorization: Bearer {TOKEN}
```

### Broadcast Notification to Multiple Users
```bash
POST http://localhost:3000/api/notifications/broadcast
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "recipientUserIds": [1, 2, 3, 4, 5],
  "subject": "Important: School Holiday",
  "message": "School will be closed from April 20-25 for spring break",
  "notificationType": "email"
}
```

### Mark Notification as Read
```bash
PUT http://localhost:3000/api/notifications/1/read
Authorization: Bearer {TOKEN}
```

---

## 9. Complete Workflow Example

### Scenario: Register and Manage a Student

**Step 1:** Register User
```bash
POST http://localhost:3000/api/auth/register
```

**Step 2:** Create Student Profile
```bash
POST http://localhost:3000/api/students
```

**Step 3:** Get Student ID from response, then enroll in classroom
```bash
POST http://localhost:3000/api/enrollments
```

**Step 4:** Record Attendance Daily
```bash
POST http://localhost:3000/api/attendance
```

**Step 5:** Record Grades After Each Test
```bash
POST http://localhost:3000/api/academic/grades
```

**Step 6:** Generate Invoice for Fees
```bash
POST http://localhost:3000/api/payments/invoices
```

**Step 7:** Send Notifications to Parents
```bash
POST http://localhost:3000/api/notifications/send/email
```

---

## Error Handling Examples

### Invalid Token
```bash
GET http://localhost:3000/api/students/1
Authorization: Bearer invalid_token
```

**Response:**
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "timestamp": "2024-04-15T10:30:00.000Z"
}
```

### Resource Not Found
```bash
GET http://localhost:3000/api/students/9999
Authorization: Bearer {TOKEN}
```

**Response:**
```json
{
  "success": false,
  "message": "Student not found",
  "timestamp": "2024-04-15T10:30:00.000Z"
}
```

### Validation Error
```bash
POST http://localhost:3000/api/students
Content-Type: application/json

{
  "firstName": "John"
  // Missing required fields
}
```

**Response:**
```json
{
  "success": false,
  "message": "Validation Error",
  "details": [
    {
      "msg": "Last name is required",
      "param": "lastName"
    },
    {
      "msg": "Valid email is required",
      "param": "email"
    }
  ],
  "timestamp": "2024-04-15T10:30:00.000Z"
}
```

---

## Tips for Testing

1. **Use Postman** - Import these examples into Postman
2. **Save responses** - Store IDs from responses for subsequent requests
3. **Use environment variables** - Store TOKEN as Postman variable
4. **Test error cases** - Try invalid data and expired tokens
5. **Monitor logs** - Check server logs for detailed error messages

---

## Common Issues & Solutions

**Issue:** "Database connection error"
- **Solution:** Verify MySQL is running and credentials are correct in .env

**Issue:** "Token expired"
- **Solution:** Login again to get a new token

**Issue:** "Resource not found"
- **Solution:** Verify the ID exists before making requests

**Issue:** "Validation error"
- **Solution:** Check required fields in API_DOCUMENTATION.md

**Issue:** "Port already in use"
- **Solution:** Change port in .env or kill process using the port

---

## Next Steps

1. Review API_DOCUMENTATION.md for complete endpoint reference
2. Explore service-to-service communication
3. Implement frontend to consume these APIs
4. Set up monitoring and logging
5. Deploy to production environment
