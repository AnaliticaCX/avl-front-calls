import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from './components/Footer';
import ProtectedLayout from "./components/ProtectedLayout";
import { AuthProvider } from "./context/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Avalogic - Visor de Histórico",
  description: "Sistema de consulta de histórico de conversaciones y comunicaciones de Avalogic",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <ProtectedLayout>
            <div className="pb-24">
              {children}
            </div>
            <Footer />
          </ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
