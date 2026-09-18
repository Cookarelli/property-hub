import { requireUser } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <>
      <header className="public-header">
        <Brand />
        <span className="text-sm text-muted-foreground">Secure workspace</span>
        <form action={signOut}>
          <Button variant="outline">Sign out</Button>
        </form>
      </header>
      <main id="main-content" className="public-section">
        {children}
      </main>
    </>
  );
}
