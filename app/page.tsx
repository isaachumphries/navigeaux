'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./components/map'), { ssr: false });

export default function Home() {
  return (
    <main className="relative">
      <Map />
<<<<<<< HEAD
      <div className="absolute top-4 right-12 z-10">
        <Link href="/events">
          <button className="px-10 py-3 rounded-full bg-[#FDD023] text-[#461D7C] font-bold text-lg shadow-lg bg-yellow-300 transition-all duration-200">
           Events
          </button>
        </Link>
      </div>
=======
>>>>>>> 8afc767f3fef57b2a7ac650a503430959db3ff9e
    </main>
  );
}
