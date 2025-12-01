

import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#0f172a] text-white pt-20 pb-8 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -left-40 -bottom-20 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-40 -top-10 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container-custom relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-12 max-w-5xl mx-auto text-center md:text-left">
                    {/* Brand Column */}
                    <div className="flex flex-col items-center md:items-start gap-6 max-w-sm">
                        <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" className="w-full h-full text-white fill-current">
                                    <path d="M12 2L2 12l10 10 10-10L12 2z" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-white tracking-tight">Avalogic</span>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed">
                            Soluciones tecnológicas integrales para la gestión y consulta de comunicaciones empresariales.
                        </p>
                    </div>

                    {/* Navigation Column */}
                    <div className="flex flex-col items-center md:items-end">
                        <h4 className="text-lg font-semibold mb-6 text-white">Navegación</h4>
                        <ul className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
                            <li>
                                <Link href="/" className="text-white/70 hover:text-white transition-colors">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/chats" className="text-white/70 hover:text-white transition-colors">
                                    Chats
                                </Link>
                            </li>
                            <li>
                                <Link href="/sms" className="text-white/70 hover:text-white transition-colors">
                                    SMS
                                </Link>
                            </li>
                            <li>
                                <Link href="/calls" className="text-white/70 hover:text-white transition-colors">
                                    Llamadas
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
                    <div>
                        © {currentYear} Avalogic SAS. Todos los derechos reservados.
                    </div>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-white transition-colors">Política de Privacidad</Link>
                        <Link href="#" className="hover:text-white transition-colors">Términos de Servicio</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

