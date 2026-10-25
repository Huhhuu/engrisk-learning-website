"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthMessage, AuthShell } from "./auth-shell";
import { messageFor } from "./form-support";
import { useLanguage, tr } from "@/lib/language";

export function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSuccess(""); setSubmitting(true);
    if (password !== confirmation) { setError(tr("Mật khẩu xác nhận không khớp.", "The password confirmation does not match.")); setSubmitting(false); return; }
    try {
      await auth.register(name, email, password, confirmation);
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (cause) {
      setError(messageFor(cause, tr("Không thể tạo tài khoản.", "Could not create the account.")));
    } finally { setSubmitting(false); }
  }

  return <AuthShell title={t("Tạo tài khoản", "Create account")} description={t("Bắt đầu lộ trình học tiếng Anh của bạn.", "Start your English learning path.")}>
    <AuthMessage error={error} success={success} />
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-bold">{t("Tên", "Name")}<Input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>
      <label className="block text-sm font-bold">Email<Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label className="block text-sm font-bold">{t("Mật khẩu", "Password")}<Input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <label className="block text-sm font-bold">{t("Xác nhận mật khẩu", "Confirm password")}<Input type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? t("Đang tạo...", "Creating...") : t("Tạo tài khoản", "Create account")}</Button>
    </form>
    <p className="mt-5 text-center text-sm text-muted-foreground">{t("Đã có tài khoản?", "Already have an account?")} <Link href="/login" className="font-bold text-primary hover:underline">{t("Đăng nhập", "Sign in")}</Link></p>
  </AuthShell>;
}
