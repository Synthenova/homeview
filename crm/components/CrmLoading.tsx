import { CrmShell } from "./CrmShell";

function SkeletonLine({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`crm-skeleton-line ${className}`} />;
}

function SkeletonTopbar({ eyebrow, titleWidth = "wide" }: { eyebrow: string; titleWidth?: "medium" | "wide" }) {
  return (
    <header className="crm-topbar">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <div className={`crm-skeleton-title ${titleWidth}`} />
      </div>
    </header>
  );
}

function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="crm-table" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="crm-row crm-skeleton-row" key={rowIndex}>
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <SkeletonLine className={columnIndex === 0 ? "long" : columnIndex === columns - 1 ? "short" : ""} key={columnIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}

function SkeletonPanelHeader({ titleWidth = "medium" }: { titleWidth?: "short" | "medium" }) {
  return (
    <div className="panel-head" aria-hidden="true">
      <div>
        <SkeletonLine className="label" />
        <SkeletonLine className={titleWidth} />
      </div>
      <SkeletonLine className="pill" />
    </div>
  );
}

export function DashboardLoading() {
  return (
    <CrmShell>
      <SkeletonTopbar eyebrow="Dashboard" />
      <div className="crm-stats" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <article className="crm-stat crm-skeleton-stat" key={index}>
            <span className="crm-skeleton-icon" />
            <SkeletonLine className="medium" />
            <SkeletonLine className="value" />
          </article>
        ))}
      </div>
      <section className="crm-panel">
        <SkeletonPanelHeader />
        <SkeletonTable rows={7} columns={3} />
      </section>
    </CrmShell>
  );
}

export function SessionsLoading() {
  return (
    <CrmShell>
      <SkeletonTopbar eyebrow="Sessions" />
      <section className="crm-panel">
        <SkeletonTable rows={8} columns={4} />
      </section>
    </CrmShell>
  );
}

export function ContactsLoading() {
  return (
    <CrmShell>
      <SkeletonTopbar eyebrow="Contacts" />
      <section className="crm-panel">
        <div className="crm-table contact-table" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <div className="crm-row contact-row crm-skeleton-row" key={rowIndex}>
              <SkeletonLine className="long" />
              <SkeletonLine />
              <SkeletonLine className="medium" />
              <SkeletonLine className="long" />
              <SkeletonLine className="short" />
            </div>
          ))}
        </div>
      </section>
    </CrmShell>
  );
}

export function ChatsLoading() {
  return (
    <CrmShell>
      <SkeletonTopbar eyebrow="Chats" />
      <section className="crm-panel">
        <SkeletonTable rows={8} columns={4} />
      </section>
    </CrmShell>
  );
}

export function SessionDetailLoading() {
  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Session</p>
          <div className="crm-skeleton-title medium" />
        </div>
        <SkeletonLine className="pill" />
      </header>
      <div className="crm-grid">
        <section className="crm-panel">
          <SkeletonPanelHeader titleWidth="short" />
          <SkeletonTable rows={5} columns={3} />
        </section>
        <section className="crm-panel">
          <SkeletonPanelHeader titleWidth="short" />
          <div className="crm-table contact-table" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, rowIndex) => (
              <div className="crm-row contact-row crm-skeleton-row" key={rowIndex}>
                <SkeletonLine className="long" />
                <SkeletonLine />
                <SkeletonLine className="medium" />
                <SkeletonLine className="long" />
                <SkeletonLine className="short" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </CrmShell>
  );
}

export function ChatDetailLoading() {
  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Conversation</p>
          <div className="crm-skeleton-title medium" />
        </div>
        <SkeletonLine className="pill" />
      </header>
      <div className="crm-grid">
        <section className="crm-panel">
          <SkeletonPanelHeader titleWidth="short" />
          <div className="crm-transcript crm-transcript-loading" aria-hidden="true">
            <article className="crm-message user crm-message-skeleton short">
              <SkeletonLine />
              <SkeletonLine className="long" />
            </article>
            <article className="crm-message assistant crm-message-skeleton">
              <SkeletonLine className="label" />
              <SkeletonLine className="long" />
              <SkeletonLine />
              <SkeletonLine className="medium" />
            </article>
            <article className="crm-message user crm-message-skeleton">
              <SkeletonLine className="label" />
              <SkeletonLine />
              <SkeletonLine className="medium" />
            </article>
            <article className="crm-message assistant crm-message-skeleton long">
              <SkeletonLine className="label" />
              <SkeletonLine className="long" />
              <SkeletonLine className="long" />
              <SkeletonLine />
            </article>
          </div>
        </section>
        <section className="crm-panel">
          <SkeletonPanelHeader titleWidth="short" />
          <SkeletonTable rows={4} columns={3} />
        </section>
      </div>
    </CrmShell>
  );
}
