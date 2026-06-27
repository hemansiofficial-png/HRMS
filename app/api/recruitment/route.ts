import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() { return NextResponse.json({ data: await prisma.jobPosting.findMany() });
}export async function POST(request: NextRequest) { const payload = await request.json();
return NextResponse.json({ data: await prisma.jobPosting.create({ data: payload }) }, { status: 201 });}