'use client';

import dynamic from 'next/dynamic';
import Start from './start/page';

const Map = dynamic(() => import('./components/map'), { ssr: false });

export default function Home() {
  return (
    <main>
      <Map />
    </main>
  );
}
