/**
 * Renders a JSON-LD structured-data block. Use in server components to emit
 * schema.org markup (Article, FAQPage, BreadcrumbList, etc.) for SEO / AEO / GEO.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Structured data is static and author-controlled, so this is safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
