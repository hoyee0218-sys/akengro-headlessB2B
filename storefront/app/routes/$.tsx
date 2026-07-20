import type {Route} from './+types/$';
import {t} from '~/lib/copy';

export async function loader(_args: Route.LoaderArgs) {
  throw new Response(t('error.notFound'), {
    status: 404,
  });
}

export default function CatchAllPage() {
  return null;
}
