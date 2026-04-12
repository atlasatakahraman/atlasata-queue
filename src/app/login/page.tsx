import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Giriş Yap — atlasata Queue",
  description: "Kick hesabınızla giriş yaparak atlasata Queue dashboard'a erişin.",
};

export default function LoginPage() {
  return <LoginForm />;
}
