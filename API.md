# Contact Identity Reconciliation API

## Overview
This API provides contact identity reconciliation functionality, allowing you to identify and link contacts based on email addresses and phone numbers.

## Endpoints

### POST /identify

Identifies and consolidates contact information based on email and/or phone number.

#### Request Body
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Note:** At least one of `email` or `phoneNumber` must be provided.

#### Response
```json
{
  "contact": {
    "primaryContatctId": "number",
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": ["number"]
  }
}
```

#### Response Fields
- `primaryContatctId`: The ID of the primary contact
- `emails`: Array of all unique email addresses associated with this identity (primary contact's email first)
- `phoneNumbers`: Array of all unique phone numbers associated with this identity (primary contact's phone first)
- `secondaryContactIds`: Array of IDs of all secondary contacts linked to the primary contact

#### Examples

**Example 1: New Contact**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "+1234567890"}'
```

Response:
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

**Example 2: Linking Existing Contacts**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "+9876543210"}'
```

Response:
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

## Business Logic

### Contact Consolidation Rules

1. **New Contact**: If no existing contacts match the provided email or phone number, a new PRIMARY contact is created.

2. **Existing Contact Found**: If contacts are found that match the email or phone number:
   - All related contacts (primary and secondary) are identified
   - If multiple primary contacts exist, they are consolidated:
     - The oldest primary contact (by creation date) remains primary
     - Newer primary contacts become secondary and are linked to the oldest
   - If the request contains new information (email or phone not yet associated), a new secondary contact is created

3. **Response Format**: The response always includes:
   - The primary contact ID
   - All unique emails and phone numbers in the identity
   - All secondary contact IDs

### Database Schema

The system uses a `contacts` table with the following structure:
- `id`: Primary key (auto-increment)
- `phoneNumber`: Optional string
- `email`: Optional string  
- `linkedId`: Optional foreign key to another contact (for secondary contacts)
- `linkPrecedence`: Enum (PRIMARY or SECONDARY)
- `createdAt`: Timestamp (auto-generated)
- `updatedAt`: Timestamp (auto-updated)
- `deletedAt`: Optional timestamp for soft deletes

## Error Handling

- **400 Bad Request**: When neither email nor phoneNumber is provided
- **500 Internal Server Error**: For database errors or other server issues

## Health Check

### GET /health

Returns the server and database status.

Response:
```json
{
  "status": "OK",
  "uptime": 123.456,
  "timestamp": "2023-08-11T10:30:00.000Z",
  "database": "Connected"
}
```
