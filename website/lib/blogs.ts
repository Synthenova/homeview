export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  date: string;
  readingTime: string;
  body: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "real-estate-virtual-tours-qualified-buyers",
    title: "How 3D virtual tours bring more qualified property buyers",
    description:
      "A practical guide to using a 3D property walkthrough to reduce low-intent showings and improve buyer confidence.",
    category: "Real estate",
    image: "/images/blog/real-estate-virtual-tours.png",
    date: "2026-05-16",
    readingTime: "5 min read",
    body: [
      "Property marketing works best when buyers can understand the home before they schedule a visit. A 3D virtual tour gives them room flow, scale, light, and context in a way flat galleries rarely can.",
      "For agents, the value is not only visual polish. It is buyer qualification. People who book after exploring a model tend to have fewer basic questions and a clearer sense of whether the home fits their needs.",
      "A strong virtual tour should be easy to open, fast to share, and connected to the listing page. Homeview is designed for that workflow: capture once, publish a shareable model, and keep the property easy to inspect from any device.",
      "The best results come from pairing the 3D model with concise listing copy, accurate floor context, and a clear call to action for booking a tour or requesting details."
    ]
  },
  {
    slug: "construction-progress-documentation-3d-scans",
    title: "Using 3D scans for cleaner construction progress records",
    description:
      "How builders can document rooms, finishes, and jobsite progress without relying on scattered photo folders.",
    category: "Construction",
    image: "/images/blog/construction-progress-scans.png",
    date: "2026-05-16",
    readingTime: "6 min read",
    body: [
      "Construction documentation often breaks down because the record is fragmented across messages, folders, and site photos. A 3D scan creates a single spatial reference that teams can revisit.",
      "A walkthrough model makes it easier to compare room conditions, review finishes, and explain progress to stakeholders who are not on site. It also reduces ambiguity when a detail needs to be checked later.",
      "For builders, the goal is not to replace project management tools. It is to add visual context that those tools usually miss. Homeview can sit beside your existing workflow as the visual layer for site progress.",
      "The most useful scans are captured at consistent milestones: pre-work, rough-in, finish installation, punch list, and handoff."
    ]
  },
  {
    slug: "insurance-home-inventory-digital-property-record",
    title: "Why every homeowner should keep a digital property record",
    description:
      "A homeowner-friendly approach to documenting rooms, finishes, furniture, and property condition for insurance and renovation planning.",
    category: "Insurance",
    image: "/images/blog/insurance-home-inventory.png",
    date: "2026-05-16",
    readingTime: "4 min read",
    body: [
      "A home changes over time. Renovations, repairs, purchases, and wear all affect the property record. Most homeowners only realize they need documentation after something goes wrong.",
      "A digital property record gives you a visual baseline. It can support insurance conversations, renovation planning, maintenance tracking, and future selling preparation.",
      "The record does not need to be complicated. A scan of each major room, paired with notes and shareable access, is already more useful than a folder of disconnected photos.",
      "Homeview keeps that record easy to revisit, share, and update when the home changes."
    ]
  },
  {
    slug: "architecture-client-review-3d-walkthroughs",
    title: "3D walkthroughs make architecture reviews easier to understand",
    description:
      "How architects can use existing-room scans and walkthroughs to make client conversations more concrete.",
    category: "Architecture",
    image: "/images/blog/architecture-client-review.png",
    date: "2026-05-16",
    readingTime: "5 min read",
    body: [
      "Clients do not always read drawings the way architects do. A 3D walkthrough gives them spatial context before the conversation gets technical.",
      "For renovation and residential work, scanning the existing space creates a shared baseline. Everyone can refer to the same room, wall, opening, or constraint.",
      "That shared reference can shorten meetings and improve decisions. Instead of explaining every condition from memory, the team can point to the model.",
      "Homeview is useful in early discovery, client review, and project handoff because the model remains understandable to non-technical stakeholders."
    ]
  },
  {
    slug: "homeowner-renovation-digital-record-before-sale",
    title: "Create a digital home record before renovating or selling",
    description:
      "A simple homeowner checklist for capturing a property before major renovation work or listing prep begins.",
    category: "Homeowners",
    image: "/images/blog/homeowner-digital-record.png",
    date: "2026-05-16",
    readingTime: "4 min read",
    body: [
      "Before a renovation or sale, capture the home as it exists today. That record helps with planning, contractor conversations, insurance, and future comparison.",
      "Start with the spaces most likely to change: kitchen, living room, bathrooms, bedrooms, entry, basement, and exterior access points.",
      "A 3D record gives better context than photos alone because it preserves layout and relationships between rooms.",
      "Homeview turns that capture into a shareable model so family members, contractors, agents, or advisors can review the same property context."
    ]
  }
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
