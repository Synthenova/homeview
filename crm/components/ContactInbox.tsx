"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type {
  CrmContactDetail,
  CrmContactSummary,
  CrmStatusDefinition,
  CrmTag
} from "@/lib/crm-data";
import { StatusPill, statusColorFromOptions } from "./StatusPill";

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

function ContactDetailSkeleton() {
  return (
    <div className="crm-contact-detail-scroll crm-contact-detail-skeleton" aria-hidden="true">
      <div className="crm-contact-detail-head">
        <div className="crm-contact-skeleton-head-copy">
          <span className="crm-skeleton-line label" />
          <span className="crm-skeleton-title medium" />
          <span className="crm-skeleton-line medium" />
        </div>
        <span className="crm-skeleton-line pill" />
      </div>

      <span className="crm-skeleton-line medium" />
      <span className="crm-skeleton-line long" />
      <div className="crm-contact-copy-block crm-inline-skeleton">
        <span className="crm-skeleton-line label" />
        <span className="crm-skeleton-line long" />
      </div>
      <div className="crm-detail-row crm-inline-skeleton">
        <span className="crm-skeleton-line label" />
        <span className="crm-skeleton-line long" />
      </div>
      <div className="crm-detail-row crm-inline-skeleton">
        <span className="crm-skeleton-line label" />
        <span className="crm-skeleton-line long" />
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
  const [tagNewName, setTagNewName] = useState("");
  const [showStatusCreate, setShowStatusCreate] = useState(false);
  const [showTagCreate, setShowTagCreate] = useState(false);
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

  async function changeStatus(nextStatus: string) {
    if (!selected || !nextStatus || nextStatus === selected.status) return;
    setStatusDraft(nextStatus);
    setSaving("status");
    try {
      const response = await fetch(`/api/contacts/${encodeURIComponent(selected.emailNormalized)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error("Failed to update status.");
      await refreshSelected(selected.emailNormalized);
    } finally {
      setSaving(null);
    }
  }

  async function createStatus() {
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
      setShowStatusCreate(false);
    } finally {
      setSaving(null);
    }
  }

  async function attachTag(tagName: string) {
    if (!selected) return;
    const response = await fetch(`/api/contacts/${encodeURIComponent(selected.emailNormalized)}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag: tagName.trim() })
    });
    const data = (await response.json()) as { tag?: CrmTag };
    if (!response.ok || !data.tag) throw new Error("Failed to add tag.");
    if (!tagOptions.some((tag) => tag.id === data.tag!.id)) {
      setTagOptions((current) => [...current, data.tag!].sort((a, b) => a.name.localeCompare(b.name)));
    }
    await refreshSelected(selected.emailNormalized);
  }

  async function addTagByName(tagName: string) {
    if (!tagName.trim()) return;
    setSaving("tag");
    try {
      await attachTag(tagName);
    } finally {
      setSaving(null);
    }
  }

  async function createTag() {
    const tagName = tagNewName.trim();
    if (!tagName) return;
    setSaving("create-tag");
    try {
      await attachTag(tagName);
      setTagNewName("");
      setShowTagCreate(false);
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

  const primaryRequest = selected?.requests[0] ?? null;
  const primaryChat = selected?.chats[0] ?? null;
  const contactMetaLine = selected
    ? formatDate(selected.lastSeenAt || selected.latestContactAt)
    : "";

  const availableTagsForAdd = useMemo(() => {
    if (!selected) return [];
    const attachedIds = new Set(selected.tags.map((tag) => tag.id));
    return tagOptions.filter((tag) => !attachedIds.has(tag.id));
  }, [selected, tagOptions]);

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
              <StatusPill
                className="crm-contact-row-status"
                label={contact.statusLabel}
                statusName={contact.status}
                color={statusColorFromOptions(statusOptions, contact.status)}
              />
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
              <div className="crm-contact-detail-identity">
                <h3>{selected.displayName || selected.email}</h3>
                <p className="crm-contact-meta">{contactMetaLine}</p>
                <span>{selected.email}</span>
              </div>
              {primaryChat ? (
                <Link className="crm-btn-primary" href={`/chats/${primaryChat.id}`}>
                  Open chat
                </Link>
              ) : null}
            </div>

            <p className="crm-contact-project-type">
              <span className="crm-copy-label">Project type</span>{" "}
              {selected.latestProjectType || "Not set"}
            </p>

            <div className="crm-contact-copy">
              <p>
                <span className="crm-copy-label">Contact message</span>{" "}
                {primaryRequest?.message || selected.latestInquiry || "No submitted message."}
              </p>
              <p>
                <span className="crm-copy-label">Latest chat</span>{" "}
                {primaryChat?.lastMessagePreview || selected.latestChatPreview || "No chat message yet."}
              </p>
            </div>

            <div className="crm-detail-row">
              <div className="crm-detail-row-label">Current status:</div>
              <div className="crm-detail-row-body">
                <select
                  id="contact-status-select"
                  className="crm-detail-select"
                  value={statusDraft}
                  disabled={saving === "status"}
                  onChange={(event) => void changeStatus(event.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status.name} value={status.name}>
                      {status.label}
                    </option>
                  ))}
                </select>
                {showStatusCreate ? (
                  <>
                    <input
                      className="crm-control-inline-input"
                      value={newStatusName}
                      onChange={(event) => setNewStatusName(event.target.value)}
                      placeholder="status_name"
                    />
                    <button
                      className="crm-btn-secondary"
                      type="button"
                      disabled={saving === "create-status" || !newStatusName.trim()}
                      onClick={() => void createStatus()}
                    >
                      {saving === "create-status" ? "…" : "Save"}
                    </button>
                    <button
                      className="crm-link-btn"
                      type="button"
                      onClick={() => {
                        setShowStatusCreate(false);
                        setNewStatusName("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="crm-link-btn" type="button" onClick={() => setShowStatusCreate(true)}>
                    + status
                  </button>
                )}
                {saving === "status" ? <span className="crm-saving-hint">Saving…</span> : null}
              </div>
            </div>

            <div className="crm-detail-row">
              <div className="crm-detail-row-label">Current tags:</div>
              <div className="crm-detail-row-body">
                {selected.tags.length === 0 ? <span className="crm-empty-inline">None</span> : null}
                {selected.tags.map((tag) => (
                  <span className="crm-tag-chip" key={tag.id}>
                    <span className="crm-tag-chip-label">{tag.name}</span>
                    <button
                      type="button"
                      className="crm-tag-chip-remove"
                      aria-label={`Remove ${tag.name}`}
                      disabled={saving === `remove-${tag.name}`}
                      onClick={() => void removeTag(tag.name)}
                    >
                      {saving === `remove-${tag.name}` ? "…" : "×"}
                    </button>
                  </span>
                ))}
                {availableTagsForAdd.length > 0 ? (
                  <select
                    className="crm-detail-select crm-tag-add-select"
                    value=""
                    disabled={saving === "tag"}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value) void addTagByName(value);
                    }}
                  >
                    <option value="">Add tag…</option>
                    {availableTagsForAdd.map((tag) => (
                      <option key={tag.id} value={tag.name}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                {showTagCreate ? (
                  <>
                    <input
                      className="crm-control-inline-input"
                      value={tagNewName}
                      onChange={(event) => setTagNewName(event.target.value)}
                      placeholder="tag_name"
                    />
                    <button
                      className="crm-btn-secondary"
                      type="button"
                      disabled={saving === "create-tag" || !tagNewName.trim()}
                      onClick={() => void createTag()}
                    >
                      {saving === "create-tag" ? "…" : "Save"}
                    </button>
                    <button
                      className="crm-link-btn"
                      type="button"
                      onClick={() => {
                        setShowTagCreate(false);
                        setTagNewName("");
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="crm-link-btn" type="button" onClick={() => setShowTagCreate(true)}>
                    + tag
                  </button>
                )}
                {saving === "tag" ? <span className="crm-saving-hint">Adding…</span> : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
