import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) { const format = request.nextUrl.searchParams.get('format') || 'csv';
return NextResponse.json({ message: `Report export queued in ${ format.toUpperCase()} format.` });}