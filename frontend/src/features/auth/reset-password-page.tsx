"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { auth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthMessage, AuthShell } from "./auth-shell";
import { messageFor } from "./form-support";
import { useLanguage, tr } from "@/lib/language";

export function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const params = useSearchParams(); const token = params.get("token") ?? ""; const email = params.get("email") ?? "";
  const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [submitting, setSubmitting] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try { await auth.resetPassword({ token, email, password, password_confirmation: confirmation }); router.replace("/login?reset=1"); } catch (cause) { setError(messageFor(cause, tr("Không thể đặt lại mật khẩu.", "Could not reset the password."))); } finally { setSubmitting(false); }
  }
  if (!token || !email) return <AuthShell title={t("Liên kết không hợp lệ", "Invalid link")} description={t("Liên kết đặt lại mật khẩu thiếu thông tin cần thiết.", "The password reset link is missing required information.")}><p role="alert" className="text-sm text-destructive">{t("Hãy yêu cầu một liên kết đặt lại mới.", "Please request a new reset link.")}</p><Link href="/forgot-password" className="mt-5 inline-block font-bold text-primary hover:underline">{t("Quên mật khẩu", "Forgot password")}</Link></AuthShell>;
  return <AuthShell title={t("Đặt lại mật khẩu", "Reset password")} description={t(`Đặt mật khẩu mới cho ${email}.`, `Set a new password for ${email}.`)}><AuthMessage error={error} success={success} /><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-bold">{t("Mật khẩu mới", "New password")}<Input type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label className="block text-sm font-bold">{t("Xác nhận mật khẩu", "Confirm password")}<Input type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label><Button type="submit" className="w-full" disabled={submitting}>{submitting ? t("Đang lưu...", "Saving...") : t("Đặt lại mật khẩu", "Reset password")}</Button></form></AuthShell>;
}
