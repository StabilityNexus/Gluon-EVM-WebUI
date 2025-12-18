"use client";

import { useState, useEffect, useMemo } from "react";
import { useChainId } from "wagmi";
import { getChainNameForTokenList } from "@/utils/chainMapping";
import { Input } from "@/components/ui/input";

export interface Token {
  id: string;
  symbol: string;
  name: string;
  contract_address: string;
  image?: string;
}

interface TokenSelectorProps {
  value?: string;
  onChange: (address: string) => void;
  error?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  value = "",
  onChange,
  error,
  placeholder = "Enter ERC20 token address or select from list",
  label = "Token Address",
  required = false,
  className = "",
}) => {
  const chainId = useChainId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState(value);

  // Sync manualAddress with value prop
  useEffect(() => {
    if (value) {
      setManualAddress(value);
      // Check if value matches any token in the list
      const matchingToken = tokens.find(
        (token) => token.contract_address.toLowerCase() === value.toLowerCase()
      );
      if (!matchingToken) {
        setIsManualInput(true);
      }
    }
  }, [value, tokens]);

  // Get chain name for token list URL
  const chainName = useMemo(() => getChainNameForTokenList(chainId), [chainId]);

  // Fetch tokens from TokenList repository
  useEffect(() => {
    const fetchTokens = async () => {
      if (!chainName) {
        console.warn(`No token list available for chain ID ${chainId}`);
        return;
      }

      setLoading(true);
      try {
        const url = `https://raw.githubusercontent.com/StabilityNexus/TokenList/main/${chainName}-tokens.json`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch tokens: ${response.statusText}`);
        }
        const data = await response.json();
        // Handle both array and object formats
        const tokenArray = Array.isArray(data) ? data : Object.values(data);
        setTokens(tokenArray as Token[]);
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [chainName, chainId]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!searchQuery.trim()) return tokens;

    const query = searchQuery.toLowerCase();
    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(query) ||
        token.symbol.toLowerCase().includes(query) ||
        token.contract_address.toLowerCase().includes(query)
    );
  }, [tokens, searchQuery]);

  // Handle token selection
  const handleTokenSelect = (token: Token) => {
    onChange(token.contract_address);
    setManualAddress(token.contract_address);
    setIsManualInput(false);
    setIsModalOpen(false);
    setSearchQuery("");
  };

  // Handle manual input change
  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setManualAddress(address);
    onChange(address);
    setIsManualInput(true);
  };

  // Truncate address for display
  const truncateAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get selected token info for display
  const selectedToken = useMemo(() => {
    if (!value || isManualInput) return null;
    return tokens.find(
      (token) => token.contract_address.toLowerCase() === value.toLowerCase()
    );
  }, [value, tokens, isManualInput]);

  const fieldBaseClasses =
    "bg-[#0B0E15] border border-white/30 text-[13px] font-semibold tracking-[0.2em] text-white/85 placeholder:text-white/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70 focus:border-white/60 transition-colors duration-200 px-4 rounded-none font-mono cursor-text"
  const inputClasses = `${fieldBaseClasses} h-12`

  return (
    <div className={`w-full space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          {selectedToken && !isManualInput ? (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className={`${inputClasses} flex items-center gap-2 hover:border-white/50 ${
                error ? "border-red-500" : ""
              }`}
            >
              <img
                src={selectedToken.image || "/stability.svg"}
                alt={selectedToken.symbol}
                className="w-6 h-6 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/stability.svg";
                }}
              />
              <span className="font-medium">{selectedToken.symbol}</span>
              <span className="text-white/50">({selectedToken.name})</span>
              <span className="text-white/40 ml-auto text-xs">
                {truncateAddress(selectedToken.contract_address)}
              </span>
            </button>
          ) : (
            <Input
              type="text"
              value={manualAddress}
              onChange={handleManualInputChange}
              placeholder={placeholder}
              className={`${inputClasses} ${error ? "border-red-500" : ""}`}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-3 bg-[#0B0E15] hover:bg-[#0F1419] text-white/85 rounded-none border border-white/30 hover:border-white/50 transition-colors text-xs whitespace-nowrap font-mono tracking-[0.2em] uppercase"
        >
          {selectedToken && !isManualInput ? "Change" : "Select"}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs font-mono tracking-[0.1em]">{error}</p>
      )}

      {/* Token Selection Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#0B0E15] border-2 border-white/30 rounded-none max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/20">
              <h2 className="text-lg font-bold text-white/85 uppercase tracking-[0.3em] font-mono">Select Token</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/60 hover:text-white/85 text-2xl leading-none w-8 h-8 flex items-center justify-center transition-colors font-mono"
              >
                ×
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-white/20">
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tokens"
                  className="w-full pl-10 border-white/30 text-white/85 bg-[#0B0E15] font-mono"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Token List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center py-8 text-white/50 font-mono tracking-[0.2em]">
                  Loading tokens...
                </div>
              ) : filteredTokens.length === 0 ? (
                <div className="text-center py-8 text-white/50 font-mono tracking-[0.2em]">
                  {searchQuery
                    ? "No tokens found matching your search"
                    : "No tokens available for this chain"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.id}
                      type="button"
                      onClick={() => handleTokenSelect(token)}
                      className="w-full flex items-center gap-3 p-3 rounded-none hover:bg-[#0F1419] transition-colors text-left border border-transparent hover:border-white/20"
                    >
                      <img
                        src={token.image || "/stability.svg"}
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/stability.svg";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white/85 font-mono">
                            {token.symbol}
                          </span>
                          <span className="text-white/50 text-sm truncate">
                            {token.name}
                          </span>
                        </div>
                        <div className="text-white/40 text-xs font-mono mt-1">
                          {truncateAddress(token.contract_address)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Manual Input Option */}
            <div className="p-4 border-t border-white/20">
              <button
                type="button"
                onClick={() => {
                  setIsManualInput(true);
                  setIsModalOpen(false);
                }}
                className="w-full py-2 px-4 bg-[#0F1419] hover:bg-[#131820] text-white/85 rounded-none transition-colors text-xs font-mono tracking-[0.2em] uppercase border border-white/30 hover:border-white/50"
              >
                Enter Custom Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector;

