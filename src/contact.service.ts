import { PrismaClient, Contact, LinkPrecedence } from '@prisma/client';

const prisma = new PrismaClient();

export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export interface IdentifyResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export async function identifyContact(
  email?: string,
  phoneNumber?: string
): Promise<IdentifyResponse> {
  console.log(`🔍 Identifying contact with email: ${email || 'none'}, phoneNumber: ${phoneNumber || 'none'}`);

  try {
  // Step 1: Find all existing contacts that match either the provided email or phoneNumber
  // Filter out null/undefined inputs to avoid unnecessary queries
  const whereConditions = [];

  if (email) {
    whereConditions.push({ email });
  }

  if (phoneNumber) {
    whereConditions.push({ phoneNumber });
  }

  // If no valid input provided, this should have been caught by the route handler
  if (whereConditions.length === 0) {
    throw new Error('At least one of email or phoneNumber must be provided');
  }

  // Query for existing contacts matching email or phoneNumber
  // Only include non-deleted contacts (deletedAt is null)
  const existingContacts = await prisma.contact.findMany({
    where: {
      AND: [
        { deletedAt: null }, // Only non-deleted contacts
        { OR: whereConditions }
      ]
    },
    orderBy: { createdAt: 'asc' } // Order by creation time for consistent processing
  });

  console.log(`Found ${existingContacts.length} existing contacts`);

  // Case 1: No existing contacts found - create a new PRIMARY contact
  if (existingContacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkedId: null,
        linkPrecedence: LinkPrecedence.PRIMARY,
      },
    });

    console.log(`Created new PRIMARY contact with ID: ${newContact.id}`);

    return {
      contact: {
        primaryContatctId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }

  // Case 2 & 3: Existing contacts found - need to handle consolidation and linking

  // Step 1: Get all related contacts (including those linked to the found contacts)
  const allRelatedContactIds = new Set<number>();
  const primaryContactIds = new Set<number>();

  // Add all found contact IDs and their primary contact IDs
  for (const contact of existingContacts) {
    allRelatedContactIds.add(contact.id);

    if (contact.linkPrecedence === LinkPrecedence.PRIMARY) {
      primaryContactIds.add(contact.id);
    } else if (contact.linkedId) {
      primaryContactIds.add(contact.linkedId);
      allRelatedContactIds.add(contact.linkedId);
    }
  }

  // Fetch all related contacts to get the complete picture
  const allRelatedContacts = await prisma.contact.findMany({
    where: {
      AND: [
        { deletedAt: null },
        {
          OR: [
            { id: { in: Array.from(allRelatedContactIds) } },
            { linkedId: { in: Array.from(primaryContactIds) } }
          ]
        }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Found ${allRelatedContacts.length} total related contacts`);

  // Step 2: Identify all primary contacts and find the oldest one
  const primaryContacts = allRelatedContacts.filter(
    (contact: Contact) => contact.linkPrecedence === LinkPrecedence.PRIMARY
  );

  // Sort primary contacts by creation date to find the oldest
  primaryContacts.sort((a: Contact, b: Contact) => a.createdAt.getTime() - b.createdAt.getTime());
  const oldestPrimary = primaryContacts[0];

  console.log(`Found ${primaryContacts.length} primary contacts, oldest: ${oldestPrimary ? oldestPrimary.id : 'none'}`);
  if (!oldestPrimary) {
    throw new Error('No primary contact found to consolidate.');
  }

  // Step 3: If there are multiple primary contacts, consolidate them
  if (primaryContacts.length > 1) {
    const contactsToUpdate = primaryContacts.slice(1); // All except the oldest

    console.log(`Consolidating ${contactsToUpdate.length} primary contacts to secondary`);

    // Update newer primary contacts to become secondary and link to the oldest
    await prisma.contact.updateMany({
      where: {
        id: { in: contactsToUpdate.map((c: Contact) => c.id) }
      },
      data: {
        linkPrecedence: LinkPrecedence.SECONDARY,
        linkedId: oldestPrimary.id,
      }
    });

    // Also update any contacts that were linked to the now-secondary contacts
    for (const contactToUpdate of contactsToUpdate) {
      await prisma.contact.updateMany({
        where: {
          linkedId: contactToUpdate.id
        },
        data: {
          linkedId: oldestPrimary.id
        }
      });
    }
  }

  // Step 4: Check if the incoming request contains new information
  // Get all current emails and phone numbers in the identity
  const currentEmails = new Set<string>();
  const currentPhoneNumbers = new Set<string>();

  for (const contact of allRelatedContacts) {
    if (contact.email) currentEmails.add(contact.email);
    if (contact.phoneNumber) currentPhoneNumbers.add(contact.phoneNumber);
  }

  // Check if we need to create a new secondary contact for new information
  const hasNewEmail = email && !currentEmails.has(email);
  const hasNewPhoneNumber = phoneNumber && !currentPhoneNumbers.has(phoneNumber);

  if (hasNewEmail || hasNewPhoneNumber) {
    console.log(`Creating new secondary contact for new information`);

    await prisma.contact.create({
      data: {
        email: hasNewEmail ? email : null,
        phoneNumber: hasNewPhoneNumber ? phoneNumber : null,
        linkedId: oldestPrimary.id,
        linkPrecedence: LinkPrecedence.SECONDARY,
      },
    });
  }

  // Step 5: Query the final state and format the response
  // Get the complete, updated picture of the contact identity
  const finalContacts = await prisma.contact.findMany({
    where: {
      AND: [
        { deletedAt: null },
        {
          OR: [
            { id: oldestPrimary.id },
            { linkedId: oldestPrimary.id }
          ]
        }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });

  // Separate primary and secondary contacts
  const primaryContact = finalContacts.find((c: Contact) => c.linkPrecedence === LinkPrecedence.PRIMARY);
  const secondaryContacts = finalContacts.filter((c: Contact) => c.linkPrecedence === LinkPrecedence.SECONDARY);

  if (!primaryContact) {
    throw new Error('Primary contact not found after processing');
  }

  // Collect all unique emails and phone numbers
  const allEmails = new Set<string>();
  const allPhoneNumbers = new Set<string>();

  // Add primary contact's information first
  if (primaryContact.email) allEmails.add(primaryContact.email);
  if (primaryContact.phoneNumber) allPhoneNumbers.add(primaryContact.phoneNumber);

  // Add secondary contacts' information
  for (const contact of secondaryContacts) {
    if (contact.email) allEmails.add(contact.email);
    if (contact.phoneNumber) allPhoneNumbers.add(contact.phoneNumber);
  }

  // Format the final response
  const response = {
    contact: {
      primaryContatctId: primaryContact.id,
      emails: Array.from(allEmails),
      phoneNumbers: Array.from(allPhoneNumbers),
      secondaryContactIds: secondaryContacts.map((c: Contact) => c.id),
    },
  };

  console.log(`✅ Contact identification complete. Primary: ${primaryContact.id}, Secondary: [${response.contact.secondaryContactIds.join(', ')}]`);
  return response;

  } catch (error) {
    console.error('❌ Error in identifyContact:', error);
    throw error;
  }
}

// Helper function to close the Prisma connection (useful for testing)
export async function closePrismaConnection(): Promise<void> {
  await prisma.$disconnect();
}
