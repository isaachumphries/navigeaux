'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';

const Map = dynamic(() => import('./components/map'), { ssr: false });

export default function Home() {
  return (
    <main className="relative">
      <Map />
      <div className="absolute top-4 left-4 z-10">
        <Link href="/events">
          <button className="px-10 py-3 rounded-full bg-[#[#FDD023] text-[#461D7C] font-bold text-lg shadow-lg bg-yellow-300 transition-all duration-200">
           Events
          </button>
        </Link>
      </div>
    </main>
  );
}
