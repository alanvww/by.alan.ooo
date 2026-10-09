import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getContentTypes } from '@/lib/mdx';

interface RevalidatePayload {
  secret?: string;
  path?: string;
}

const ALLOWED_STATIC_PATHS = new Set(['/', '/cv', '/stack-and-gear', '/sitemap.xml']);

function isValidSecret(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

// Build dynamic allowed path pattern from discovered content types
function buildAllowedPathPattern(): RegExp {
  const types = getContentTypes();
  const typesPattern = types.join('|');
  return new RegExp(`^\\/(${typesPattern})\\/[\\w-]+$`);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as RevalidatePayload;

  if (!isValidSecret(body.secret, process.env.REVALIDATE_SECRET)) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const ALLOWED_PATH_PATTERN = buildAllowedPathPattern();

  if (
    body.path &&
    (ALLOWED_STATIC_PATHS.has(body.path) || ALLOWED_PATH_PATTERN.test(body.path))
  ) {
    revalidatePath(body.path);
    revalidatePath('/', 'layout');
    revalidatePath('/sitemap.xml');
    return NextResponse.json({ revalidated: true, path: body.path });
  }

  return NextResponse.json(
    { revalidated: false, message: 'No valid path provided' },
    { status: 400 },
  );
}
