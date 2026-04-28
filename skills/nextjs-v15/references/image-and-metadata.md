# Image Optimization & Metadata API

## next/image Component

### Import

```tsx
import Image from 'next/image';
```

### Local Images

```tsx
// Static import -- width, height, blurDataURL auto-inferred
import profilePic from './profile.png';

<Image
  src={profilePic}
  alt="Profile"
  placeholder="blur"   // Shows blurred preview while loading
  priority              // Preload for LCP images (above the fold)
/>
```

### Remote Images

```tsx
// Must provide width + height (or use fill)
<Image
  src="https://cdn.example.com/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
/>
```

### Fill Mode

Parent must have `position: relative` (or `absolute`/`fixed`).

```tsx
<div style={{ position: 'relative', width: '100%', height: 400 }}>
  <Image
    src="/hero.jpg"
    alt="Hero"
    fill
    sizes="100vw"
    style={{ objectFit: 'cover' }}
    priority
  />
</div>
```

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `src` | string \| StaticImport | Image source (required) |
| `alt` | string | Alt text (required) |
| `width` | number | Intrinsic width in px |
| `height` | number | Intrinsic height in px |
| `fill` | boolean | Fill parent container |
| `sizes` | string | Media query for responsive sizing |
| `priority` | boolean | Preload (for LCP images) |
| `placeholder` | `'blur'` \| `'empty'` | Blur-up placeholder |
| `blurDataURL` | string | Base64 data URL for blur placeholder |
| `quality` | number (1-100) | Image quality (default: 75) |
| `loading` | `'lazy'` \| `'eager'` | Loading strategy |
| `unoptimized` | boolean | Skip optimization |
| `loader` | function | Custom image loader |

### Remote Patterns (next.config)

```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 's3.amazonaws.com',
      port: '',
      pathname: '/my-bucket/**',
      search: '',
    },
    { protocol: 'https', hostname: '**' }, // Allow all (less secure)
  ],
}
```

### Dynamic Import for Server Components

```tsx
async function PostImage({ filename, alt }: { filename: string; alt: string }) {
  const { default: image } = await import(`../images/${filename}`);
  return <Image src={image} alt={alt} />;
}
```

---

## Metadata API

### Static Metadata

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Site',
  description: 'Site description',
  metadataBase: new URL('https://example.com'),
  openGraph: {
    title: 'My Site',
    description: 'Site description',
    url: 'https://example.com',
    siteName: 'My Site',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My Site',
    description: 'Site description',
    images: ['/twitter-image.png'],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: 'https://example.com',
    languages: { 'en': '/en', 'zh-TW': '/zh-TW' },
  },
};
```

### Dynamic Metadata (generateMetadata)

```tsx
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: `${post.title} | My Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      images: post.ogImage
        ? [{ url: post.ogImage }, ...previousImages]
        : previousImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.ogImage ? [post.ogImage] : undefined,
    },
    alternates: { canonical: `/blog/${slug}` },
    robots: { index: true, follow: true },
  };
}
```

Key behaviors:
- `metadata` and `generateMetadata` are **only supported in Server Components**.
- Metadata from child routes **merges** with parent metadata.
- Use `React.cache()` to memoize shared data between `generateMetadata` and the page.
- Streaming metadata: injected once resolved, without blocking UI (disabled for bots).

### Metadata Fields Reference

```tsx
export const metadata: Metadata = {
  title: 'My App',                          // or { default, template, absolute }
  description: 'Description',
  generator: 'Next.js',
  applicationName: 'My App',
  keywords: ['keyword1', 'keyword2'],
  authors: [{ name: 'Author', url: 'https://author.com' }],
  creator: 'Creator',
  publisher: 'Publisher',
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL('https://example.com'),
  openGraph: { /* ... */ },
  twitter: { /* ... */ },
  robots: { index: true, follow: true, nocache: false },
  icons: { icon: '/favicon.ico', apple: '/apple-icon.png' },
  manifest: '/manifest.json',
  alternates: { canonical: '/', languages: {} },
  verification: { google: 'xxx', yandex: 'yyy' },
  category: 'technology',
};
```

### Title Templates

```tsx
// layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | My Site',  // %s replaced by child page title
    default: 'My Site',        // Used when child doesn't set title
  },
};

// page.tsx
export const metadata: Metadata = {
  title: 'About',  // Renders: "About | My Site"
};
```

---

## File-based Metadata

| File | Output |
|------|--------|
| `favicon.ico` | `<link rel="icon">` |
| `icon.png` / `icon.tsx` | App icon |
| `apple-icon.png` | Apple touch icon |
| `opengraph-image.png` / `.tsx` | OG image |
| `twitter-image.png` / `.tsx` | Twitter card image |
| `robots.txt` / `robots.ts` | robots.txt |
| `sitemap.xml` / `sitemap.ts` | sitemap.xml |

### Generated OG Images

```tsx
// app/blog/[slug]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return new ImageResponse(
    <div style={{
      fontSize: 64, background: 'white', width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {post.title}
    </div>
  );
}
```

ImageResponse:
- Uses `@vercel/og` / `satori` under the hood.
- Supports flexbox layout only (no CSS grid).
- Supports common CSS: color, font-size, font-weight, padding, margin, border, etc.
- Can include nested `<img>` elements for logos/backgrounds.

### Dynamic Sitemap

```tsx
// app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPosts();
  return [
    { url: 'https://example.com', lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    ...posts.map(post => ({
      url: `https://example.com/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
```

### Dynamic Robots

```tsx
// app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin/' },
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```
