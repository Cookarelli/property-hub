import { ContactForm } from "@/components/personal";
export const metadata = { title: "Contact" };
export default function ContactPage() {
  return (
    <section className="public-section listing-page">
      <ContactForm publicPage />
    </section>
  );
}
