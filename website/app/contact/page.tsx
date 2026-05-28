import type { Metadata } from "next";
import Link from "next/link";
import { AnimatedSection } from "@/components/AnimatedSection";
import { CalEmbed } from "@/components/CalEmbed";
import { ContactForm } from "@/components/ContactForm";
import { contactEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Homeview",
  description:
    "Contact Homeview for a 3D property scan quote, virtual walkthrough demo, or consultation."
};

export default function ContactPage() {
  return (
    <main>
      <AnimatedSection className="contact-hero section-page">
        <div className="section-kicker" data-animate>
          <p className="eyebrow">Contact us</p>
          <h1>Get a quote for your next property scan.</h1>
          <p>
            Send the property type, location, and timeline. You can also book a 15-minute call
            directly below.
          </p>
          <Link href={`mailto:${contactEmail}`}>{contactEmail}</Link>
        </div>
        <div data-animate>
          <ContactForm />
        </div>
      </AnimatedSection>
      <AnimatedSection className="cal-section section-page" id="book-call">
        <div className="section-kicker" data-animate>
          <p className="eyebrow">Book a call</p>
          <h2>Talk through the fastest capture path.</h2>
        </div>
        <div data-animate>
          <CalEmbed />
        </div>
      </AnimatedSection>
    </main>
  );
}
