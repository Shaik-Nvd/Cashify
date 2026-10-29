import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = (params.slug || []).join('/');
  console.log(`[Next.js API fallback GET] /api/${path}`);
  return NextResponse.json({
    success: true,
    data: [],
    message: `SS Telecom fallback for /api/${path}`,
  });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = (params.slug || []).join('/');
  console.log(`[Next.js API fallback POST] /api/${path}`);
  return NextResponse.json({
    success: true,
    data: { id: 'mock-' + Date.now(), status: 'success' },
    message: `SS Telecom fallback for /api/${path}`,
  });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = (params.slug || []).join('/');
  console.log(`[Next.js API fallback PUT] /api/${path}`);
  return NextResponse.json({
    success: true,
    message: `SS Telecom fallback for /api/${path}`,
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path = (params.slug || []).join('/');
  console.log(`[Next.js API fallback DELETE] /api/${path}`);
  return NextResponse.json({
    success: true,
    message: `SS Telecom fallback for /api/${path}`,
  });
}
