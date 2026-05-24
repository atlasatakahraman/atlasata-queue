"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-4 text-center animate-slide-down-fade">
          <div className="relative h-20 w-20 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/TheAtlasB2048.png"
              alt="TheAtlas"
              width={80}
              height={80}
              className="absolute inset-0 w-full h-full block dark:hidden object-cover rounded-2xl shadow-lg ring-1 ring-border/20"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/TheAtlasW2048.png"
              alt="TheAtlas"
              width={80}
              height={80}
              className="absolute inset-0 w-full h-full hidden dark:block object-cover rounded-2xl shadow-lg ring-1 ring-border/20"
            />
          </div>
          <div>
            <h1
              className="font-heading text-3xl font-semibold tracking-tight"
              style={{ letterSpacing: "-0.03em" }}
            >
              TheAtlas — Queue
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Şamata 5v5 Lobby Yönetim Paneli
            </p>
          </div>
        </div>

        <div className="animate-slide-up-fade" style={{ animationDelay: "100ms" }}>
          <Card className="border-border/50 shadow-xl glass-warm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg font-heading">Giriş Yap</CardTitle>
              <CardDescription>
                Kick hesabınızla giriş yaparak dashboard&apos;a erişin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Separator />
              <Button
                onClick={() => signIn("kick", { callbackUrl: "/" })}
                className="cursor-pointer w-full h-12 gap-2 text-sm font-medium font-serif transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                size="lg"
                id="kick-login-button"
              >
                <LogIn className="h-4 w-4" />
                Kick ile Giriş Yap
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Giriş yaparak canlı yayın sohbetinize bağlanabilirsiniz.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="animate-slide-up-fade" style={{ animationDelay: "200ms" }}>
          <p className="text-center text-xs text-muted-foreground/60">
            Atlas Ata KAHRAMAN tarafından geliştirildi
          </p>
        </div>
      </div>
    </div>
  );
}
