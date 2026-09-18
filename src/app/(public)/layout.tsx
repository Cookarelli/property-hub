import { PublicHeader, PublicFooter } from "@/components/public-shell";
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main id="main-content">{children}</main>
      <PublicFooter />
    </>
  );
}
