# Gluon | Decentralized Stablecoin Creation Platform

Gluon is a decentralized platform built by [The Stable Order](https://stability.nexus) that allows users to create, deploy, and manage their own stablecoin reactors. It provides a unique "Atomic" DeFi mechanism where users can split (fission) base assets into stable (Neutron) and volatile (Proton) tokens, or merge (fusion) them back to redeem the underlying collateral.

## Features

- **Create Reactors**: Deploy your own stablecoin reactor with custom parameters (Base Asset, Stable Token, Volatile Token, Oracle Configuration).
- **Atomic Interactions**:
  - **Fission**: Split base collateral into Neutron (Stable) and Proton (Volatile) tokens.
  - **Fusion**: Merge Neutron and Proton tokens to redeem base collateral.
  - **Transmute**: Swap between Neutron and Proton tokens directly using the internal bonding curve.
- **Oracle Integration**: Automatically updates prices using Pyth Network oracles.
- **Wallet Connection**: Supports major wallets via RainbowKit (Metamask, WalletConnect, etc.).
- **Real-time Analytics**: View reactor status, reserve ratios, and token supplies.

## Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**:
  - [Shadcn UI](https://ui.shadcn.com/) (Radix Primitives)
  - [Framer Motion](https://www.framer.com/motion/) for animations.
  - [GSAP](https://gsap.com/) for advanced animations.
- **Web3 Integration**:
  - [Wagmi](https://wagmi.sh/) (React Hooks for Ethereum)
  - [Viem](https://viem.sh/) (TypeScript Interface for Ethereum)
  - [RainbowKit](https://www.rainbowkit.com/) (Wallet Connection)

## Installation and Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/StabilityNexus/Gluon-EVM-WebUI.git
   cd Gluon-EVM-WebUI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   pnpm install
   # or
   yarn install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

- `app/`: Next.js App Router pages and layouts.
  - `create/`: Page for deploying new reactors.
  - `[coinId]/`: Dynamic route for interacting with specific reactors.
- `components/`: Reusable UI components (Navigation, Buttons, Modals).
- `providers/`: Context providers (Theme, Wallet, QueryClient).
- `utils/`: Helper functions, ABIs, and configuration constants.
- `hooks/`: Custom React hooks.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
