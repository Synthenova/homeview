import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AnimatedSection } from "@/components/AnimatedSection";
import { blogPosts } from "@/lib/blogs";

export const metadata: Metadata = {
  title: "3D Property Scanning Guides",
  description:
    "Homeview guides on 3D virtual tours, property documentation, construction records, and digital home inventory."
};

export default function BlogIndexPage() {
  return (
    <main>
      <AnimatedSection className="blog-index section-page">
        <div className="section-kicker" data-animate>
          <p className="eyebrow">Homeview blog</p>
          <h1>Guides for better property records.</h1>
        </div>
        <div className="blog-grid" data-animate>
          {blogPosts.map((post) => (
            <Link className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
              <Image src={post.image} alt="" width={640} height={420} />
              <div>
                <span>{post.category} · {post.readingTime}</span>
                <h2>{post.title}</h2>
                <p>{post.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </AnimatedSection>
    </main>
  );
}
