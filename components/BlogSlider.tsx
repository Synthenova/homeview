import Image from "next/image";
import Link from "next/link";
import { AnimatedSection } from "@/components/AnimatedSection";
import { blogPosts } from "@/lib/blogs";

export function BlogSlider() {
  return (
    <AnimatedSection className="blog-strip section-page" aria-label="Homeview articles">
      <div className="section-kicker" data-animate>
        <p className="eyebrow">Guides</p>
        <h2>Practical ideas for property teams.</h2>
      </div>
      <div className="blog-slider" data-animate>
        {blogPosts.map((post) => (
          <Link className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
            <Image src={post.image} alt="" width={560} height={360} />
            <div>
              <span>{post.category} · {post.readingTime}</span>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </AnimatedSection>
  );
}
