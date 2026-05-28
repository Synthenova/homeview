import Image from "next/image";
import Link from "next/link";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BlogSlider } from "@/components/BlogSlider";
import { CalEmbed } from "@/components/CalEmbed";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { PlayCanvasViewer } from "@/components/PlayCanvasViewer";
import { ProofTestimonialCarousel } from "@/components/ProofTestimonialCarousel";
import { UseCaseFeaturedCard } from "@/components/UseCaseFeaturedCard";

export default function HomePage() {
  return (
    <main>
      <AnimatedSection className="hero" as="section">
        <HeroBackgroundVideo />
        <div className="hero-copy" data-animate>
          <h1>Your property, rebuilt as a 3D place</h1>
          <p>Scan any space. We turn it into a precise, explorable 3D model you can share.</p>
          <Link className="button button-dark hero-cta" href="/#examples">
            <span>Try Demo</span>
            <span aria-hidden="true">↗</span>
          </Link>
          <div className="trust-row" aria-label="Trusted by property pros and homeowners">
            <Image src="/images/02-trust_avatar_group.png" alt="Four Homeview customers" width={83} height={28} />
            <span>Trusted by 12,000+ property pros<br />and homeowners</span>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="process-suite" aria-label="Who Homeview is for and how it works">
        <div className="audience-band" aria-label="Built for" data-animate>
          <div className="audience-intro">
            <p className="eyebrow">Built for</p>
            <h2>Real Estate, AirBNB, Insurance, Rental.</h2>
          </div>
          <div className="audience-grid">
            {[
              ["home-icon", "Real Estate", "List and market with confidence"],
              ["user-icon", "AirBNB", "Show guests exactly what they are booking"],
              ["shield-icon", "Insurance", "Assess and record accurately"],
              ["cube-icon", "Rental", "Document units and handoffs clearly"]
            ].map(([icon, title, copy]) => (
              <article key={title}>
                <AudienceIcon name={icon} />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="workflow" aria-label="How Homeview works" data-animate>
          <p className="eyebrow">How it works</p>
          <div className="workflow-grid">
            <WorkflowCard
              number="01"
              title="Choose a capture"
              copy="Tell us the property type, rooms, and intended use."
              image="/images/03-how_it_works_01_plan_stack.png"
              alt="Stacked architectural plan sheets"
              className="plan-stack"
              width={203}
              height={152}
            />
            <WorkflowCard
              number="02"
              title="Record every room"
              copy="Capture with your phone, 360° camera, or managed scan."
              image="/images/04-how_it_works_02_room_capture.png"
              alt="A cutaway room being captured in 3D"
              className="room-capture"
              width={270}
              height={206}
            />
            <article className="workflow-card share-card">
              <div className="workflow-heading">
                <span>03</span>
                <div>
                  <h2>Get a shareable link</h2>
                  <p>Explore, measure, and share from anywhere.</p>
                </div>
              </div>
              <div className="share-preview">
                <div className="share-window">
                  <div>
                    <strong>My Property</strong>
                    <span>homeview.app/t/3x9d...</span>
                  </div>
                  <button type="button">Copy link</button>
                </div>
                <Image src="/images/05-how_it_works_03_share_preview_photo.png" alt="Modern living room preview inside a share card" width={235} height={80} />
              </div>
            </article>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="viewer-section" id="examples" aria-label="Explore a sample home">
        <p className="eyebrow" data-animate>Explore a sample home</p>
        <div data-animate>
          <PlayCanvasViewer />
        </div>
      </AnimatedSection>

      <AnimatedSection className="use-cases section-page" id="use-cases" aria-label="3D property model use cases">
        <div className="section-kicker" data-animate>
          <p className="eyebrow">Use cases</p>
          <h2>One scan, many decisions.</h2>
        </div>
        <div className="use-case-grid" data-animate>
          <UseCaseFeaturedCard />
          <article className="use-card use-card--accent use-card--airbnb">
            <div className="use-card-accent" aria-hidden="true" />
            <span>02</span>
            <h3>AirBNB</h3>
            <p>Show guests exactly what they are booking.</p>
          </article>
          <article className="use-card use-card--accent use-card--insurance">
            <div className="use-card-accent" aria-hidden="true" />
            <span>03</span>
            <h3>Insurance</h3>
            <p>Assess and record accurately.</p>
          </article>
          <article className="use-card use-card--accent use-card--rental">
            <div className="use-card-accent" aria-hidden="true" />
            <span>04</span>
            <h3>Rental</h3>
            <p>Document units and handoffs clearly.</p>
          </article>
        </div>
      </AnimatedSection>

      <AnimatedSection className="proof-section section-page" aria-label="Why teams choose Homeview">
        <div className="proof-copy" data-animate>
          <p className="eyebrow">Why teams switch</p>
          <h2>Fewer site visits. Cleaner records. Faster approvals.</h2>
          <p>Homeview gives every stakeholder the same visual context, from first listing photos to post-project documentation.</p>
        </div>
        <div className="proof-panel" data-animate>
          <ProofTestimonialCarousel />
        </div>
        <div className="proof-list" aria-label="Homeview benefits" data-animate>
          <div><strong>Measured context</strong><span>Rooms, plans, and visual records stay connected.</span></div>
          <div><strong>Shareable by default</strong><span>Send a model instead of compressing a folder.</span></div>
          <div><strong>Built for search</strong><span>Clear pages for 3D property scanning, virtual tours, and home records.</span></div>
        </div>
      </AnimatedSection>

      <BlogSlider />

      <AnimatedSection className="faq-section section-page" id="questions" aria-label="Frequently asked questions">
        <div className="section-kicker" data-animate>
          <p className="eyebrow">Questions</p>
          <h2>What buyers, builders, and owners ask first.</h2>
        </div>
        <div className="faq-list" data-animate>
          <FAQ title="Is Homeview a virtual tour tool?" copy="Yes, but it is built around reusable 3D property models, not only a one-time listing walkthrough." />
          <FAQ title="Can teams use it for construction documentation?" copy="Yes. Capture a room or full property, then share the model with stakeholders who need progress context." />
          <FAQ title="Does it work for homeowners?" copy="Homeowners can keep a digital record for renovations, maintenance, insurance, and future selling." />
          <FAQ title="What can I share?" copy="You can share a property link with visuals, floor context, measurements, and room-level navigation." />
        </div>
      </AnimatedSection>

      <AnimatedSection className="cal-section section-page" id="book-call" aria-label="Book a Homeview consultation">
        <div className="section-kicker" data-animate>
          <p className="eyebrow">Book a call</p>
          <h2>See if Homeview fits your next property.</h2>
        </div>
        <div data-animate>
          <CalEmbed compact />
        </div>
      </AnimatedSection>

      <AnimatedSection className="closing-cta section-page" aria-label="Start with Homeview">
        <div data-animate>
          <p className="eyebrow">Start today</p>
          <h2>Turn the next property into a place people can inspect.</h2>
        </div>
        <Link className="button button-dark" href="/contact" data-animate>
          <span>Contact us</span>
          <span aria-hidden="true">↗</span>
        </Link>
      </AnimatedSection>
    </main>
  );
}

function WorkflowCard(props: {
  number: string;
  title: string;
  copy: string;
  image: string;
  alt: string;
  className: string;
  width: number;
  height: number;
}) {
  return (
    <article className="workflow-card">
      <div className="workflow-heading">
        <span>{props.number}</span>
        <div>
          <h2>{props.title}</h2>
          <p>{props.copy}</p>
        </div>
      </div>
      <Image className={`workflow-image ${props.className}`} src={props.image} alt={props.alt} width={props.width} height={props.height} />
    </article>
  );
}

function FAQ({ title, copy }: { title: string; copy: string }) {
  return (
    <article>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

function AudienceIcon({ name }: { name: string }) {
  const strokeWidth = "1.25";
  switch (name) {
    case "home-icon":
      return (
        <svg className="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case "user-icon":
      return (
        <svg className="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "shield-icon":
      return (
        <svg className="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "cube-icon":
      return (
        <svg className="line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}
