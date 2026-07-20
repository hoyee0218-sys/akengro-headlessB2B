import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';
import {t} from '~/lib/copy';

/**
 * <PaginatedResourceSection> encapsulates the previous and next pagination behaviors throughout your application.
 */
export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  ariaLabel,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  ariaLabel?: string;
  resourcesClassName?: string;
}) {
  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, PreviousLink, NextLink}) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );

        return (
          <div>
            <PreviousLink>
              {isLoading ? (
                t('pagination.loading')
              ) : (
                <span>
                  <span aria-hidden="true">↑</span> {t('pagination.loadPrevious')}
                </span>
              )}
            </PreviousLink>
            {resourcesClassName ? (
              <div
                aria-label={ariaLabel}
                className={resourcesClassName}
                role={ariaLabel ? 'region' : undefined}
              >
                {resourcesMarkup}
              </div>
            ) : (
              resourcesMarkup
            )}
            <NextLink>
              {isLoading ? (
                t('pagination.loading')
              ) : (
                <span>
                  {t('pagination.loadMore')} <span aria-hidden="true">↓</span>
                </span>
              )}
            </NextLink>
          </div>
        );
      }}
    </Pagination>
  );
}
