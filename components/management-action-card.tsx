"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ManagementActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: "mint" | "burn" | "transfer" | "pause" | "settings";
  coinSymbol: string;
  onAction: (
    action: "mint" | "burn" | "transfer" | "pause" | "settings",
    data: { amount?: number; recipient?: string },
  ) => void | Promise<void>;
}

export function ManagementActionCard({
  title,
  description,
  icon,
  action,
  coinSymbol,
  onAction,
}: ManagementActionCardProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const data =
      action === "transfer"
        ? { amount: Number.parseFloat(amount), recipient }
        : { amount: Number.parseFloat(amount) };

    await onAction(action, data);
    setIsLoading(false);
    setAmount("");
    setRecipient("");
  };

  return (
    <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {action === "settings" || action === "pause" ? (
          <Button
            onClick={() => onAction(action, {})}
            disabled={isLoading}
            className="w-full"
            variant={action === "pause" ? "destructive" : "default"}
          >
            {isLoading ? "Processing..." : title}
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor={`amount-${action}`}>Amount</Label>
              <Input
                id={`amount-${action}`}
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>

            {action === "transfer" && (
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !amount}
              className="w-full"
            >
              {isLoading ? "Processing..." : `${title} ${coinSymbol}`}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
