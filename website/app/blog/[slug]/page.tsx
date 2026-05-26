import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimatedSection } from "@/components/AnimatedSection";
import { blogPosts, getBlogPost } from "@/lib/blogs";

type BlogPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [post.image]
    }
  };
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <main>
      <AnimatedSection className="article-page" as="article">
        <Link className="article-back" href="/blog" data-animate>
          ← Blog
        </Link>
        <header data-animate>
          <p className="eyebrow">{post.category}</p>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          <span>{post.date} · {post.readingTime}</span>
        </header>
        <div data-animate>
          <Image className="article-cover" src={post.image} alt="" width={1200} height={760} priority />
        </div>
        <div className="article-body" data-animate>
          {post.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <footer className="article-cta" data-animate>
          <h2>Need a property scan for your next project?</h2>
          <Link className="button button-dark" href="/contact">
            Contact us <span aria-hidden="true">↗</span>
          </Link>
        </footer>
      </AnimatedSection>
    </main>
  );
}
