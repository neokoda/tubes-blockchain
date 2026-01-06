import { useState } from "react";
import { Zap } from "lucide-react";

interface LandingProps {
  onConnectWallet: () => void;
  isWalletConnected: boolean;
}

export function Landing({ onConnectWallet, isWalletConnected }: LandingProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-pink-50">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF007A]/5 via-transparent to-[#4C82FB]/5" />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF007A] to-[#4C82FB] flex items-center justify-center shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="font-['Outfit'] font-extrabold text-6xl mb-6 pb-2 bg-black">
          DeFi Lending for MSMEs
        </h1>

        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-['Plus_Jakarta_Sans']">
          Bridge traditional businesses with crypto investors. Upload invoices,
          get instant verification, secure funding.
        </p>

        <div className="flex items-center justify-center gap-4 mb-16">
          {!isWalletConnected && (
            <button
              onClick={onConnectWallet}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-[#FF007A] to-[#4C82FB] text-white hover:opacity-90 transition-opacity font-['Outfit'] font-semibold shadow-lg shadow-pink-500/25"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Instant Verification",
              description: "Oracle-powered invoice validation in seconds",
              color: "from-[#4C82FB]/10 to-[#4C82FB]/5",
              icon: "⚡",
            },
            {
              title: "Competitive Rates",
              description: "Earn up to 12% APR on your crypto investments",
              color: "from-[#50E3C2]/10 to-[#50E3C2]/5",
              icon: "📈",
            },
            {
              title: "Blockchain Security",
              description: "Transparent, immutable loan records",
              color: "from-[#FF007A]/10 to-[#FF007A]/5",
              icon: "🔒",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="backdrop-blur-xl bg-white/80 border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-all hover:transform hover:-translate-y-1 shadow-md"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="font-['Outfit'] font-bold mb-2 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 font-['Plus_Jakarta_Sans']">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
