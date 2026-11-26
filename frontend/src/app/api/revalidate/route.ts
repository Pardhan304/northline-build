import { revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { isAllowedCacheTag, verifyRevalidationSignature } from '@/lib/revalidation';

const revalidateBodySchema = z.object({
  tags: z.array(z.string().trim().min(1).max(180)).min(1).max(20),
});

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET ?? '';
  const rawBody = await request.text();

  const verification = verifyRevalidationSignature({
    rawBody,
    timestamp: request.headers.get('x-revalidate-timestamp'),
    signature: request.headers.get('x-revalidate-signature'),
    secret,
  });

  if (!verification.ok) {
    return NextResponse.json({ success: false, message: verification.reason }, { status: 401 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = revalidateBodySchema.safeParse(parsedJson);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid tags payload.' }, { status: 400 });
  }

  const validTags = parsed.data.tags.filter(isAllowedCacheTag);
  for (const tag of validTags) {
    revalidateTag(tag, 'max');
  }

  return NextResponse.json({
    success: true,
    revalidated: validTags,
  });
}
