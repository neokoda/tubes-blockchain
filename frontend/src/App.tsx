import { JSX, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { WalletProvider, useWallet } from "./context/WalletContext";
import { DataProvider, useData } from "./context/DataContext";
import { Landing } from "./components/Landing";
import { BorrowerDashboard } from "./components/BorrowerDashboard";
import { InvestorMarketplace } from "./components/InvestorMarketplace";
import { Portfolio } from "./components/Portfolio";
import { WalletWidget } from "./components/WalletWidget";
import { BusinessProfileModal } from "./components/BusinessProfileModal";
import { FaucetPopover } from "./components/FaucetPopover";
import { Zap, User, TrendingUp } from "lucide-react";
import { toast } from "sonner";

function NavigationBar() {
  const { isConnected, address, balance } = useWallet();
  const { businessProfile, setBusinessProfile } = useData();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFaucet, setShowFaucet] = useState(false);

  const location = useLocation();

  const isInvestorMode =
    location.pathname.startsWith("/investor") ||
    location.pathname.startsWith("/portfolio");
  const mode = isInvestorMode ? "investor" : "borrower";
  const currentView = location.pathname.split("/")[1] || "borrower";

  const handleSaveProfile = (profile: any) => {
    setBusinessProfile(profile);
    setShowProfileModal(false);
    toast.success("Business profile saved!");
  };

  if (!isConnected) return null;

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF007A] to-[#4C82FB] flex items-center justify-center">
                <span className="text-sm font-bold text-white">CV</span>
              </div>
              <span className="font-['Outfit'] font-bold">ChainVoice</span>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
              <Link
                to="/borrower"
                className={`px-4 py-2 rounded-full transition-all font-['Plus_Jakarta_Sans'] text-sm ${
                  mode === "borrower"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Borrower
                </div>
              </Link>
              <Link
                to="/investor"
                className={`px-4 py-2 rounded-full transition-all font-['Plus_Jakarta_Sans'] text-sm ${
                  mode === "investor"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Investor
                </div>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {mode === "borrower" && (
              <>
                <Link
                  to="/borrower"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === "borrower"
                      ? "bg-gray-900/10"
                      : "hover:bg-gray-900/5"
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="px-4 py-2 rounded-lg hover:bg-gray-900/5 transition-colors"
                >
                  Profile
                </button>
              </>
            )}

            {mode === "investor" && (
              <>
                <Link
                  to="/investor"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === "investor"
                      ? "bg-gray-900/10"
                      : "hover:bg-gray-900/5"
                  }`}
                >
                  Marketplace
                </Link>
                <Link
                  to="/portfolio"
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === "portfolio"
                      ? "bg-gray-900/10"
                      : "hover:bg-gray-900/5"
                  }`}
                >
                  Portfolio
                </Link>
              </>
            )}

            <div className="relative">
              <button
                onClick={() => setShowFaucet(!showFaucet)}
                className="px-4 py-2 rounded-full bg-[#50E3C2]/20 text-[#50E3C2] hover:bg-[#50E3C2]/30 transition-colors flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                <span className="font-['Plus_Jakarta_Sans'] text-sm font-semibold">
                  Claim IDRS
                </span>
              </button>

              {showFaucet && (
                <FaucetPopover onClose={() => setShowFaucet(false)} />
              )}
            </div>

            <WalletWidget address={address || ""} balance={balance} />
          </div>
        </div>
      </nav>

      {showProfileModal && (
        <BusinessProfileModal
          profile={businessProfile}
          onSave={handleSaveProfile}
          onClose={() => {
            if (businessProfile) {
              setShowProfileModal(false);
            }
          }}
          isFirstTime={!businessProfile}
        />
      )}
    </>
  );
}

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isConnected } = useWallet();
  if (!isConnected) return <Navigate to="/" replace />;
  return children;
}

function LandingWrapper() {
  const { connectWallet, isConnected } = useWallet();
  if (isConnected) return <Navigate to="/borrower" replace />;
  return (
    <Landing onConnectWallet={connectWallet} isWalletConnected={isConnected} />
  );
}

export default function App() {
  return (
    <WalletProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <NavigationBar />
            <main>
              <Routes>
                <Route path="/" element={<LandingWrapper />} />
                <Route
                  path="/borrower"
                  element={
                    <ProtectedRoute>
                      <BorrowerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investor"
                  element={
                    <ProtectedRoute>
                      <InvestorMarketplace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/portfolio"
                  element={
                    <ProtectedRoute>
                      <Portfolio />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>
          </div>
          <Toaster position="top-center" />
        </Router>
      </DataProvider>
    </WalletProvider>
  );
}
