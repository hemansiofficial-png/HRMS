import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { departmentSchema } from '@/lib/validations';

export const revalidate = 60;

export async function GET() {
  const data = await prisma.department.findMany({ 
    include: { 
      manager: true, 
      employees: true 
    } 
  });
  const response = NextResponse.json({ data });
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return response;
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const validatedData = departmentSchema.parse(payload);
  
  const data = await prisma.department.create({ 
    data: {
      name: validatedData.name,
      description: validatedData.description,
      managerId: validatedData.managerId,
      budget: validatedData.budget,
    } 
  });
  return NextResponse.json({ data }, { status: 201 });
}