import { useState, useEffect, useRef } from "react";
import { Zap } from "lucide-react";
import { useWallet } from "../context/WalletContext";

interface FaucetPopoverProps {
  onClose: () => void;
}

export function FaucetPopover({ onClose }: FaucetPopoverProps) {
  const { mintToken } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const [amount, setAmount] = useState("10000");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleClaim = async () => {
    const claimAmount = parseInt(amount);
    if (claimAmount > 0) {
      setIsLoading(true);
      await mintToken(amount);
      setIsLoading(false);
      onClose();
    }
  };

  const quickAmounts = [
    { label: "1K", value: 1000 },
    { label: "10K", value: 10000 },
    { label: "100K", value: 100000 },
    { label: "1M", value: 1000000 },
  ];

  return (
    <div
      ref={popoverRef}
      className="absolute top-full right-0 mt-2 w-80 backdrop-blur-xl bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200 z-50"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#50E3C2] to-[#4C82FB] flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-['Outfit'] font-bold text-gray-900">
            Testnet Faucet
          </h3>
          <p className="text-xs text-gray-600 font-['Plus_Jakarta_Sans']">
            Claim IDRS tokens
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm text-gray-600 font-['Plus_Jakarta_Sans'] mb-2 block font-semibold">
          Amount
        </label>
        <div className="relative">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
            placeholder="0"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left font-['Outfit'] text-xl text-gray-900 focus:outline-none focus:border-[#50E3C2] transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-['Plus_Jakarta_Sans'] text-sm">
            IDRS
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {quickAmounts.map((quick) => (
          <button
            key={quick.value}
            onClick={() => setAmount(quick.value.toString())}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-[#50E3C2]/20 hover:text-[#50E3C2] text-gray-700 text-sm font-['Plus_Jakarta_Sans'] font-semibold transition-all"
          >
            {quick.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleClaim}
        disabled={!amount || parseInt(amount) <= 0 || isLoading}
        className="w-full py-3 rounded-full bg-gradient-to-r from-[#50E3C2] to-[#4C82FB] text-white hover:opacity-90 transition-opacity font-['Outfit'] font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading
          ? "Minting..."
          : `Claim ${parseInt(amount || "0").toLocaleString()} IDRS`}
      </button>

      <p className="text-xs text-gray-400 font-['Plus_Jakarta_Sans'] text-center mt-3">
        💧 For testnet use only
      </p>
    </div>
  );
}
