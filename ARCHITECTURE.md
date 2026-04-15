# Architecture & Best Practices Guide

## Table of Contents
1. [SOLID Principles Implementation](#solid-principles-implementation)
2. [Design Patterns](#design-patterns)
3. [Code Quality Standards](#code-quality-standards)
4. [Security Best Practices](#security-best-practices)
5. [Performance Optimization](#performance-optimization)
6. [Testing Strategies](#testing-strategies)

---

## SOLID Principles Implementation

### 1. Single Responsibility Principle (SRP)

**Definition:** Each class/module should have only one reason to change.

**Implementation in this project:**

```javascript
// ✅ Good: StudentService handles only student business logic
class StudentService {
  async registerStudent(studentData) {
    // Business logic for student registration
  }
  
  async getStudentById(id) {
    // Business logic for retrieving student
  }
}

// ✅ Good: StudentRepository handles only data access
class StudentRepository {
  async create(studentData) {
    // Database insertion
  }
  
  async findById(id) {
    // Database query
  }
}

// ✅ Good: StudentController handles only HTTP concerns
class StudentController {
  async registerStudent(req, res) {
    // HTTP request/response handling
    const result = await this.service.registerStudent(req.body);
    res.json(result);
  }
}
```

**Benefits:**
- Easy to maintain and modify
- Easier to test
- Better code reusability
- Clear separation of concerns

---

### 2. Open/Closed Principle (OCP)

**Definition:** Classes should be open for extension, closed for modification.

**Implementation:**

```javascript
// ✅ Good: Base notification service can be extended
class NotificationService {
  async send(data) {
    throw new Error('Must be implemented');
  }
}

// Email-specific implementation
class EmailNotificationService extends NotificationService {
  async send(data) {
    // Email-specific logic
    await this.emailTransporter.sendMail(data);
  }
}

// SMS-specific implementation
class SMSNotificationService extends NotificationService {
  async send(data) {
    // SMS-specific logic
    await this.twilioClient.send(data);
  }
}

// Usage without modification to existing code
const services = {
  email: new EmailNotificationService(),
  sms: new SMSNotificationService(),
  inApp: new InAppNotificationService()
};

const notifyUser = async (type, data) => {
  return services[type].send(data);
};
```

**Benefits:**
- Add new notification types without modifying existing code
- Reduces risk of breaking existing functionality
- Encourages code reuse

---

### 3. Liskov Substitution Principle (LSP)

**Definition:** Subtypes should be substitutable for their base types.

**Implementation:**

```javascript
// Base class
class BaseService {
  async validate(data) {
    // Common validation
  }
  
  async checkPermissions(user) {
    // Common permission check
  }
}

// All subclasses can be used interchangeably
class StudentService extends BaseService {
  async registerStudent(data) {
    await this.validate(data);
    await this.checkPermissions(user);
    // Proceed with registration
  }
}

class TeacherService extends BaseService {
  async createTeacher(data) {
    await this.validate(data);
    await this.checkPermissions(user);
    // Proceed with creation
  }
}

// Can use any service without knowing implementation
const processEntity = async (service, data, user) => {
  await service.validate(data);
  await service.checkPermissions(user);
  return await service.create(data);
};
```

---

### 4. Interface Segregation Principle (ISP)

**Definition:** Clients should depend on small, specific interfaces.

**Implementation:**

```javascript
// ✅ Good: Specific interfaces
class UserRepository {
  async findById(id) { }
  async findByEmail(email) { }
}

class AuthService {
  // Only uses what it needs
  async authenticate(email, password) {
    const user = await this.userRepository.findByEmail(email);
    // ...
  }
}

// ✅ Good: Not forcing unnecessary dependencies
class PaymentService {
  // Depends only on payment-related methods
  async recordPayment(paymentData) {
    // Doesn't need UserRepository methods for registration
  }
}
```

---

### 5. Dependency Inversion Principle (DIP)

**Definition:** Depend on abstractions, not concrete implementations.

**Implementation:**

```javascript
// ❌ Bad: Depends on concrete class
class StudentService {
  constructor() {
    this.db = new MySQLDatabase(); // Tightly coupled
  }
}

// ✅ Good: Depends on abstraction (interface)
class StudentService {
  constructor(repository) {
    this.repository = repository; // Injected dependency
  }
  
  async registerStudent(data) {
    return await this.repository.create(data);
  }
}

// Can use any repository implementation
const repository = new StudentRepository(pool);
const service = new StudentService(repository);

// Or for testing
const mockRepository = new MockStudentRepository();
const testService = new StudentService(mockRepository);
```

**Benefits:**
- Easy to test with mock objects
- Can switch implementations without code changes
- Reduces coupling between components

---

## Design Patterns

### 1. Repository Pattern

**Purpose:** Abstraction for data access layer.

```javascript
// Repository interface
class IRepository {
  async create(data) { }
  async findById(id) { }
  async update(id, data) { }
  async delete(id) { }
}

// Implementation
class StudentRepository extends IRepository {
  async create(data) {
    const query = 'INSERT INTO students (...) VALUES (...)';
    const [result] = await pool.execute(query, [...]);
    return result;
  }
  
  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM students WHERE id = ?', [id]);
    return rows[0];
  }
}

// Usage in Service
class StudentService {
  constructor(repository) {
    this.repository = repository;
  }
  
  async getStudent(id) {
    return await this.repository.findById(id);
  }
}
```

**Benefits:**
- Hides database implementation details
- Easy to switch databases
- Simplified testing

---

### 2. Service Layer Pattern

**Purpose:** Business logic separation.

```javascript
class StudentService {
  constructor(repository) {
    this.repository = repository;
  }
  
  // Business logic encapsulated here
  async registerStudent(studentData) {
    // Validate data
    this.validateStudentData(studentData);
    
    // Check for duplicates
    const existing = await this.repository.findByEmail(studentData.email);
    if (existing) throw new Error('Email already registered');
    
    // Hash password
    const hashedPassword = await bcrypt.hash(studentData.password, 10);
    
    // Create student
    return await this.repository.create({
      ...studentData,
      password: hashedPassword
    });
  }
  
  validateStudentData(data) {
    if (!data.firstName) throw new Error('First name required');
    if (!data.email) throw new Error('Email required');
  }
}
```

---

### 3. Middleware Pattern

**Purpose:** Cross-cutting concerns (authentication, logging, etc.).

```javascript
// Authentication middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token' });
  }
  
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Logging middleware
const loggingMiddleware = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
};

// Usage
app.use(loggingMiddleware);
app.get('/protected-route', authMiddleware, handler);
```

---

### 4. Error Handling Pattern

**Purpose:** Centralized error handling.

```javascript
// Custom error class
class APIError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Async wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Service implementation
class StudentService {
  async getStudent(id) {
    const student = await this.repository.findById(id);
    if (!student) {
      throw new APIError(404, 'Student not found');
    }
    return student;
  }
}

// Controller implementation
class StudentController {
  getStudent = asyncHandler(async (req, res) => {
    const student = await this.service.getStudent(req.params.id);
    res.json({ success: true, data: student });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    message,
    details: err.details,
    timestamp: new Date().toISOString()
  });
});
```

---

## Code Quality Standards

### 1. Naming Conventions

```javascript
// ✅ Good: Clear, descriptive names
async registerStudent(studentData) { }
async getEnrollmentsByDateRange(startDate, endDate) { }
async calculateStudentGPA(studentId) { }

// ❌ Bad: Unclear abbreviations
async reg_stud(sd) { }
async getEnr(s, e) { }
async calcGPA(sid) { }
```

### 2. Function Complexity

```javascript
// ✅ Good: Single responsibility
async createStudent(data) {
  const hashedPassword = await this.hashPassword(data.password);
  return await this.repository.create({
    ...data,
    password: hashedPassword
  });
}

private async hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// ❌ Bad: Too many responsibilities
async createStudent(data) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const student = await this.repository.create({...data, password: hashedPassword});
  await this.sendWelcomeEmail(data.email);
  await this.logAudit('student_created', student.id);
  await this.notifyAdmins(student);
  return student;
}
```

### 3. Error Handling

```javascript
// ✅ Good: Specific error handling
try {
  const result = await this.repository.findById(id);
  if (!result) {
    throw new APIError(404, 'Student not found');
  }
  return result;
} catch (error) {
  if (error instanceof APIError) throw error;
  throw new APIError(500, 'Database error', error.message);
}

// ❌ Bad: Swallowing errors
try {
  return await this.repository.findById(id);
} catch (e) {
  return null; // Error hidden
}
```

### 4. Documentation

```javascript
/**
 * Register a new student in the system
 * @param {Object} studentData - Student information
 * @param {string} studentData.firstName - Student's first name
 * @param {string} studentData.email - Valid email address
 * @param {string} studentData.password - Minimum 8 characters
 * @returns {Promise<Object>} Created student object with ID
 * @throws {APIError} If student already exists or validation fails
 * @example
 * const student = await service.registerStudent({
 *   firstName: 'John',
 *   email: 'john@example.com',
 *   password: 'SecurePass123'
 * });
 */
async registerStudent(studentData) {
  // Implementation
}
```

---

## Security Best Practices

### 1. Password Security

```javascript
// ✅ Good: Proper password hashing
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// ❌ Bad: Weak password handling
const simpleHash = (password) => Buffer.from(password).toString('base64');
```

### 2. SQL Injection Prevention

```javascript
// ✅ Good: Parameterized queries
const query = 'SELECT * FROM students WHERE id = ? AND status = ?';
const [students] = await pool.execute(query, [id, status]);

// ❌ Bad: String concatenation
const query = `SELECT * FROM students WHERE id = ${id} AND status = '${status}'`;
const students = await pool.query(query);
```

### 3. Input Validation

```javascript
// ✅ Good: Validate all inputs
const { body, validationResult } = require('express-validator');

const validateStudent = [
  body('firstName').notEmpty().trim(),
  body('email').isEmail(),
  body('dateOfBirth').isISO8601(),
  body('gender').isIn(['M', 'F', 'Other'])
];

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new APIError(400, 'Validation Error', errors.array());
  }
  next();
};

// Usage
router.post('/', validateStudent, validateRequest, handler);
```

### 4. JWT Security

```javascript
// ✅ Good: Secure token handling
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET, // Strong, unique secret
    { expiresIn: '7d' } // Short expiration
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// ❌ Bad: Weak secret
jwt.sign(data, 'secret123'); // Too weak
jwt.sign(data, 'secret', { expiresIn: '365d' }); // Too long expiration
```

---

## Performance Optimization

### 1. Database Indexing

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_enrollment_number ON students(enrollment_number);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_attendance_attendance_date ON attendance(attendance_date);
```

### 2. Query Optimization

```javascript
// ✅ Good: Use SELECT with specific columns
const query = 'SELECT id, first_name, last_name, email FROM students WHERE id = ?';

// ❌ Bad: Select all columns when not needed
const query = 'SELECT * FROM students WHERE id = ?';

// ✅ Good: Use JOIN for related data
const query = `
  SELECT s.*, c.name as classroom_name
  FROM students s
  LEFT JOIN enrollments e ON s.id = e.student_id
  LEFT JOIN classrooms c ON e.classroom_id = c.id
  WHERE s.id = ?
`;
```

### 3. Connection Pooling

```javascript
// ✅ Good: Use connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'school_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Use pool for all queries
const [rows] = await pool.execute(query, params);
```

### 4. Pagination

```javascript
// ✅ Good: Paginate large datasets
const getAllStudents = async (page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  const query = 'SELECT * FROM students LIMIT ? OFFSET ?';
  const [students] = await pool.execute(query, [limit, offset]);
  return students;
};

// Usage
const students = await service.getAllStudents(1, 50);
```

---

## Testing Strategies

### 1. Unit Testing

```javascript
// Test individual functions
describe('StudentService', () => {
  let service;
  let mockRepository;
  
  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn()
    };
    service = new StudentService(mockRepository);
  });
  
  test('should register a new student', async () => {
    const studentData = {
      firstName: 'John',
      email: 'john@example.com',
      password: 'pass123'
    };
    
    mockRepository.create.mockResolvedValue({ id: 1, ...studentData });
    
    const result = await service.registerStudent(studentData);
    
    expect(result.id).toBe(1);
    expect(mockRepository.create).toHaveBeenCalled();
  });
});
```

### 2. Integration Testing

```javascript
// Test service interactions
describe('Student Registration Flow', () => {
  test('should register and enroll student', async () => {
    // Create student
    const student = await studentService.registerStudent(studentData);
    
    // Enroll student
    const enrollment = await enrollmentService.enrollStudent({
      studentId: student.id,
      classroomId: 1,
      enrollmentDate: '2024-01-15'
    });
    
    expect(enrollment.studentId).toBe(student.id);
  });
});
```

### 3. API Testing

```javascript
// Test HTTP endpoints
describe('Student API', () => {
  test('POST /api/students should create student', async () => {
    const response = await request(app)
      .post('/api/students')
      .send({
        firstName: 'John',
        email: 'john@example.com',
        // ...
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

---

## Summary

### Key Takeaways

1. **Follow SOLID principles** for maintainable code
2. **Use design patterns** for proven solutions
3. **Maintain code quality** with clear naming and documentation
4. **Prioritize security** with proper validation and encryption
5. **Optimize performance** with indexes and pagination
6. **Test thoroughly** at all levels

### Continuous Improvement

- Regular code reviews
- Performance monitoring
- Security audits
- User feedback incorporation
- Technical debt management

---

This guide should help you build scalable, maintainable, and secure applications following industry best practices.
