'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { homePath, puedeAbrir } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import AppShell from './shell/AppShell';

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const { authenticated, perfil } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const permitido = pathname === '/login' || puedeAbrir(perfil, pathname);

    useEffect(() => {
        if (!authenticated && pathname !== '/login') {
            router.push('/login');
        }
        if (authenticated && pathname === '/login') {
            router.push(homePath(perfil));
        }
        if (authenticated && !permitido) {
            router.replace(homePath(perfil));
        }
    }, [authenticated, perfil, permitido, pathname, router]);

    // La pantalla de acceso se renderiza sin el chrome de la aplicacion.
    if (pathname === '/login') {
        return <>{children}</>;
    }

    if (!authenticated || !permitido) {
        return null;
    }

    return <AppShell>{children}</AppShell>;
}
