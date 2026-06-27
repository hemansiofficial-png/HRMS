import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { generatePayroll } from '@/services/payrollService';

export async function POST(request: NextRequest) { const session = await auth();
if (!session || session.user.role !== 'ADMIN') { return NextResponse.json({ message: 'Forbidden' }, { status: 403 }); } const payload = await request.json();
const data = await generatePayroll(payload);
return NextResponse.json({ data }, { status: 201 });}