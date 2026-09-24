'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppShell from './shell/AppShell';

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

    // La pantalla de acceso se renderiza sin el chrome de la aplicacion.
    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (!authenticated) {
        return null;
    }

    return <AppShell>{children}</AppShell>;
}
