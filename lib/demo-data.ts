export interface Stablecoin {
  id: string
  name: string
  symbol: string
  price: number
  marketCap: number
  volume24h: number
  change24h: number
  totalSupply: number
  collateralRatio: number
  blockchain: string
  creator: string
  createdAt: string
  description: string
}

export interface UserCoin extends Stablecoin {
  balance: number
  valueUSD: number
  isOwner: boolean
}

export const demoStablecoins: Stablecoin[] = [
  {
    id: "1",
    name: "USD Stable Token",
    symbol: "USDT",
    price: 1.0,
    marketCap: 83500000000,
    volume24h: 28400000000,
    change24h: 0.02,
    totalSupply: 83500000000,
    collateralRatio: 105,
    blockchain: "Ethereum",
    creator: "0x742d35Cc6634C0532925a3b8D4C9db96590fcaAb",
    createdAt: "2023-01-15",
    description: "A fully collateralized USD-pegged stablecoin backed by US Treasury bonds and cash equivalents.",
  },
  {
    id: "2",
    name: "Digital Dollar Coin",
    symbol: "USDC",
    price: 0.999,
    marketCap: 25800000000,
    volume24h: 4200000000,
    change24h: -0.01,
    totalSupply: 25800000000,
    collateralRatio: 100,
    blockchain: "Ethereum",
    creator: "0x8ba1f109551bD432803012645Hac136c22C501e5",
    createdAt: "2023-02-20",
    description: "A regulated stablecoin backed 1:1 by US dollars held in reserve by regulated financial institutions.",
  },
  {
    id: "3",
    name: "Binance USD",
    symbol: "BUSD",
    price: 1.001,
    marketCap: 5200000000,
    volume24h: 1800000000,
    change24h: 0.05,
    totalSupply: 5200000000,
    collateralRatio: 102,
    blockchain: "BSC",
    creator: "0x4Fabb145d64652a948d72533023f6E7A623C7C53",
    createdAt: "2023-03-10",
    description:
      "A dollar-backed stablecoin approved and regulated by the New York State Department of Financial Services.",
  },
  {
    id: "4",
    name: "Dai Stablecoin",
    symbol: "DAI",
    price: 0.998,
    marketCap: 4100000000,
    volume24h: 890000000,
    change24h: -0.03,
    totalSupply: 4100000000,
    collateralRatio: 150,
    blockchain: "Ethereum",
    creator: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    createdAt: "2023-01-05",
    description:
      "A decentralized stablecoin soft-pegged to the US Dollar through an autonomous system of smart contracts.",
  },
  {
    id: "5",
    name: "TrueUSD",
    symbol: "TUSD",
    price: 1.002,
    marketCap: 2800000000,
    volume24h: 420000000,
    change24h: 0.08,
    totalSupply: 2800000000,
    collateralRatio: 103,
    blockchain: "Ethereum",
    creator: "0x0000000000085d4780B73119b644AE5ecd22b376",
    createdAt: "2023-04-12",
    description: "A USD-backed stablecoin that provides real-time attestations of escrowed balances.",
  },
  {
    id: "6",
    name: "Pax Dollar",
    symbol: "USDP",
    price: 0.999,
    marketCap: 980000000,
    volume24h: 85000000,
    change24h: -0.02,
    totalSupply: 980000000,
    collateralRatio: 100,
    blockchain: "Ethereum",
    creator: "0x8E870D67F660D95d5be530380D0eC0bd388289E1",
    createdAt: "2023-05-18",
    description:
      "A regulated stablecoin backed by US dollars and approved by the New York State Department of Financial Services.",
  },
  {
    id: "7",
    name: "Frax",
    symbol: "FRAX",
    price: 1.001,
    marketCap: 640000000,
    volume24h: 12000000,
    change24h: 0.04,
    totalSupply: 640000000,
    collateralRatio: 92,
    blockchain: "Ethereum",
    creator: "0x853d955aCEf822Db058eb8505911ED77F175b99e",
    createdAt: "2023-06-25",
    description:
      "The first fractional-algorithmic stablecoin protocol that uses a combination of collateral and algorithmic mechanisms.",
  },
  {
    id: "8",
    name: "Magic Internet Money",
    symbol: "MIM",
    price: 0.997,
    marketCap: 180000000,
    volume24h: 8500000,
    change24h: -0.06,
    totalSupply: 180000000,
    collateralRatio: 110,
    blockchain: "Ethereum",
    creator: "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3",
    createdAt: "2023-07-30",
    description:
      "A multi-collateral stablecoin that allows users to mint MIM using interest-bearing tokens as collateral.",
  },
]

export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(1)}B`
  }
  if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(1)}M`
  }
  if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(1)}K`
  }
  return `$${num.toFixed(2)}`
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(3)}`
}

export function formatPercentage(percentage: number): string {
  const sign = percentage >= 0 ? "+" : ""
  return `${sign}${percentage.toFixed(2)}%`
}
