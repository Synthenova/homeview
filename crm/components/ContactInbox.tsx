"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type {
  CrmContactDetail,
  CrmContactSummary,
  CrmStatusDefinition,
  CrmTag
} from "@/lib/crm-data";

const PAGE_SIZE = 50;

type ContactInboxProps = {
  contacts: CrmContactSummary[];
  statuses: CrmStatusDefinition[];
  tags: CrmTag[];
  projectTypes: string[];
  initialPage: number;
  initialSelectedEmail: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "No activity";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

function summarizeTags(tags: CrmTag[]) {
  if (tags.length === 0) return "No tags";
  return tags.map((tag) => tag.name).join(", ");
}

function ContactDetailSkeleton() {
  return (
    <div className="crm-contact-detail-scroll crm-contact-detail-skeleton" aria-hidden="true">
      <div className="crm-contact-detail-head">
        <div className="crm-contact-skeleton-head-copy">
          <span className="crm-skeleton-line label" />
          <span className="crm-skeleton-title medium" />
          <span className="crm-skeleton-line medium" />
        </div>
        <div className="crm-contact-detail-head-actions">
          <span className="crm-skeleton-line pill" />
          <span className="crm-skeleton-line pill" />
        </div>
      </div>

      <div className="crm-contact-summary">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <span className="crm-skeleton-line label" />
            <span className="crm-skeleton-line value" />
          </div>
        ))}
      </div>

      <div className="crm-contact-actions">
        {Array.from({ length: 2 }).map((_, index) => (
          <div className="crm-inline-form crm-inline-skeleton" key={index}>
            <div className="crm-contact-skeleton-field">
              <span className="crm-skeleton-line label" />
              <span className="crm-skeleton-line long" />
            </div>
            <span className="crm-skeleton-line pill" />
          </div>
        ))}
      </div>

      <div className="crm-contact-tags">
        <div className="crm-tag-list">
          <span className="crm-skeleton-line pill" />
          <span className="crm-skeleton-line pill" />
        </div>
        <div className="crm-contact-tag-actions">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="crm-inline-form crm-inline-skeleton" key={index}>
              <div className="crm-contact-skeleton-field">
                <span className="crm-skeleton-line label" />
                <span className="crm-skeleton-line long" />
              </div>
              <span className="crm-skeleton-line pill" />
            </div>
          ))}
        </div>
      </div>

      <div className="crm-contact-notes">
        {Array.from({ length: 2 }).map((_, index) => (
          <section key={index}>
            <span className="crm-skeleton-line label" />
            <span className="crm-skeleton-line long" />
            <span className="crm-skeleton-line medium" />
            <span className="crm-skeleton-line long" />
          </section>
        ))}
      </div>
    </div>
  );
}

export function ContactInbox({
  contacts,
  statuses,
  tags,
  projectTypes,
  initialPage,
  initialSelectedEmail
}: ContactInboxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState(contacts);
  const [statusOptions, setStatusOptions] = useState(statuses);
  const [tagOptions, setTagOptions] = useState(tags);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(initialSelectedEmail ?? contacts[0]?.emailNormalized ?? null);
  const [selected, setSelected] = useState<CrmContactDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [projectTypeFilter, setProjectTypeFilter] = useState("");
  const [sort, setSort] = useState("latest_activity");
  const [statusDraft, setStatusDraft] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [requestedPage, setRequestedPage] = useState(Math.max(initialPage, 1));
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setItems(contacts);
  }, [contacts]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...items]
      .filter((contact) => {
        if (normalizedSearch) {
          const haystack = [
            contact.email,
            contact.displayName,
            contact.latestInquiry,
            contact.latestChatPreview,
            ...contact.tags.map((tag) => tag.name)
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!haystack.includes(normalizedSearch)) return false;
        }

        if (statusFilter && contact.status !== statusFilter) return false;
        if (tagFilter && !contact.tags.some((tag) => tag.name.toLowerCase() === tagFilter.toLowerCase())) return false;
        if (
          projectTypeFilter &&
          !contact.projectTypes.some((projectType) => projectType.toLowerCase() === projectTypeFilter.toLowerCase())
        ) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        switch (sort) {
          case "email":
            return left.email.localeCompare(right.email);
          case "first_contact":
            return new Date(left.firstContactAt ?? 0).getTime() - new Date(right.firstContactAt ?? 0).getTime();
          case "highest_spend":
            return right.aiSpend - left.aiSpend;
          case "latest_activity":
          default:
            return (
              new Date(right.lastSeenAt ?? right.latestContactAt ?? right.firstContactAt ?? 0).getTime() -
              new Date(left.lastSeenAt ?? left.latestContactAt ?? left.firstContactAt ?? 0).getTime()
            );
        }
      });
  }, [items, projectTypeFilter, search, sort, statusFilter, tagFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const selectedIndex = selectedEmail ? filtered.findIndex((contact) => contact.emailNormalized === selectedEmail) : -1;
  const currentPage = selectedIndex >= 0 ? Math.floor(selectedIndex / PAGE_SIZE) + 1 : clampPage(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedEmail(null);
      setSelected(null);
      return;
    }

    if (selectedEmail && filtered.some((contact) => contact.emailNormalized === selectedEmail)) {
      return;
    }

    const fallbackPage = clampPage(requestedPage, totalPages);
    const fallback = filtered[(fallbackPage - 1) * PAGE_SIZE] ?? filtered[0];
    if (fallback) {
      setSelectedEmail(fallback.emailNormalized);
    }
  }, [filtered, requestedPage, selectedEmail, totalPages]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedEmail) params.set("contact", selectedEmail);
    if (currentPage > 1) params.set("page", String(currentPage));
    const nextUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [currentPage, pathname, router, selectedEmail]);

  useEffect(() => {
    if (!selectedEmail) {
      setSelected(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);

    void (async () => {
      const response = await fetch(`/api/contacts/${encodeURIComponent(selectedEmail)}`);
      const data = (await response.json()) as { contact?: CrmContactDetail };
      if (cancelled) return;
      setSelected(data.contact ?? null);
      setStatusDraft(data.contact?.status ?? "");
      setLoadingDetail(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedEmail]);

  async function refreshSelected(emailNormalized: string) {
    const response = await fetch(`/api/contacts/${encodeURIComponent(emailNormalized)}`);
    const data = (await response.json()) as { contact?: CrmContactDetail };
    setSelected(data.contact ?? null);
    setStatusDraft(data.contact?.status ?? "");

    if (data.contact) {
      setItems((current) =>
        current.map((contact) =>
          contact.emailNormalized === data.contact!.emailNormalized ? data.contact! : contact
        )
      );
    }
  }

  function selectContact(emailNormalized: string) {
    setSelectedEmail(emailNormalized);
  }

  function goToPage(nextPage: number) {
    const safePage = clampPage(nextPage, totalPages);
    setRequestedPage(safePage);
    const nextItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    if (nextItems[0]) {
      setSelectedEmail(nextItems[0].emailNormalized);
    }
  }

  async function submitStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !statusDraft) return;
    setSaving("status");
    try {
      const response = await fetch(`/api/contacts/${encodeURIComponent(selected.emailNormalized)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusDraft })
      });
      if (!response.ok) throw new Error("Failed to update status.");
      await refreshSelected(selected.emailNormalized);
    } finally {
      setSaving(null);
    }
  }

  async function createStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newStatusName.trim()) return;
    setSaving("create-status");
    try {
      const response = await fetch("/api/contact-statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newStatusName })
      });
      const data = (await response.json()) as { status?: CrmStatusDefinition };
      if (!response.ok || !data.status) throw new Error("Failed to create status.");
      setStatusOptions((current) => [...current, data.status!].sort((a, b) => a.sortOrder - b.sortOrder));
      setStatusDraft(data.status.name);
      setNewStatusName("");
    } finally {
      setSaving(null);
    }
  }

  async function addTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !tagDraft.trim()) return;
    setSaving("tag");
    try {
      const response = await fetch(`/api/contacts/${encodeURIComponent(selected.emailNormalized)}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: tagDraft })
      });
      const data = (await response.json()) as { tag?: CrmTag };
      if (!response.ok || !data.tag) throw new Error("Failed to add tag.");
      if (!tagOptions.some((tag) => tag.id === data.tag!.id)) {
        setTagOptions((current) => [...current, data.tag!].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setTagDraft("");
      await refreshSelected(selected.emailNormalized);
    } finally {
      setSaving(null);
    }
  }

  async function removeTag(tagName: string) {
    if (!selected) return;
    setSaving(`remove-${tagName}`);
    try {
      const response = await fetch(`/api/contacts/${encodeURIComponent(selected.emailNormalized)}/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: tagName })
      });
      if (!response.ok) throw new Error("Failed to remove tag.");
      await refreshSelected(selected.emailNormalized);
    } finally {
      setSaving(null);
    }
  }

  async function createTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTagName.trim()) return;
    setSaving("create-tag");
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName })
      });
      const data = (await response.json()) as { tag?: CrmTag };
      if (!response.ok || !data.tag) throw new Error("Failed to create tag.");
      setTagOptions((current) => [...current, data.tag!].sort((a, b) => a.name.localeCompare(b.name)));
      setTagDraft(data.tag.name);
      setNewTagName("");
    } finally {
      setSaving(null);
    }
  }

  const primaryRequest = selected?.requests[0] ?? null;
  const primaryChat = selected?.chats[0] ?? null;

  return (
    <div className="crm-contact-inbox">
      <section className="crm-panel crm-contact-list-panel">
        <div className="crm-contact-toolbar">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contacts" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status.name} value={status.name}>
                {status.label}
              </option>
            ))}
          </select>
          <select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
            <option value="">All tags</option>
            {tagOptions.map((tag) => (
              <option key={tag.id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
          <select value={projectTypeFilter} onChange={(event) => setProjectTypeFilter(event.target.value)}>
            <option value="">All project types</option>
            {projectTypes.map((projectType) => (
              <option key={projectType} value={projectType}>
                {projectType}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="latest_activity">Latest activity</option>
            <option value="first_contact">First contact</option>
            <option value="highest_spend">Highest spend</option>
            <option value="email">Email</option>
          </select>
        </div>

        <div className="crm-contact-list-head">
          <span>{filtered.length} contacts</span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        <div className="crm-contact-list">
          {pageItems.length === 0 ? <div className="crm-empty">No contacts match the current filters.</div> : null}
          {pageItems.map((contact) => (
            <button
              className={`crm-contact-list-item${selectedEmail === contact.emailNormalized ? " is-active" : ""}`}
              key={contact.emailNormalized}
              onClick={() => selectContact(contact.emailNormalized)}
              type="button"
            >
              <div className="crm-contact-row-main">
                <strong>{contact.displayName || contact.email}</strong>
                <span>{contact.email}</span>
              </div>
              <span className="crm-contact-row-status">{contact.statusLabel}</span>
              <span className="crm-contact-row-tags">{summarizeTags(contact.tags)}</span>
              <span className="crm-contact-row-time">{formatDate(contact.lastSeenAt || contact.latestContactAt)}</span>
            </button>
          ))}
        </div>

        <div className="crm-pagination">
          <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
            Previous
          </button>
          <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
            Next
          </button>
        </div>
      </section>

      <section className="crm-panel crm-contact-detail-panel">
        {!selected && !loadingDetail ? <div className="crm-empty">Select a contact to inspect.</div> : null}
        {loadingDetail ? (
          <ContactDetailSkeleton />
        ) : selected ? (
          <div className="crm-contact-detail-scroll">
            <div className="crm-contact-detail-head">
              <div>
                <p className="eyebrow">Contact</p>
                <h3>{selected.displayName || selected.email}</h3>
                <span>{selected.email}</span>
              </div>
              <div className="crm-contact-detail-head-actions">
                {primaryChat ? (
                  <Link className="crm-pill crm-pill-link" href={`/chats/${primaryChat.id}`}>
                    Open chat
                  </Link>
                ) : null}
                <span className="crm-pill">{selected.statusLabel}</span>
              </div>
            </div>

            <div className="crm-contact-summary">
              <div>
                <span>Latest activity</span>
                <strong>{formatDate(selected.lastSeenAt || selected.latestContactAt)}</strong>
              </div>
              <div>
                <span>Project type</span>
                <strong>{selected.latestProjectType || "Not set"}</strong>
              </div>
              <div>
                <span>Messages</span>
                <strong>{selected.messageCount}</strong>
              </div>
              <div>
                <span>AI spend</span>
                <strong>${selected.aiSpend.toFixed(4)}</strong>
              </div>
            </div>

            <div className="crm-contact-actions">
              <form className="crm-inline-form" onSubmit={submitStatus}>
                <label>
                  <span>Status</span>
                  <select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}>
                    {statusOptions.map((status) => (
                      <option key={status.name} value={status.name}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" disabled={saving === "status"}>
                  {saving === "status" ? "Saving..." : "Update"}
                </button>
              </form>

              <form className="crm-inline-form" onSubmit={createStatus}>
                <label>
                  <span>New status</span>
                  <input
                    value={newStatusName}
                    onChange={(event) => setNewStatusName(event.target.value)}
                    placeholder="vip_followup"
                  />
                </label>
                <button type="submit" disabled={saving === "create-status"}>
                  {saving === "create-status" ? "Creating..." : "Create"}
                </button>
              </form>
            </div>

            <div className="crm-contact-tags">
              <div className="crm-tag-list">
                {selected.tags.map((tag) => (
                  <button key={tag.id} type="button" className="crm-tag-chip" onClick={() => void removeTag(tag.name)}>
                    {tag.name}
                    <span>{saving === `remove-${tag.name}` ? "..." : "×"}</span>
                  </button>
                ))}
                {selected.tags.length === 0 ? <span className="crm-empty-inline">No tags yet.</span> : null}
              </div>
              <div className="crm-contact-tag-actions">
                <form className="crm-inline-form" onSubmit={addTag}>
                  <label>
                    <span>Add existing tag</span>
                    <select value={tagDraft} onChange={(event) => setTagDraft(event.target.value)}>
                      <option value="">Select tag</option>
                      {tagOptions.map((tag) => (
                        <option key={tag.id} value={tag.name}>
                          {tag.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" disabled={saving === "tag" || !tagDraft}>
                    {saving === "tag" ? "Adding..." : "Add"}
                  </button>
                </form>

                <form className="crm-inline-form" onSubmit={createTag}>
                  <label>
                    <span>New tag</span>
                    <input
                      value={newTagName}
                      onChange={(event) => setNewTagName(event.target.value)}
                      placeholder="decision-maker"
                    />
                  </label>
                  <button type="submit" disabled={saving === "create-tag"}>
                    {saving === "create-tag" ? "Creating..." : "Create"}
                  </button>
                </form>
              </div>
            </div>

            <div className="crm-contact-notes">
              <section>
                <p className="eyebrow">Contact message</p>
                <p>{primaryRequest?.message || selected.latestInquiry || "No submitted message."}</p>
              </section>
              <section>
                <p className="eyebrow">Latest chat message</p>
                <p>{primaryChat?.lastMessagePreview || selected.latestChatPreview || "No chat message yet."}</p>
              </section>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
