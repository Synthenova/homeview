import type { Metadata } from "next";
import "./globals.css";
import { Chatbot } from "@/components/Chatbot";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  metadataBase: new URL("https://homeview.ai"),
  title: {
    default: "Homeview | 3D Property Scanning and Shareable Home Models",
    template: "%s | Homeview"
  },
  description:
    "Homeview turns homes and properties into precise 3D spaces for real estate, architecture, construction, insurance, and homeowners.",
  openGraph: {
    title: "Homeview | Property scans rebuilt as 3D places",
    description: "Create shareable 3D property models from any room, floor, or home.",
    type: "website",
    images: ["/images/01-hero_3d_property_composite.png"]
  }
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Homeview",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Homeview creates shareable 3D property models for real estate, architecture, construction, insurance, and homeowners.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "19",
    highPrice: "199",
    priceCurrency: "USD"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
        <Header />
        {children}
        <Footer />
        <Chatbot />
      </body>
    </html>
  );
}
