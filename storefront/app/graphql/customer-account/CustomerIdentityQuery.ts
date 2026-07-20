/**
 * Customer Account identity for the auth → entitlement bridge (BASELINE §4.1).
 * Includes tags + Spark metafields so B2B verification + price-list scoping
 * can run server-side. Metafield definitions must allow Customer Account access.
 */
export const CUSTOMER_IDENTITY_QUERY = `#graphql
  query CustomerIdentity($language: LanguageCode) @inContext(language: $language) {
    customer {
      id
      tags
      emailAddress {
        emailAddress
      }
      sparkLayerAuthentication: metafield(
        namespace: "sparklayer"
        key: "authentication"
      ) {
        value
      }
      sparkLayerPriceLists: metafield(
        namespace: "sparklayer"
        key: "price_lists"
      ) {
        value
      }
      sparkLayerCompanyName: metafield(
        namespace: "sparklayer"
        key: "company_name"
      ) {
        value
      }
      companyContacts(first: 1) {
        nodes {
          company {
            id
            locations(first: 1) {
              nodes {
                id
              }
            }
          }
        }
      }
    }
  }
` as const;
