import { describe, expect, it } from 'vitest';
import { normalizeEmail, normalizeSlug, sanitizeRichText } from '../../src/lib/normalize.js';
import { detectImageSignature } from '../../src/modules/media/media.service.js';

describe('normalize helpers', () => {
  it('normalizes email to lowercase and trims whitespace', () => {
    expect(normalizeEmail('  Admin.User@NorthlineBuild.COM  ')).toBe('admin.user@northlinebuild.com');
  });

  it('normalizes slugs deterministically', () => {
    expect(normalizeSlug('  Civic Timber Pavilion — Phase II! ')).toBe('civic-timber-pavilion-phase-ii');
  });

  it('strips dangerous scripts and inline handlers from rich text', () => {
    const dirty = '<p onclick="alert(1)">Hello</p><script>steal()</script><a href="javascript:evil()">Link</a>';
    const clean = sanitizeRichText(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onclick=');
    expect(clean).not.toContain('javascript:');
    expect(clean).toContain('<p>Hello</p>');
  });
});

describe('detectImageSignature', () => {
  it('detects JPEG, PNG, and WebP magic bytes and rejects non-images', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const webp = Buffer.from('RIFF1234WEBP', 'ascii');
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8');

    expect(detectImageSignature(jpeg)).toBe('image/jpeg');
    expect(detectImageSignature(png)).toBe('image/png');
    expect(detectImageSignature(webp)).toBe('image/webp');
    expect(detectImageSignature(svg)).toBeNull();
  });
});
