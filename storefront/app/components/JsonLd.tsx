/**
 * Renders a JSON-LD script tag. `data` must be a plain serializable object
 * (BreadcrumbList, Product, Organization, etc.).
 */
export function JsonLd({data}: {data: Record<string, unknown> | Array<Record<string, unknown>>}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: JSON.stringify(data)}}
    />
  );
}
