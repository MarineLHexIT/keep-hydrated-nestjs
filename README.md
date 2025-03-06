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
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YourPassword123",
  "name": "Your Name"
}
```

#### Login
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "YourPassword123"
}
```

### Water Intake

#### Create a water intake
```http
POST http://localhost:3000/water-intake
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "amount": 500
}
```

#### Get today's water intake
```http
GET http://localhost:3000/water-intake/today
Authorization: Bearer <your_jwt_token>
```

#### Get all water intakes
```http
GET http://localhost:3000/water-intake
Authorization: Bearer <your_jwt_token>
```

#### Quick access (no authentication required)
```http
GET http://localhost:3000/water-intake/quick/<quick_access_token>
```

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
