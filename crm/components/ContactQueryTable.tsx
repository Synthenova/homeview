"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ContactQuery = {
  id: string;
  session_id: string | null;
  name: string | null;
  email: string;
  project_type: string | null;
  message: string;
  status: string;
  created_at: string;
  email_request_count: number;
  email_request_rank: number;
};

type ContactGroup = {
  email: string;
  firstContact: ContactQuery;
  latestContact: ContactQuery;
  requests: ContactQuery[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function buildContactGroups(contacts: ContactQuery[]) {
  const grouped = new Map<string, ContactQuery[]>();

  for (const contact of contacts) {
    const key = contact.email.toLowerCase();
    grouped.set(key, [...(grouped.get(key) ?? []), contact]);
  }

  return Array.from(grouped.entries())
    .map(([email, requests]) => {
      const chronological = [...requests].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      const reverseChronological = [...chronological].reverse();

      return {
        email,
        firstContact: chronological[0],
        latestContact: reverseChronological[0],
        requests: reverseChronological
      };
    })
    .sort((a, b) => new Date(b.latestContact.created_at).getTime() - new Date(a.latestContact.created_at).getTime());
}

export function ContactQueryTable({ contacts }: { contacts: ContactQuery[] }) {
  const [selected, setSelected] = useState<ContactGroup | null>(null);
  const [mounted, setMounted] = useState(false);
  const contactGroups = buildContactGroups(contacts);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div className="crm-table contact-table">
        {contactGroups.length === 0 ? (
          <div className="crm-empty">No contact queries yet.</div>
        ) : null}
        {contactGroups.map((group) => (
          <button className="crm-row contact-row" key={group.email} onClick={() => setSelected(group)} type="button">
            <span>
              <strong>{group.firstContact.email}</strong>
              {group.requests.length > 1 ? (
                <em>{group.requests.length} requests</em>
              ) : null}
            </span>
            <span>{formatDate(group.firstContact.created_at)}</span>
            <span>{group.firstContact.project_type || "No type"}</span>
            <span>{group.firstContact.message}</span>
            <span>{group.firstContact.status}</span>
          </button>
        ))}
      </div>

      {selected && mounted
        ? createPortal(
        <div className="crm-modal-backdrop" role="presentation" onClick={() => setSelected(null)}>
          <section
            aria-modal="true"
            className="crm-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <div>
                <p className="eyebrow">Contact query</p>
                <h3>{selected.firstContact.email}</h3>
              </div>
              <button aria-label="Close contact query" onClick={() => setSelected(null)} type="button">
                Close
              </button>
            </header>
            <dl className="contact-detail-grid">
              <div>
                <dt>First contacted</dt>
                <dd>{formatDate(selected.firstContact.created_at)}</dd>
              </div>
              <div>
                <dt>Latest request</dt>
                <dd>{formatDate(selected.latestContact.created_at)}</dd>
              </div>
              <div>
                <dt>First name</dt>
                <dd>{selected.firstContact.name || "Not provided"}</dd>
              </div>
              <div>
                <dt>First project type</dt>
                <dd>{selected.firstContact.project_type || "Not provided"}</dd>
              </div>
              {selected.requests.length > 1 ? (
                <div>
                  <dt>Email history</dt>
                  <dd>{selected.requests.length} requests from this email</dd>
                </div>
              ) : null}
            </dl>
            <div className="contact-request-list">
              {selected.requests.map((request, index) => (
                <article className="contact-message" key={request.id}>
                  <header>
                    <div>
                      <p className="eyebrow">
                        {selected.requests.length > 1 ? `Request ${selected.requests.length - index}` : "Message"}
                      </p>
                      <h4>{formatDate(request.created_at)}</h4>
                    </div>
                    <span>{request.status}</span>
                  </header>
                  <dl className="contact-request-meta">
                    <div>
                      <dt>Name</dt>
                      <dd>{request.name || "Not provided"}</dd>
                    </div>
                    <div>
                      <dt>Project type</dt>
                      <dd>{request.project_type || "Not provided"}</dd>
                    </div>
                  </dl>
                  <p>{request.message}</p>
                </article>
              ))}
            </div>
          </section>
        </div>,
        document.body
        )
        : null}
    </>
  );
}
