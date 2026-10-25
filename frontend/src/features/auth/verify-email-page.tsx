"use client";

import Link from "next/link";
import { useState } from "react";
import { auth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AuthMessage, AuthShell } from "./auth-shell";
import { messageFor } from "./form-support";
import { useLanguage, tr } from "@/lib/language";

export function VerifyEmailPage() {
  const { t } = useLanguage();
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [sending, setSending] = useState(false);
  async function resend() { setError(""); setSending(true); try { setSuccess((await auth.resendVerification()).message); } catch (cause) { setError(messageFor(cause, tr("Không thể gửi lại email.", "Could not resend the email."))); } finally { setSending(false); } }
  return <AuthShell title={t("Xác minh email", "Verify your email")} description={t("Mở email của bạn và nhấn liên kết xác minh để đăng nhập.", "Open your email and click the verification link to sign in.")}><AuthMessage error={error} success={success} /><Button type="button" className="w-full" variant="outline" onClick={resend} disabled={sending}>{sending ? t("Đang gửi...", "Sending...") : t("Gửi lại email xác minh", "Resend verification email")}</Button><p className="mt-5 text-center text-sm"><Link href="/login" className="font-bold text-primary hover:underline">{t("Quay lại đăng nhập", "Back to sign in")}</Link></p></AuthShell>;
}
