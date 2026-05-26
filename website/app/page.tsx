import Image from "next/image";
import Link from "next/link";
import { AnimatedSection } from "@/components/AnimatedSection";
import { BlogSlider } from "@/components/BlogSlider";
import { CalEmbed } from "@/components/CalEmbed";
import { HeroBackgroundVideo } from "@/components/HeroBackgroundVideo";
import { PlayCanvasViewer } from "@/components/PlayCanvasViewer";

export default function HomePage() {
  return (
    <main>
      <AnimatedSection className="hero" as="section">
        <HeroBackgroundVideo />
        <div className="hero-copy" data-animate>
          <h1>Your property, rebuilt as a 3D place</h1>
          <p>Scan any space. We turn it into a precise, explorable 3D model you can share.</p>
          <Link className="button button-dark hero-cta" href="/contact">
            <span>Get quote</span>
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
            <h2>Real estate, architecture, construction, and beyond.</h2>
          </div>
          <div className="audience-grid">
            {[
              ["home-icon", "Real estate", "List and market with confidence"],
              ["cube-icon", "Architecture", "Document and present ideas"],
              ["helmet-icon", "Construction", "Track progress on site"],
              ["shield-icon", "Insurance", "Assess and record accurately"],
              ["user-icon", "Homeowners", "Keep a digital record of your home"]
            ].map(([icon, title, copy]) => (
              <article key={title}>
                <span className={`line-icon ${icon}`} aria-hidden="true" />
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
              width={140}
              height={117}
            />
            <WorkflowCard
              number="02"
              title="Record every room"
              copy="Capture with your phone, 360° camera, or managed scan."
              image="/images/04-how_it_works_02_room_capture.png"
              alt="A cutaway room being captured in 3D"
              className="room-capture"
              width={223}
              height={122}
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
                <Image src="/images/05-how_it_works_03_share_preview_photo.png" alt="Modern living room preview inside a share card" width={167} height={57} />
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
          <article className="use-card large-use">
            <span>01</span>
            <h3>Real estate virtual tours</h3>
            <p>Replace flat listing galleries with a measured 3D home tour buyers can inspect before visiting.</p>
          </article>
          <article className="use-card"><span>02</span><h3>Architecture review</h3><p>Share room context, layout constraints, and design direction with clients before a site visit.</p></article>
          <article className="use-card"><span>03</span><h3>Construction records</h3><p>Capture progress across rooms, floors, and handoff stages with one visual source of truth.</p></article>
          <article className="use-card"><span>04</span><h3>Insurance documentation</h3><p>Keep an accurate visual record of finishes, dimensions, fixtures, and room conditions.</p></article>
          <article className="use-card image-use">
            <Image src="/images/11-stats_room_thumbnail.png" alt="A captured room preview from a 3D property model" width={112} height={54} />
            <p>Built for searchable property documentation, remote walkthroughs, and reusable visual records.</p>
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
          <blockquote>“We stopped sending ten separate photo folders. The 3D model became the shared reference for the property.”</blockquote>
          <div className="proof-author">
            <Image src="/images/02-trust_avatar_group.png" alt="Homeview customer avatars" width={83} height={28} />
            <span>Property teams, architects, and homeowners</span>
          </div>
        </div>
        <div className="proof-list" aria-label="Homeview benefits" data-animate>
          <div><strong>Measured context</strong><span>Rooms, plans, and visual records stay connected.</span></div>
          <div><strong>Shareable by default</strong><span>Send a model instead of compressing a folder.</span></div>
          <div><strong>Built for search</strong><span>Clear pages for 3D property scanning, virtual tours, and home records.</span></div>
        </div>
      </AnimatedSection>

      <BlogSlider />

      <AnimatedSection className="plans-suite section-page" id="plans" aria-label="Plans and Homeview metrics">
        <div className="pricing-section" aria-label="Plans that fit your project" data-animate>
          <p className="eyebrow">Plans that fit your project</p>
          <div className="pricing-grid">
            <PriceCard title="Starter" copy="For simple homes and personal use." price="$19" image="/images/08-pricing_starter_3d_model.png" alt="Starter plan 3D home model" />
            <PriceCard title="Pro" copy="For professionals who need more." price="$59" image="/images/09-pricing_pro_3d_model.png" alt="Pro plan detailed 3D property model" featured />
            <PriceCard title="Team" copy="For teams and large projects." price="$199" image="/images/10-pricing_team_3d_model.png" alt="Team plan large 3D home model" team />
          </div>
          <div className="plan-includes" aria-label="All plans include">
            <span>All plans include:</span>
            <span>✓ Unlimited views</span>
            <span>✓ High-resolution exports</span>
            <span>✓ Measurements</span>
            <span>✓ Secure sharing</span>
          </div>
        </div>
        <div className="metrics-strip" aria-label="Homeview metrics" data-animate>
          <div><strong>12k+</strong><span>Projects created</span></div>
          <div><strong>8M+</strong><span>Rooms scanned</span></div>
          <div><strong>195</strong><span>Countries</span></div>
          <div><strong>99.9%</strong><span>Uptime</span></div>
          <Image src="/images/11-stats_room_thumbnail.png" alt="Small 3D room thumbnail" width={112} height={54} />
        </div>
      </AnimatedSection>

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

      <AnimatedSection className="cal-section section-page" aria-label="Book a Homeview consultation">
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

function PriceCard(props: {
  title: string;
  copy: string;
  price: string;
  image: string;
  alt: string;
  featured?: boolean;
  team?: boolean;
}) {
  return (
    <article className={`price-card ${props.featured ? "is-featured" : ""} ${props.team ? "team-card" : ""}`}>
      <div>
        {props.featured ? <span className="popular">Most popular</span> : null}
        <h2>{props.title}</h2>
        <p>{props.copy}</p>
      </div>
      <Image src={props.image} alt={props.alt} width={180} height={160} />
      <div className="price-bottom">
        <p><strong>{props.price}</strong> / month</p>
        <Link className={`button ${props.featured ? "button-olive" : "button-outline"}`} href="/contact">
          Get quote <span aria-hidden="true">↗</span>
        </Link>
      </div>
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
