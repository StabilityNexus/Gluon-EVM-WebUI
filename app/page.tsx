"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import LightRays from "@/components/LightRays";
import TargetCursor from "@/components/TargetCursor";
import TokenFlow from "@/components/TokenFlow";
import Particles from "@/components/Particles";
import { HeroText } from "@/components/HeroText";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <div
      className="min-h-screen relative"
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
        fontWeight: 400,
      }}
    >
      {/* Target Cursor Effect */}
      <TargetCursor spinDuration={2} hideDefaultCursor={true} />

      {/* Full Page Light Rays Background Effect */}
      <LightRays
        raysOrigin="top-center"
        raysColor="#F7F7F7"
        raysSpeed={1.5}
        lightSpread={0.8}
        rayLength={1.2}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.1}
        distortion={0.05}
        className="fixed inset-0 pointer-events-none"
      />

      {/* Hero Section with Grid Background */}
      <section className="relative min-h-screen flex items-center z-[5]">
        <div className="container mx-auto px-4 mb-24 relative z-10">
          <div className="text-center">
            <HeroText />
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 text-pretty max-w-2xl mx-auto px-4">
              Launch your own stablecoin. Maintain price stability and build
              trust in the decentralized economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Button
                asChild
                size="lg"
                className="text-lg px-8 cursor-target rounded-none"
              >
                <Link href="/create">Create Stablecoin</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-lg px-8 bg-transparent cursor-target rounded-none"
              >
                <Link href="/explorer">Explore Coins</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative min-h-screen flex items-center z-[5]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Particles
            particleColors={["#ffffff", "#d9e2ff"]}
            particleCount={180}
            particleSpread={12}
            speed={0.08}
            particleBaseSize={80}
            moveParticlesOnHover
            alphaParticles={false}
            disableRotation={false}
            className="pointer-events-none w-full h-full"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card className="grid container py-6 sm:py-8 p-4 sm:p-6 lg:p-8 grid-cols-1 gap-6 sm:gap-8 items-center lg:grid-cols-2 bg-transparent backdrop-blur-0 rounded-none shadow-lg border border-white/40">
              <motion.div
                className="flex gap-10 flex-col"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="flex gap-4 flex-col">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <div className="inline-block bg-white/10 px-4 py-2 rounded-none text-sm font-medium mb-4 backdrop-blur-sm border border-white/40">
                      How It Works
                    </div>
                  </motion.div>
                  <div className="flex gap-2 flex-col">
                    <motion.h2
                      className="text-2xl sm:text-3xl lg:text-5xl tracking-tighter max-w-xl text-left font-regular"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      Dual Token Mechanics
                    </motion.h2>
                    <motion.p
                      className="text-base sm:text-lg leading-relaxed tracking-tight text-muted-foreground max-w-lg text-left"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      Get exposure to stability with Stable Token(Neutron).
                      <br />
                      Neutron is the stablecoin pegged to price of 1 backed
                      token.
                      <br />
                      <br />
                      Get leveraged volatility and yield with leverage yield
                      token(Proton).
                      <br />
                      Proton tokenizes the reserve surplus.
                      <br />
                      <br />
                      Both Proton and Neutron are fully backed by Base tokens.
                    </motion.p>
                  </div>
                </div>
                <div className="grid lg:pl-6 grid-cols-1 items-start gap-6">
                  {[
                    {
                      icon: "⚡",
                      title: "Fission",
                      description: "Splits Base tokens into Proton and Neutron",
                    },
                    {
                      icon: "✨",
                      title: "Fusion",
                      description:
                        "Merges Proton and Neutron back into Base tokens",
                    },
                    {
                      icon: "β⁺",
                      title: "Transmute β⁺",
                      description:
                        "Convert Proton into Neutron while dynamically adjusting fees based on reserve balance",
                    },
                    {
                      icon: "β⁻",
                      title: "Transmute β⁻",
                      description:
                        "Convert Neutron into Proton with adaptive pricing driven by system health",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      className="flex flex-row gap-6 items-start"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                      whileHover={{ x: 5 }}
                    >
                      <div className="text-2xl mt-2 text-primary">
                        {item.icon}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                className="rounded-none h-full w-full p-4 flex flex-col items-center justify-center space-y-4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {/* Fission: Base-Tokens -> Proton + Neutron */}
                <TokenFlow
                  fromTokens={["Base Token"]}
                  toTokens={["Proton", "Neutron"]}
                />

                {/* Fusion: Proton + Neutron -> Base-Tokens */}
                <TokenFlow
                  fromTokens={["Proton", "Neutron"]}
                  toTokens={["Base Token"]}
                  reverse={false}
                />

                {/* Transmute β⁺: Proton -> Neutron */}
                <TokenFlow fromTokens={["Proton"]} toTokens={["Neutron"]} />

                {/* Transmute β⁻: Neutron -> Proton */}
                <TokenFlow fromTokens={["Neutron"]} toTokens={["Proton"]} />
              </motion.div>
            </Card>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Particles
            particleColors={["#ffffff", "#d9e2ff"]}
            particleCount={180}
            particleSpread={12}
            speed={0.08}
            particleBaseSize={80}
            moveParticlesOnHover
            alphaParticles={false}
            disableRotation={false}
            className="pointer-events-none w-full h-full"
          />
        </div>
      </section>

      {/* Research Section */}
      <section className="relative z-[5] mt-40 mb-32">
        <div className="container mx-auto px-4 py-16 lg:py-24 relative">
          <div className="grid gap-10 lg:grid-cols-2 items-start">
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block bg-white/10 px-4 py-2 rounded-none text-sm font-medium backdrop-blur-sm border border-white/40">
                Research Driven
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight font-semibold text-foreground">
                Gluon&apos;s architecture is grounded in peer-reviewed
                cryptography.
              </h3>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
                The Gluon dual-token system combines the stability guarantees of
                Neutron with the reflexive upside captured by Proton. Our
                settlement, oracle, and reserve controls follow the Stability
                Nexus Gluon research note published on IACR ePrint 2025/1372.
              </p>
              <ul className="space-y-3 text-sm lg:text-base text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>
                    Proof-based solvency flows that map to Solana compute
                    budgets and parallel execution.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-primary">•</span>
                  <span>
                    Adaptive reserve thresholds that inform swap fees and
                    transmutation routes for resilient liquidity.
                  </span>
                </li>
              </ul>
              <div>
                <Link
                  href="https://eprint.iacr.org/2025/1372"
                  target="_blank"
                  className="text-primary underline-offset-4 hover:underline font-medium"
                >
                  Read the Gluon research note →
                </Link>
              </div>
            </motion.div>
            <motion.div
              className="w-full lg:w-3/4 lg:ml-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Card className="p-4 bg-background/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-colors">
                <Link
                  href="https://eprint.iacr.org/2025/1372"
                  target="_blank"
                  className="block group"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      unoptimized
                      fetchPriority="high"
                      loading="lazy"
                      src="/GluonPaper.png"
                      alt="Gluon Solana Research Paper"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
