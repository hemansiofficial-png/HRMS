import { NextRequest, NextResponse } from 'next/server';
import { checkIn } from '@/services/attendanceService';

export async function POST(request: NextRequest) { const { employeeId } = await request.json();
const data = await checkIn(employeeId);
return NextResponse.json({ data }, { status: 201 });}