"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, auth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthMessage } from "./auth-shell";
import { AuthLayout } from "./auth-layout";
import { useLanguage, tr } from "@/lib/language";

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const verified = params.get("verified") === "1";
  const oauthError = params.get("error");
  const providerError = oauthError && ["oauth_cancelled", "oauth_email_missing", "oauth_failed"].includes(oauthError)
    ? t("Đăng nhập với nhà cung cấp không thành công. Hãy thử lại.", "Signing in with the provider failed. Please try again.")
    : "";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
  const facebookEnabled = process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED === "true";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await auth.login(email, password);
      router.replace("/");
      router.refresh();
    } catch (cause) {
      if (cause instanceof ApiError) {
        setError(
          cause.status === 422
            ? Object.values(cause.errors ?? {}).flat()[0] ?? cause.message
            : cause.status === 403
              ? tr("Vui lòng xác minh email trước khi đăng nhập.", "Please verify your email before signing in.")
              : cause.status === 401
                ? tr("Email hoặc mật khẩu không đúng.", "Email or password is incorrect.")
                : cause.message
        );
      } else {
        setError(tr("Không thể kết nối máy chủ. Vui lòng thử lại.", "Could not reach the server. Please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title={t("Đăng nhập Englisk-Studi", "Sign in to Englisk-Studi")} description={t("Tiếp tục hành trình học tiếng Anh của bạn.", "Continue your English learning journey.")}>
          <AuthMessage error={error || providerError} success={verified ? t("Email đã được xác minh. Bạn có thể đăng nhập.", "Your email is verified. You can sign in now.") : ""} />
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold">Email</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold">{t("Mật khẩu", "Password")}</label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? t("Đang đăng nhập...", "Signing in...") : t("Đăng nhập", "Sign in")}
            </Button>
          </form>
          <div className="mt-4 flex justify-between text-sm"><Link href="/register" className="font-bold text-primary hover:underline">{t("Tạo tài khoản", "Create account")}</Link><Link href="/forgot-password" className="font-bold text-primary hover:underline">{t("Quên mật khẩu?", "Forgot password?")}</Link></div>
          {googleEnabled || facebookEnabled ? <><div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("hoặc", "or")}<span className="h-px flex-1 bg-border" /></div><div className="space-y-3">{googleEnabled ? <Button asChildCompat="a" variant="outline" className="w-full"><a href="/auth/google">{t("Tiếp tục với Google", "Continue with Google")}</a></Button> : null}{facebookEnabled ? <Button asChildCompat="a" variant="outline" className="w-full"><a href="/auth/facebook">{t("Tiếp tục với Facebook", "Continue with Facebook")}</a></Button> : null}</div></> : null}
    </AuthLayout>
  );
}
