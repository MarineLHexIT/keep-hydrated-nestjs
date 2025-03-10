# Keep Hydrated API

A NestJS application to track daily water intake with authentication and quick access features.

## Prerequisites

- Node.js (v18 or later)
- Yarn
- Docker and Docker Compose
- MySQL (via Docker)

## Docker Configuration

The application uses Docker to run the MySQL database. The configuration is defined in `docker-compose.yml`:

```yaml
# Database container
- Port: 3306 (MySQL default)
- Database: keep_hydrated
- Root password: defined in .env file
- Volume: MySQL data persisted in docker volume

# Test Database container
- Port: 3307
- Database: keep_hydrated_test
- Used for running tests
```

### Docker Commands

```bash
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose down

# View container logs
docker-compose logs -f

# Access MySQL CLI
docker-compose exec db mysql -uroot -p

# Remove volumes (clean database)
docker-compose down -v
```

## Installation

```bash
# Install dependencies
yarn install

# Copy environment files
cp .env.example .env
cp .env.example .env.test
```

## Running the Application

```bash
# Start the database
yarn db:start

# Run database migrations
yarn db:migrate

# Start the application in development mode
yarn start:dev

# Access Prisma Studio (database GUI)
yarn db:studio
```

The application will be available at `http://localhost:3000`

## Testing

```bash
# Run unit tests
yarn test

# Run tests with environment variables
yarn test:with-env

# Run e2e tests
yarn test:e2e

# Generate test coverage
yarn test:cov
```

## API Endpoints

### Authentication

#### Register a new user
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",    // Required, unique email
  "password": "YourPassword123",  // Required, 8-72 chars, must have uppercase, lowercase, number
  "name": "Your Name"            // Optional, 2-50 chars, letters/spaces/hyphens/apostrophes
}
```
Response includes user data, JWT token, and quick access token.

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YourPassword123"
}
```
Response includes user data and JWT token.

#### Check Authentication & Get Profile
```http
GET /auth
Authorization: Bearer <jwt_token>
```
Response includes complete user profile (id, email, name, dailyGoal, quickAccessToken, lastQuickAccess, createdAt, updatedAt).

#### Generate Quick Access Token
```http
POST /auth/quick-access/generate
Authorization: Bearer <jwt_token>
```
Response includes updated user profile with new quick access token.

#### Revoke Quick Access Token
```http
POST /auth/quick-access/revoke
Authorization: Bearer <jwt_token>
```
Response includes updated user profile with quick access token removed.

#### Logout
```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```
Response confirms successful logout. Note: Token should be removed client-side.

### User Profile

#### Get User Profile
```http
GET /user/profile
Authorization: Bearer <jwt_token>
```
Response includes user information (id, email, name, dailyGoal, quickAccessToken, lastQuickAccess, createdAt, updatedAt) without the password.

#### Update User Profile
```http
PATCH /user/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "New Name",           // optional, 2-50 characters, letters/spaces/hyphens/apostrophes
  "email": "new@example.com",   // optional, must be unique
  "password": "NewPassword123", // optional, 8-72 chars, must contain uppercase, lowercase, and number
  "dailyGoal": 2000            // optional, 500-5000ml
}
```
Response includes the updated user profile without the password.

### Water Intake

#### Create a water intake
```http
POST /water-intake
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 500  // Optional, defaults to 500ml, range: 0-5000ml
}
```

#### Get today's water intake
```http
GET /water-intake/today
Authorization: Bearer <jwt_token>
```

#### Get all water intakes
```http
GET /water-intake
Authorization: Bearer <jwt_token>
```

#### Quick access (no authentication required)
```http
GET /water-intake/quick/<quick_access_token>
```

### Health Check

#### Check System Health
```http
GET /ping
```
Response includes:
- Application status
- Current timestamp
- Application version
- System uptime (in seconds)
- Database health (status and latency)
- Memory usage (total, free, and used in MB)

Example response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T12:00:00.000Z",
  "version": "0.0.1",
  "uptime": 3600,
  "database": {
    "status": "ok",
    "latency": 5
  },
  "memory": {
    "total": 16384,
    "free": 8192,
    "used": 8192
  }
}
```
Note: This endpoint is rate-limited.

## Environment Variables

### Application Variables
- `PORT`: Application port (default: 3000)
- `JWT_SECRET`: Secret key for JWT token generation

### Database Variables
- `DATABASE_URL`: MySQL connection string (format: `mysql://user:password@localhost:3306/database`)
- `MYSQL_ROOT_PASSWORD`: Root password for MySQL
- `MYSQL_DATABASE`: Database name (default: keep_hydrated)
- `MYSQL_TEST_DATABASE`: Test database name (default: keep_hydrated_test)
- `MYSQL_PORT`: MySQL port (default: 3306)
- `MYSQL_TEST_PORT`: Test MySQL port (default: 3307)

### Rate Limiting Variables
- `THROTTLE_TTL`: Time-to-live for the throttle counter in seconds (default: 60)
- `THROTTLE_LIMIT`: Number of requests allowed within the TTL period (default: 10)
- `QUICK_ACCESS_THROTTLE_TTL`: Time-to-live for quick access throttle in seconds (default: 300)
- `QUICK_ACCESS_THROTTLE_LIMIT`: Number of quick access requests allowed within the TTL period (default: 1)