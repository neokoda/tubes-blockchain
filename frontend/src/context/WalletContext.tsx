import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { toast } from "sonner";

interface WalletContextType {
  address: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  chainId: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const formatAddress = (addr: string) => {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            handleAccountsChanged(accounts);
          }

          window.ethereum.on("chainChanged", (id: string) => setChainId(id));
          window.ethereum.on("accountsChanged", handleAccountsChanged);
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkConnection();

    return () => {
      if (typeof window.ethereum !== "undefined") {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAddress(accounts[0]);
      await fetchBalance(accounts[0]);
    }
  };

  const fetchBalance = async (addr: string) => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const bal = await window.ethereum.request({
          method: "eth_getBalance",
          params: [addr, "latest"],
        });
        const balanceInEth = parseInt(bal, 16) / 1e18;
        setBalance(balanceInEth.toFixed(4));
      } catch (error) {
        console.error("Error fetching balance", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not found! Please install it.");
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      handleAccountsChanged(accounts);
      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      toast.error("Failed to connect wallet: " + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance("0");
    toast.info("Wallet disconnected");
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        balance,
        isConnected: !!address,
        isConnecting,
        connectWallet,
        disconnectWallet,
        chainId,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
