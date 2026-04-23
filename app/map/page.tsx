'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('../components/map'), { ssr: false });

export default function MapPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
      } else {
        setLoggedIn(true);
      }
    });
  }, [router]);

  if (!loggedIn) return null;

  return <Map />;
}
