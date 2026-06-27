import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        department: true,
        skills: { orderBy: { createdAt: 'desc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        educationDetails: { orderBy: { createdAt: 'desc' } },
        emergencyContacts: { orderBy: { createdAt: 'desc' } },
        bankDetails: true,
        personalInfo: true,
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        leaves: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        payroll: {
          orderBy: { createdAt: 'desc' },
          take: 12,
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        assignedAssets: true,
        deviceIssues: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { message: 'Failed to fetch employee', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('Updating employee:', id, 'with data:', body);

    // Check if employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Build update data object - only include fields that are provided
    const userData: any = {};
    const employeeData: any = {};

    // User fields
    if (body.name !== undefined) userData.name = body.name;
    if (body.email !== undefined) userData.email = body.email;
    if (body.role !== undefined) userData.role = body.role;

    // Employee fields
    if (body.designation !== undefined) employeeData.designation = body.designation;
    if (body.departmentId !== undefined) employeeData.departmentId = body.departmentId;
    if (body.phone !== undefined) employeeData.phone = body.phone;
    if (body.address !== undefined) employeeData.address = body.address;
    if (body.city !== undefined) employeeData.city = body.city;
    if (body.state !== undefined) employeeData.state = body.state;
    if (body.country !== undefined) employeeData.country = body.country;
    if (body.zipCode !== undefined) employeeData.zipCode = body.zipCode;
    if (body.joiningDate !== undefined) employeeData.joiningDate = new Date(body.joiningDate);
    if (body.salary !== undefined) employeeData.salary = parseFloat(body.salary);
    if (body.gender !== undefined) employeeData.gender = body.gender;
    if (body.dateOfBirth !== undefined) employeeData.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    if (body.status !== undefined) employeeData.status = body.status;

    console.log('User update data:', userData);
    console.log('Employee update data:', employeeData);

    // Update employee and user in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Update user only if there are user fields
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existingEmployee.userId },
          data: userData,
        });
      }

      // Update employee only if there are employee fields
      if (Object.keys(employeeData).length > 0) {
        return tx.employee.update({
          where: { id },
          data: employeeData,
          include: {
            user: true,
            department: true,
          },
        });
      }

      // If no data to update, just return the employee
      return tx.employee.findUnique({
        where: { id },
        include: {
          user: true,
          department: true,
        },
      });
    });

    console.log('Update successful:', updated);

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { message: 'Failed to update employee', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Delete employee (cascade will handle related records)
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Employee deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { message: 'Failed to delete employee', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
