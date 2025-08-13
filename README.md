# Contact Identity Reconciliation API

A robust REST API service that identifies and consolidates customer contact information across multiple touchpoints. The service intelligently links contacts based on email addresses and phone numbers, maintaining a unified customer identity while preserving data relationships.
<img width="589" height="452" alt="Screenshot 2025-08-13 124826" src="https://github.com/user-attachments/assets/8511bfa5-fec0-4d09-b36d-d370cb0c7c94" />
<img width="638" height="389" alt="Screenshot 2025-08-13 125820" src="https://github.com/user-attachments/assets/b5c52f5b-5379-4e82-b0af-1044257bf3de" />

## 🚀 Features

- **Smart Contact Linking**: Automatically identifies and links related contacts based on shared email or phone number
- **Primary Contact Management**: Maintains a single primary contact per identity with linked secondary contacts
- **Data Consolidation**: Merges multiple primary contacts when connections are discovered
- **RESTful API**: Clean, intuitive API design with comprehensive error handling
- **Production Ready**: Containerized with Docker, ready for cloud deployment

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Containerization**: Docker
- **Deployment**: Render.com

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

## 🏃‍♂️ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bitespeed2
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/bitespeed?schema=public"
PORT=3000
NODE_ENV=development
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 5. Start the Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 🔗 API Endpoint

### POST /identify

Identifies and consolidates contact information based on email and/or phone number.

#### Request

**URL**: `POST /identify`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

> **Note**: At least one of `email` or `phoneNumber` must be provided.

#### Response

**Success (200 OK)**:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["+919191919191"],
    "secondaryContactIds": [23]
  }
}
```

**Error (400 Bad Request)**:
```json
{
  "error": "At least one of email or phoneNumber must be provided"
}
```

**Error (500 Internal Server Error)**:
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

#### Response Fields

- `primaryContatctId`: The ID of the primary contact for this identity
- `emails`: Array of all unique email addresses (primary contact's email first)
- `phoneNumbers`: Array of all unique phone numbers (primary contact's phone first)
- `secondaryContactIds`: Array of IDs of all secondary contacts linked to the primary

## 📚 API Examples

### Example 1: New Contact

**Request**:
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "+1234567890"}'
```

**Response**:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["test@example.com"],
    "phoneNumbers": ["+1234567890"],
    "secondaryContactIds": []
  }
}
```

### Example 2: Linking Existing Contacts

**Request**:
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "+9876543210"}'
```

**Response**:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["test@example.com"],
    "phoneNumbers": ["+1234567890", "+9876543210"],
    "secondaryContactIds": [2]
  }
}
```

## 🏥 Health Check

### GET /health

Returns the current status of the API and database connection.

**Response**:
```json
{
  "status": "OK",
  "uptime": 123.456,
  "timestamp": "2023-08-11T10:30:00.000Z",
  "database": "Connected"
}
```

## 🧪 Testing

### Run Test Suite

```bash
# Run the identification service test
npm run test:identify
```

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test identify endpoint
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "+1234567890"}'
```

## 🐳 Docker Support

### Local Development with Docker

```bash
# Build and run with docker-compose
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

### Build Docker Image

```bash
# Build production image
npm run docker:build

# Run container
npm run docker:run
```

## 🚀 Deployment

The application is configured for deployment on Render.com with automatic database provisioning and migrations.

### Hosted API Endpoint

```
🔗 Production API: [TO BE UPDATED AFTER DEPLOYMENT]
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 📖 Additional Documentation

- [API Documentation](./API.md) - Detailed API specifications and business logic
- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions for Render.com

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [package.json](./package.json) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [API Documentation](./API.md) for detailed information
2. Review the [Deployment Guide](./DEPLOYMENT.md) for deployment issues
3. Open an issue in the repository for bugs or feature requests

---

**Built with ❤️ using Node.js, TypeScript, Express, Prisma, and PostgreSQL**
