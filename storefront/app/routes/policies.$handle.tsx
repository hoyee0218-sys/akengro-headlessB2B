/* Policies detail (BASELINE-BUILD §3.4). Body from Storefront shop.*Policy. */
import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/policies.$handle';
import {merchantConfig} from '~/merchant.config';
import {t} from '~/lib/copy';

export const meta: Route.MetaFunction = ({data}) => {
  const title = data?.policy.title ?? '';
  return [
    {
      title: title
        ? `${title} — ${merchantConfig.merchantName}`
        : merchantConfig.merchantName,
    },
  ];
};

export async function loader({params, context}: Route.LoaderArgs) {
  if (!params.handle) {
    throw new Response(t('policies.notFound'), {status: 404});
  }

  const data = await context.storefront.query(POLICY_CONTENT_QUERY, {
    variables: {
      language: context.storefront.i18n?.language,
    },
  });

  const shop = data.shop;
  const policy = [
    shop?.privacyPolicy,
    shop?.shippingPolicy,
    shop?.termsOfService,
    shop?.refundPolicy,
    shop?.subscriptionPolicy,
  ].find((item) => item?.handle === params.handle);

  if (!policy) {
    throw new Response(t('policies.notFound'), {status: 404});
  }

  return {policy};
}

export default function Policy() {
  const {policy} = useLoaderData<typeof loader>();

  return (
    <div className="policy">
      <br />
      <br />
      <div>
        <Link to="/policies">← {t('policies.back')}</Link>
      </div>
      <br />
      <h1>{policy.title}</h1>
      <div dangerouslySetInnerHTML={{__html: policy.body}} />
    </div>
  );
}

// NOTE: https://shopify.dev/docs/api/storefront/latest/objects/Shop
// subscriptionPolicy is ShopPolicyWithDefault — cannot use ShopPolicy fragment.
const POLICY_CONTENT_QUERY = `#graphql
  fragment Policy on ShopPolicy {
    body
    handle
    id
    title
    url
  }
  query Policy(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(language: $language, country: $country) {
    shop {
      privacyPolicy {
        ...Policy
      }
      shippingPolicy {
        ...Policy
      }
      termsOfService {
        ...Policy
      }
      refundPolicy {
        ...Policy
      }
      subscriptionPolicy {
        body
        handle
        id
        title
        url
      }
    }
  }
` as const;
