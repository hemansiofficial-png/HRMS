import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch emergency contacts
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: {
        emergencyContacts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const contacts = employee.emergencyContacts.map(ec => ({
      id: ec.id,
      name: ec.name,
      relationship: ec.relationship,
      phone: ec.phone,
      email: ec.email,
      address: ec.address
    }));

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update emergency contacts (replace all)
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { contacts } = await request.json();

    if (!Array.isArray(contacts)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Delete existing contacts
    await prisma.emergencyContact.deleteMany({
      where: { employeeId: employee.id }
    });

    // Create new contacts
    const createdContacts = await Promise.all(
      contacts
        .filter((c: any) => c.name && c.phone) // Only create contacts with required fields
        .map((contact: any) =>
          prisma.emergencyContact.create({
            data: {
              employeeId: employee.id,
              name: contact.name,
              relationship: contact.relationship,
              phone: contact.phone,
              email: contact.email,
              address: contact.address
            }
          })
        )
    );

    const result = createdContacts.map(ec => ({
      id: ec.id,
      name: ec.name,
      relationship: ec.relationship,
      phone: ec.phone,
      email: ec.email,
      address: ec.address
    }));

    return NextResponse.json({ contacts: result });
  } catch (error) {
    console.error('Error updating emergency contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add a single emergency contact
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, relationship, phone, email, address } = await request.json();

    if (!name || !phone || !relationship) {
      return NextResponse.json(
        { error: 'Name, phone, and relationship are required' },
        { status: 400 }
      );
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Create contact
    const contact = await prisma.emergencyContact.create({
      data: {
        employeeId: employee.id,
        name,
        relationship,
        phone,
        email,
        address
      }
    });

    return NextResponse.json({
      contact: {
        id: contact.id,
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        email: contact.email,
        address: contact.address
      }
    });
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove an emergency contact
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 });
    }

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify contact belongs to employee
    const existingContact = await prisma.emergencyContact.findUnique({
      where: { id }
    });

    if (!existingContact || existingContact.employeeId !== employee.id) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    // Delete contact
    await prisma.emergencyContact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
