import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/skills - Fetch all skills for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id },
      include: {
        skills: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    // If no employee record, return empty array
    if (!employee) {
      return NextResponse.json({ skills: [] });
    }

    // Format skills for frontend
    const skills = employee.skills.map((skill) => ({
      id: skill.id,
      skillName: skill.skillName,
      proficiency: skill.proficiency,
      yearsOfExp: skill.yearsOfExp,
      lastUsed: skill.lastUsed?.toISOString(),
      verified: skill.verified,
      verifiedBy: skill.verifiedBy,
      verifiedAt: skill.verifiedAt?.toISOString(),
      createdAt: skill.createdAt.toISOString()
    }));

    return NextResponse.json({ skills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skills' },
      { status: 500 }
    );
  }
}

// POST /api/skills - Add new skill
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's employee record
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { skillName, proficiency, yearsOfExp, lastUsed } = body;

    // Validate inputs
    if (!skillName) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    if (
      !proficiency ||
      !['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(proficiency)
    ) {
      return NextResponse.json(
        { error: 'Invalid proficiency level' },
        { status: 400 }
      );
    }

    // Create skill record
    const skill = await prisma.employeeSkill.create({
      data: {
        employeeId: employee.id,
        skillName,
        proficiency,
        yearsOfExp: yearsOfExp || null,
        lastUsed: lastUsed ? new Date(lastUsed) : null
      }
    });

    return NextResponse.json({
      success: true,
      skill: {
        id: skill.id,
        skillName: skill.skillName,
        proficiency: skill.proficiency,
        yearsOfExp: skill.yearsOfExp,
        lastUsed: skill.lastUsed?.toISOString(),
        verified: skill.verified,
        createdAt: skill.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error adding skill:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add skill' },
      { status: 500 }
    );
  }
}

// DELETE /api/skills/:id - Delete skill
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get skill ID from URL
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Skill ID is required' },
        { status: 400 }
      );
    }

    // Get skill from database
    const skill = await prisma.employeeSkill.findUnique({
      where: { id }
    });

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee || skill.employeeId !== employee.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this skill' },
        { status: 403 }
      );
    }

    // Delete skill record
    await prisma.employeeSkill.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}
