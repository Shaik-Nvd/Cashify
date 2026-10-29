import { NextRequest, NextResponse } from 'next/server';

const defaultPosts = [
  {
    id: 'post-1',
    slug: 'sell-phone-safely',
    title: 'How to Sell Your Used Phone Safely in 2026',
    excerpt: 'Key tips for backing up data, wiping personal accounts, and getting maximum value.',
    content: 'Full guide to selling your phone with free doorstep inspection...',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'post-2',
    slug: 'refurbished-vs-used',
    title: 'Refurbished vs Used: What Is the Difference?',
    excerpt: 'Why certified testing and warranty make refurbished phones a smarter choice.',
    content: 'Comparing testing grades and warranty coverage...',
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  return NextResponse.json({ success: true, data: defaultPosts });
}

export async function POST(req: NextRequest) {
  const json = await req.json();
  return NextResponse.json({ success: true, data: { id: 'post-' + Date.now(), ...json } });
}
