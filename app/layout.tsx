import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import ProtectedLayout from "./components/ProtectedLayout";
import { AuthProvider } from "./context/AuthContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "Organízate",
    template: "%s · Organízate",
  },
  description:
    "Plataforma de consulta de Organízate: histórico de comunicaciones, informes de quemadores y corridas RUAF.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <AuthProvider>
          <ProtectedLayout>{children}</ProtectedLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
