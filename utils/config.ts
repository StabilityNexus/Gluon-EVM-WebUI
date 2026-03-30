import { createConfig, http } from "wagmi";
import { SUPPORTED_CHAINS } from "@/lib/chains";

export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  transports: {
    534351: http(),
    5115: http(),
    31: http(),
  },
  ssr: true,
});
