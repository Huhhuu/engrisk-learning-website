"use client";

import Link from "next/link";
import { useState } from "react";
import { auth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthMessage, AuthShell } from "./auth-shell";
import { messageFor } from "./form-support";
import { useLanguage, tr } from "@/lib/language";

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [submitting, setSubmitting] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try { await auth.forgotPassword(email); setSuccess(tr("Nếu tài khoản tồn tại, liên kết đặt lại đã được gửi.", "If the account exists, a reset link has been sent.")); } catch (cause) { setError(messageFor(cause, tr("Không thể gửi email đặt lại mật khẩu.", "Could not send the password reset email."))); } finally { setSubmitting(false); }
  }
  return <AuthShell title={t("Quên mật khẩu?", "Forgot password?")} description={t("Chúng tôi sẽ gửi liên kết đặt lại nếu email này có tài khoản.", "We will send a reset link if this email has an account.")}>
    <AuthMessage error={error} success={success} />
    <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-bold">Email<Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><Button type="submit" className="w-full" disabled={submitting}>{submitting ? t("Đang gửi...", "Sending...") : t("Gửi liên kết", "Send link")}</Button></form>
    <p className="mt-5 text-center text-sm"><Link href="/login" className="font-bold text-primary hover:underline">{t("Quay lại đăng nhập", "Back to sign in")}</Link></p>
  </AuthShell>;
}
