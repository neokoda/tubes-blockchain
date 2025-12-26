import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { toast } from "sonner";
import { ethers } from "ethers";
import { IDRS_CONTRACT_ADDRESS, IDRS_ABI } from "../config";

interface WalletContextType {
  address: string | null;
  balance: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  chainId: string | null;
  refreshBalance: () => Promise<void>;
  mintToken: (amount: string) => Promise<void>;
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

  const fetchTokenBalance = useCallback(async (addr: string) => {
    if (typeof window.ethereum !== "undefined" && addr) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        if (!ethers.isAddress(IDRS_CONTRACT_ADDRESS)) {
          console.warn("Invalid Contract Address in config.ts");
          return;
        }

        const contract = new ethers.Contract(
          IDRS_CONTRACT_ADDRESS,
          IDRS_ABI,
          provider
        );

        const rawBalance = await contract.balanceOf(addr);

        const formattedBalance = ethers.formatUnits(rawBalance, 18);

        setBalance(formattedBalance);
      } catch (error) {
        console.error("Error fetching token balance:", error);
        setBalance("0");
      }
    }
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const currentAddress = accounts[0].address;
            setAddress(currentAddress);
            await fetchTokenBalance(currentAddress);

            const network = await provider.getNetwork();
            setChainId(network.chainId.toString());
          }

          window.ethereum.on("accountsChanged", (accounts: string[]) => {
            if (accounts.length === 0) {
              disconnectWallet();
            } else {
              setAddress(accounts[0]);
              fetchTokenBalance(accounts[0]);
            }
          });

          window.ethereum.on("chainChanged", () => {
            window.location.reload();
          });
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    checkConnection();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, [fetchTokenBalance]);

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast.error("MetaMask not found! Please install it.");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      const currentAddress = accounts[0];
      setAddress(currentAddress);
      await fetchTokenBalance(currentAddress);

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
    setChainId(null);

    toast.info("Wallet disconnected");
  };

  const mintToken = async (amountStr: string) => {
    if (!address) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        IDRS_CONTRACT_ADDRESS,
        IDRS_ABI,
        signer
      );

      const amountInWei = ethers.parseUnits(amountStr, 18);

      toast.loading("Minting IDRS Tokens...");

      const tx = await contract.faucet(address, amountInWei);
      await tx.wait();

      toast.dismiss();
      toast.success(`Successfully minted ${amountStr} IDRS!`);

      await fetchTokenBalance(address);
    } catch (error: any) {
      console.error(error);
      toast.dismiss();
      toast.error("Minting failed. Make sure you are on the right network.");
    }
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
        refreshBalance: () =>
          address ? fetchTokenBalance(address) : Promise.resolve(),
        mintToken,
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
