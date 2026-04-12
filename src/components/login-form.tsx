"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LogIn, Swords } from "lucide-react";

export function LoginForm() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <Swords className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              AtlasAta Queue
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Şamata 5v5 Lobby Yönetim Paneli
            </p>
          </div>
        </div>

        <Card className="border-border/50 shadow-xl backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Giriş Yap</CardTitle>
            <CardDescription>
              Kick hesabınızla giriş yaparak dashboard&apos;a erişin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />
            <Button
              onClick={() => signIn("kick", { callbackUrl: "/" })}
              className="w-full h-11 gap-2 text-sm font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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

        <p className="text-center text-xs text-muted-foreground/60">
          AtlasAta tarafından geliştirildi
        </p>
      </div>
    </div>
  );
}
