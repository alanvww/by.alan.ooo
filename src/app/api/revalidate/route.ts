import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getContentTypes } from '@/lib/mdx';

interface RevalidatePayload {
  secret?: string;
  path?: string;
}

// Build dynamic allowed path pattern from discovered content types
function buildAllowedPathPattern(): RegExp {
  const types = getContentTypes();
  const typesPattern = types.join('|');
  return new RegExp(`^\\/(${typesPattern})\\/[\\w-]+$`);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as RevalidatePayload;
  const secret = body.secret;

  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const ALLOWED_PATH_PATTERN = buildAllowedPathPattern();
  
  if (body.path && ALLOWED_PATH_PATTERN.test(body.path)) {
    revalidatePath(body.path);
    return NextResponse.json({ revalidated: true, path: body.path });
  }

  return NextResponse.json({ revalidated: false, message: 'No valid path provided' });
}
