import { signUp } from "../actions";
import { Button } from "@/components/ui/button";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <form action={signUp} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-bold">Create an account</h1>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium">
            I am a
          </label>
          <select
            id="role"
            name="role"
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="client">Client</option>
            <option value="provider">Provider</option>
          </select>
        </div>

        <Button type="submit">Sign up</Button>
      </form>
    </main>
  );
}