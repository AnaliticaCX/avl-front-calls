"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, MessageCircle, MessageSquare, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const navLinks = [
        { href: "/", label: "Inicio" },
        { href: "/chats", label: "Chats", icon: MessageSquare },
        { href: "/sms", label: "SMS", icon: MessageCircle },
        { href: "/calls", label: "Llamadas", icon: Phone },
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#375a6f]/95 backdrop-blur-md shadow-md py-3' : 'bg-[#375a6f] py-4 shadow-sm'
                }`}
        >
            <div className="container-custom flex items-center justify-between gap-8">
                {/* LOGO */}
                <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-current transform group-hover:scale-110 transition-transform">
                            <path d="M12 2L2 12l10 10 10-10L12 2z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-white tracking-tight">Avalogic</span>
                </Link>
                {/* DESKTOP NAV */}
                <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-sm px-2 py-2 rounded-full border border-white/10 shadow-sm flex-shrink-0">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${isActive
                                    ? 'bg-white text-[#375a6f] shadow-md'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* ACTIONS */}
                <div className="hidden md:flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm hover:shadow"
                    >
                        <LogOut size={18} />
                        <span>Salir</span>
                    </button>
                </div>

                {/* MOBILE MENU TOGGLE */}
                <button
                    className="md:hidden p-2 text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* MOBILE MENU */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                    >
                        <div className="container-custom py-4 flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${pathname === link.href
                                        ? 'bg-[#375a6f]/10 text-[#375a6f]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {link.icon && <link.icon size={18} />}
                                    {link.label}
                                </Link>
                            ))}
                            <hr className="my-2 border-gray-100" />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                <LogOut size={18} />
                                Salir
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
