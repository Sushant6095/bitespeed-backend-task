import 'dotenv/config';
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { identifyContact, IdentifyRequest } from './contact.service';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - allow Hopscotch web on localhost:3000
app.use(cors({
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello World! TypeScript Express server is running.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /identify route - fetch and display all saved contacts
app.get('/identify', async (req: Request, res: Response) => {
  try {
    // Fetch all contacts from database (excluding deleted ones)
    const allContacts = await prisma.contact.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group contacts by primary and secondary
    const primaryContacts = allContacts.filter(c => c.linkPrecedence === 'PRIMARY');
    const secondaryContacts = allContacts.filter(c => c.linkPrecedence === 'SECONDARY');

    // Format the response
    const formattedContacts = primaryContacts.map(primary => {
      const relatedSecondaries = secondaryContacts.filter(s => s.linkedId === primary.id);
      
      return {
        primaryContact: {
          id: primary.id,
          email: primary.email,
          phoneNumber: primary.phoneNumber,
          linkPrecedence: primary.linkPrecedence,
          createdAt: primary.createdAt,
          updatedAt: primary.updatedAt
        },
        secondaryContacts: relatedSecondaries.map(secondary => ({
          id: secondary.id,
          email: secondary.email,
          phoneNumber: secondary.phoneNumber,
          linkPrecedence: secondary.linkPrecedence,
          linkedId: secondary.linkedId,
          createdAt: secondary.createdAt,
          updatedAt: secondary.updatedAt
        })),
        totalContacts: 1 + relatedSecondaries.length
      };
    });

    // Send HTML response with the data
    res.send(`
      <h1>Bitespeed Identity Service - Database Contents</h1>
      <p>Status: API is healthy and running! ✅</p>
      <hr>
      
      <h3>📊 Database Statistics:</h3>
      <p><strong>Total Primary Contacts:</strong> ${primaryContacts.length}</p>
      <p><strong>Total Secondary Contacts:</strong> ${secondaryContacts.length}</p>
      <p><strong>Total Contacts:</strong> ${allContacts.length}</p>
      
      <hr>
      
      <h3>🔍 All Saved Contacts:</h3>
      ${formattedContacts.length > 0 ? 
        formattedContacts.map((group, index) => `
          <div style="border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px;">
            <h4>📋 Contact Group ${index + 1}</h4>
            <p><strong>Primary Contact:</strong></p>
            <ul>
              <li><strong>ID:</strong> ${group.primaryContact.id}</li>
              <li><strong>Email:</strong> ${group.primaryContact.email || 'N/A'}</li>
              <li><strong>Phone:</strong> ${group.primaryContact.phoneNumber || 'N/A'}</li>
              <li><strong>Created:</strong> ${new Date(group.primaryContact.createdAt).toLocaleString()}</li>
            </ul>
            
            ${group.secondaryContacts.length > 0 ? `
              <p><strong>Secondary Contacts (${group.secondaryContacts.length}):</strong></p>
              <ul>
                ${group.secondaryContacts.map(sec => `
                  <li>
                    <strong>ID:</strong> ${sec.id} | 
                    <strong>Email:</strong> ${sec.email || 'N/A'} | 
                    <strong>Phone:</strong> ${sec.phoneNumber || 'N/A'} |
                    <strong>Linked to:</strong> ${sec.linkedId}
                  </li>
                `).join('')}
              </ul>
            ` : '<p><em>No secondary contacts linked</em></p>'}
          </div>
        `).join('') : 
        '<p><em>No contacts found in database</em></p>'
      }
      
      <hr>
      
      <h3>📝 How to Add New Contacts:</h3>
      <p><strong>Endpoint:</strong> <code>POST /identify</code></p>
      <p><strong>Example:</strong></p>
      <pre><code>curl -X POST http://localhost:3000/identify \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "phoneNumber": "+1234567890"}'</code></pre>
      
      <p><strong>Note:</strong> At least one of <code>email</code> or <code>phoneNumber</code> must be provided.</p>
      
      <hr>
      <p><a href="https://github.com/Sushant6095/bitespeed-backend-task">View Source Code on GitHub</a></p>
    `);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).send(`
      <h1>Bitespeed Identity Service</h1>
      <p>Status: ❌ Error fetching data from database</p>
      <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <hr>
      <p>Please check your database connection and try again.</p>
    `);
  }
});

// POST /identify route
app.post('/identify', async (req: Request<{}, any, IdentifyRequest>, res: Response): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;

    // Enhanced validation with better error messages
    if (!email && !phoneNumber) {
      res.status(400).json({
        error: 'At least one of email or phoneNumber must be provided',
        message: 'Please provide either an email address or phone number in the request body',
        example: {
          email: 'user@example.com',
          phoneNumber: '+1234567890'
        },
        received: {
          email: email || null,
          phoneNumber: phoneNumber || null
        }
      });
      return;
    }

    // Additional validation for email format if provided
    if (email && typeof email === 'string' && email.trim() === '') {
      res.status(400).json({
        error: 'Invalid email format',
        message: 'Email cannot be empty or just whitespace'
      });
      return;
    }

    // Additional validation for phone number format if provided
    if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim() === '') {
      res.status(400).json({
        error: 'Invalid phone number format',
        message: 'Phone number cannot be empty or just whitespace'
      });
      return;
    }

    // Clean the input data
    const cleanEmail = email ? email.trim() : undefined;
    const cleanPhoneNumber = phoneNumber ? phoneNumber.trim() : undefined;

    console.log(`🔍 Processing identify request:`, { email: cleanEmail, phoneNumber: cleanPhoneNumber });

    const result = await identifyContact(cleanEmail, cleanPhoneNumber);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');

  // Close Prisma connection
  await prisma.$disconnect();
  console.log('📦 Database connection closed');

  // Close server
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');

  // Close Prisma connection
  await prisma.$disconnect();
  console.log('📦 Database connection closed');

  // Close server
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0);
  });
});

export default app;
