import { LoginForm } from "@/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş Yap — TheAtlas — Queue",
  description:
    "Kick hesabınızla giriş yaparak TheAtlas — Queue dashboard'a erişin.",
};

export default function LoginPage() {
  return <LoginForm />;
}
