
import { NextResponse } from 'next/server';
import Business from '@/models/businessrecords';

export async function GET() {
  try {
    const records = await Business.findAll();

    return NextResponse.json({ records });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: 'Error fetching records', error: message },
      { status: 500 }
    );
  }
}
