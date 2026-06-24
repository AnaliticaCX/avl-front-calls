"use client";

import { motion } from "framer-motion";
import { FileText, Mail, MessageCircle, MessageSquare, Phone, Search } from "lucide-react";
import Link from "next/link";
import FeatureCard from "./components/FeatureCard";
import Hero from "./components/Hero";

export default function Home() {
  const features = [
    {
      title: "Búsqueda de Registros",
      description: "Filtra el histórico por ID de conversación, cliente, teléfono, email y rango de fechas específico para encontrar exactamente lo que necesitas.",
      icon: Search,
      colorClass: "bg-[#375a6f]",
      delay: 0.2
    },
    {
      title: "Visualización Detallada",
      description: "Consulta el contenido completo de conversaciones, mensajes y llamadas con toda la información asociada y metadatos relevantes.",
      icon: FileText,
      colorClass: "bg-[#2f5b6d]",
      delay: 0.4
    },
    {
      title: "Llamadas y CDR",
      description: "Accede al histórico completo de llamadas con filtros por estado: todas, conectadas y no conectadas, con detalles de duración y costos.",
      icon: Phone,
      colorClass: "bg-[#233d4a]",
      delay: 0.6
    }
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <section className="py-24 px-6 bg-white relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-primary-dark mb-4"
            >
              Funcionalidades del Visor
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-text-body max-w-2xl mx-auto"
            >
              Herramientas avanzadas de consulta para acceder al histórico completo de comunicaciones de tu empresa.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                colorClass={feature.colorClass}
                delay={feature.delay}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-principal opacity-5" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6 text-primary-dark"
          >
            Consulta el Histórico Completo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-text-body mb-10 leading-relaxed"
          >
            Accede a todos los registros de conversaciones, mensajes y llamadas almacenados en la plataforma de Avalogic.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link href="/chats" className="btn-primary px-8 py-4 text-lg shadow-xl shadow-primary/20">
              <MessageSquare size={20} />
              Chats
            </Link>
            <Link href="/sms" className="btn-secondary px-8 py-4 text-lg">
              <MessageCircle size={20} />
              SMS
            </Link>
            <Link href="/calls" className="btn-secondary px-8 py-4 text-lg">
              <Phone size={20} />
              Llamadas
            </Link>
            <Link href="/emails" className="btn-secondary px-8 py-4 text-lg">
              <Mail size={20} />
              Correos
            </Link>
          </motion.div>
        </div>
      </section>


    </div>
  );
}
