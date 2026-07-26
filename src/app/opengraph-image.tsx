import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';

export const alt = 'Alan Yam - Creative Technologist & Design Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Satori reads TTF/OTF/WOFF only (no woff2), so request the CSS with a
 *  UA old enough that Google Fonts falls back to TTF URLs. */
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:22.0) Gecko/20130405 Firefox/22.0' } }
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

// The route is statically prerendered, so the font fetches run once at build
// time; on failure we fall back to next/og's bundled default rather than
// failing the build.
export default async function OpenGraphImage(): Promise<ImageResponse> {
  const [geistLight, geistMedium] = await Promise.all([
    loadGoogleFont('Geist', 300),
    loadGoogleFont('Geist', 500),
  ]);
  const fonts = [
    geistLight && { name: 'Geist', data: geistLight, weight: 300 as const, style: 'normal' as const },
    geistMedium && { name: 'Geist', data: geistMedium, weight: 500 as const, style: 'normal' as const },
  ].filter((f) => f !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b0b14',
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 70% 20%, rgba(88, 60, 120, 0.35), transparent), radial-gradient(ellipse 60% 50% at 20% 90%, rgba(40, 80, 60, 0.25), transparent)',
          fontFamily: 'Geist',
          color: '#ffffff',
        }}
      >
        {/* Mid-pulse dot, same two-circle motif as icon.svg */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 130,
            height: 130,
            borderRadius: 9999,
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 94,
              height: 94,
              borderRadius: 9999,
              backgroundColor: '#ffffff',
              boxShadow: '0 0 60px rgba(255, 255, 255, 0.55)',
            }}
          />
        </div>
        <div style={{ fontSize: 76, fontWeight: 500, letterSpacing: '-0.02em' }}>
          Alan Yam
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 300,
            marginTop: 18,
            color: 'rgba(255, 255, 255, 0.72)',
          }}
        >
          Creative Technologist &amp; Design Engineer
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 300,
            marginTop: 44,
            color: 'rgba(255, 255, 255, 0.45)',
            letterSpacing: '0.08em',
          }}
        >
          {siteConfig.name}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length > 0 ? fonts : undefined }
  );
}
