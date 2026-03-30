import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Stablecoin, formatNumber } from "@/lib/demo-data";
import Link from "next/link";

interface StablecoinCardProps {
  stablecoin: Stablecoin;
}

export function StablecoinCard({ stablecoin }: StablecoinCardProps) {
  const cardStyle = {
    fontFamily: "'Orbitron', 'Space Mono', 'Courier New', monospace",
    fontWeight: "500",
    letterSpacing: "0.02em",
  };

  return (
    <Card className="cursor-target" style={cardStyle}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                {stablecoin.symbol.charAt(0)}
              </span>
            </div>
            <div>
              <h3
                className="font-semibold text-lg"
                style={{ textShadow: "0 0 5px rgba(255, 255, 255, 0.1)" }}
              >
                {stablecoin.name}
              </h3>
              <p
                className="text-muted-foreground text-sm"
                style={{ textShadow: "0 0 3px rgba(255, 255, 255, 0.1)" }}
              >
                {stablecoin.symbol}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{stablecoin.blockchain}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Market Cap</p>
            <p className="font-semibold">
              {formatNumber(stablecoin.marketCap)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Supply</p>
            <p className="font-semibold">
              {formatNumber(stablecoin.totalSupply)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Description</p>
          <p className="text-sm text-pretty">{stablecoin.description}</p>
        </div>

        <div className="pt-2">
          <Link href={`/${stablecoin.id}`}>
            <Button
              className="w-full bg-transparent cursor-target border-white/20"
              variant="outline"
              style={{
                letterSpacing: "0.05em",
                textShadow: "0 0 3px rgba(255, 255, 255, 0.1)",
              }}
            >
              View Details
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
