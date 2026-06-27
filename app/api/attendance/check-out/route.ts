import { NextRequest, NextResponse } from 'next/server';
import { checkOut } from '@/services/attendanceService';

export async function POST(request: NextRequest) { const { employeeId } = await request.json();
const data = await checkOut(employeeId);
return NextResponse.json({ data });}