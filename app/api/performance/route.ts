import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() { return NextResponse.json({ data: await prisma.performanceReview.findMany({ include: { employee: true, reviewer: true } }) });
}export async function POST(request: NextRequest) { const payload = await request.json();
return NextResponse.json({ data: await prisma.performanceReview.create({ data: payload }) }, { status: 201 });}