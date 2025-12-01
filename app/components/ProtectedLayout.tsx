'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const { authenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!authenticated && pathname !== '/login') {
            router.push('/login');
        }
        if (authenticated && pathname === '/login') {
            router.push('/');
        }
    }, [authenticated, pathname, router]);

    if (!authenticated && pathname !== '/login') {
        return null;
    }

    if (pathname === '/login') {
        return <>{children}</>;
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow pt-28">
                {children}
            </main>
        </div>
    );
}
