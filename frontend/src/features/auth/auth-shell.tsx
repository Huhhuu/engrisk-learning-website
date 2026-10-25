import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageToggle } from "@/components/layout/language-toggle";

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between gap-4"><Link href="/" className="w-fit font-display text-xl font-bold text-primary">Englisk-Studi</Link><LanguageToggle /></div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}

export function AuthMessage({ error, success }: { error?: string; success?: string }) {
  return <>
    {error ? <p role="alert" className="mb-4 rounded-xl border-2 border-destructive/30 bg-destructive/10 p-3 text-sm font-semibold text-destructive">{error}</p> : null}
    {success ? <p role="status" aria-live="polite" className="mb-4 rounded-xl border-2 border-primary/20 bg-accent p-3 text-sm font-semibold text-accent-foreground">{success}</p> : null}
  </>;
}
