import { Wallet } from "lucide-react";
import { formatAddress } from "../context/WalletContext";

interface WalletWidgetProps {
  address: string;
  balance: string;
}

export function WalletWidget({ address, balance }: WalletWidgetProps) {
  const truncatedAddress = formatAddress(address);

  const generateGradient = (addr: string) => {
    const hash = addr
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hash * 2) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 60%))`;
  };

  const displayBalance = parseFloat(balance).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-xl bg-white/90 border border-gray-200 shadow-md">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-['Plus_Jakarta_Sans'] text-gray-900 font-semibold">
          {displayBalance} IDRS
        </span>
      </div>

      <div className="w-px h-6 bg-gray-200" />

      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full"
          style={{ background: generateGradient(address) }}
        />
        <span className="text-sm font-['Outfit'] text-gray-900">
          {truncatedAddress}
        </span>
      </div>
    </div>
  );
}
