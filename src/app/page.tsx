import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShieldCheck, Bell, FileText } from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Real-time messaging",
    description:
      "Chat directly with your client or provider the moment a booking is confirmed.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    description:
      "Pay and get paid safely through Stripe, with instant confirmation.",
  },
  {
    icon: Bell,
    title: "Instant notifications",
    description:
      "Never miss a new message, a confirmed booking, or a completed payment.",
  },
  {
    icon: FileText,
    title: "Automatic invoices",
    description:
      "Every payment generates a downloadable PDF invoice, ready to keep.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="text-lg font-bold">Bookly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Book trusted services, in real time
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            The marketplace where bookings actually{" "}
            <span className="text-primary">get confirmed</span>.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect with service providers, chat instantly, pay securely,
            and keep every invoice — all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Bookly. Built as a learning project.
      </footer>
    </div>
  );
}