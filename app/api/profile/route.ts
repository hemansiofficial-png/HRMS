import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Get user info with employee record
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: {
          include: {
            department: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            skills: {
              orderBy: { createdAt: 'desc' }
            },
            documents: {
              orderBy: { createdAt: 'desc' }
            },
            emergencyContacts: true,
            bankDetails: true,
            personalInfo: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle users without employee records (e.g., ADMIN, MANAGER roles)
    if (!user.employee) {
      const profile = {
        id: user.id,
        employeeCode: 'N/A',
        name: user.name || 'User',
        email: user.email,
        phone: user.phone || '',
        designation: user.role,
        department: { id: '', name: 'N/A' },
        joiningDate: user.createdAt.toISOString(),
        gender: null,
        dateOfBirth: null,
        city: null,
        state: null,
        country: null,
        address: '',
        photoUrl: null,
        reportsTo: null,
        emergencyContacts: [],
        bankDetails: null,
        personalInfo: null,
        skills: [],
        documents: []
      };
      return NextResponse.json({ profile });
    }

    const employee = user.employee;

    // Format profile data
    const profile = {
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: user.name || 'Employee',
      email: user.email,
      phone: employee.phone,
      designation: employee.designation,
      department: { id: employee.department.id, name: employee.department.name },
      joiningDate: employee.joiningDate.toISOString(),
      gender: employee.gender,
      dateOfBirth: employee.dateOfBirth?.toISOString(),
      city: employee.city,
      state: employee.state,
      country: employee.country,
      address: employee.address,
      photoUrl: employee.photoUrl,
      reportsTo: employee.manager ? {
        id: employee.manager.id,
        name: employee.manager.name,
        email: employee.manager.email
      } : null,
      emergencyContacts: employee.emergencyContacts && Array.isArray(employee.emergencyContacts) 
        ? employee.emergencyContacts.map(ec => ({
            id: ec.id,
            name: ec.name,
            relationship: ec.relationship,
            phone: ec.phone,
            email: ec.email,
            address: ec.address
          }))
        : [],
      bankDetails: employee.bankDetails ? {
        id: employee.bankDetails.id,
        accountHolder: employee.bankDetails.accountHolder,
        accountNumber: employee.bankDetails.accountNumber,
        bankName: employee.bankDetails.bankName,
        branchName: employee.bankDetails.branchName,
        ifscCode: employee.bankDetails.ifscCode,
        accountType: employee.bankDetails.accountType
      } : null,
      personalInfo: employee.personalInfo ? {
        id: employee.personalInfo.id,
        nationality: employee.personalInfo.nationality,
        bloodGroup: employee.personalInfo.bloodGroup,
        maritalStatus: employee.personalInfo.maritalStatus,
        fatherName: employee.personalInfo.fatherName,
        motherName: employee.personalInfo.motherName,
        spouseName: employee.personalInfo.spouseName,
        childrenCount: employee.personalInfo.childrenCount,
        aadharNumber: employee.personalInfo.aadharNumber,
        panNumber: employee.personalInfo.panNumber,
        passportNumber: employee.personalInfo.passportNumber,
        drivenLicenseNumber: employee.personalInfo.drivenLicenseNumber
      } : null,
      skills: employee.skills && Array.isArray(employee.skills)
        ? employee.skills.map(skill => ({
            id: skill.id,
            skillName: skill.skillName,
            proficiency: skill.proficiency,
            yearsOfExp: skill.yearsOfExp,
            lastUsed: skill.lastUsed?.toISOString(),
            verified: skill.verified,
            verifiedBy: skill.verifiedBy,
            verifiedAt: skill.verifiedAt?.toISOString(),
            createdAt: skill.createdAt.toISOString()
          }))
        : [],
      documents: employee.documents && Array.isArray(employee.documents)
        ? employee.documents.map(doc => ({
            id: doc.id,
            name: doc.documentName,
            type: doc.documentType,
            uploadedDate: doc.createdAt.toISOString(),
            url: doc.documentUrl,
            expiryDate: doc.expiryDate?.toISOString()
          }))
        : []
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { phone, gender, dateOfBirth, city, state, country, address } = await request.json();

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        employee: {
          include: {
            department: true,
            manager: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            skills: {
              orderBy: { createdAt: 'desc' }
            },
            documents: {
              orderBy: { createdAt: 'desc' }
            },
            emergencyContacts: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle users without employee records - update user directly
    if (!user.employee) {
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: {
          phone: phone || user.phone,
        }
      });

      const profile = {
        id: updatedUser.id,
        employeeCode: 'N/A',
        name: updatedUser.name || 'User',
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        designation: updatedUser.role,
        department: { id: '', name: 'N/A' },
        joiningDate: updatedUser.createdAt.toISOString(),
        gender: null,
        dateOfBirth: null,
        city: null,
        state: null,
        country: null,
        address: '',
        photoUrl: null,
        reportsTo: null,
        emergencyContacts: [],
        bankDetails: null,
        personalInfo: null,
        skills: [],
        documents: []
      };

      return NextResponse.json({ profile });
    }

    const employee = user.employee;

    // Update employee record
    const updatedEmployee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        phone: phone || employee.phone,
        gender: gender || employee.gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : employee.dateOfBirth,
        city: city || employee.city,
        state: state || employee.state,
        country: country || employee.country,
        address: address || employee.address
      },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        skills: {
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        },
        emergencyContacts: true
      }
    });

    // Format updated profile data
    const profile = {
      id: updatedEmployee.id,
      employeeCode: updatedEmployee.employeeCode,
      name: user.name || 'Employee',
      email: user.email,
      phone: updatedEmployee.phone,
      designation: updatedEmployee.designation,
      department: { id: updatedEmployee.department.id, name: updatedEmployee.department.name },
      joiningDate: updatedEmployee.joiningDate.toISOString(),
      gender: updatedEmployee.gender,
      dateOfBirth: updatedEmployee.dateOfBirth?.toISOString(),
      city: updatedEmployee.city,
      state: updatedEmployee.state,
      country: updatedEmployee.country,
      address: updatedEmployee.address,
      photoUrl: updatedEmployee.photoUrl,
      reportsTo: updatedEmployee.manager ? {
        id: updatedEmployee.manager.id,
        name: updatedEmployee.manager.name,
        email: updatedEmployee.manager.email
      } : null,
      emergencyContacts: updatedEmployee.emergencyContacts && Array.isArray(updatedEmployee.emergencyContacts)
        ? updatedEmployee.emergencyContacts.map(ec => ({
            id: ec.id,
            name: ec.name,
            relationship: ec.relationship,
            phone: ec.phone,
            email: ec.email,
            address: ec.address
          }))
        : [],
      skills: updatedEmployee.skills && Array.isArray(updatedEmployee.skills)
        ? updatedEmployee.skills.map(skill => ({
            id: skill.id,
            skillName: skill.skillName,
            proficiency: skill.proficiency,
            yearsOfExp: skill.yearsOfExp,
            lastUsed: skill.lastUsed?.toISOString(),
            verified: skill.verified,
            verifiedBy: skill.verifiedBy,
            verifiedAt: skill.verifiedAt?.toISOString(),
            createdAt: skill.createdAt.toISOString()
          }))
        : [],
      documents: updatedEmployee.documents && Array.isArray(updatedEmployee.documents)
        ? updatedEmployee.documents.map(doc => ({
            id: doc.id,
            name: doc.documentName,
            type: doc.documentType,
            uploadedDate: doc.createdAt.toISOString(),
            url: doc.documentUrl,
            expiryDate: doc.expiryDate?.toISOString()
          }))
        : []
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
