import { CrmShell } from "@/components/CrmShell";
import { ContactInbox } from "@/components/ContactInbox";
import { getContacts, getCrmFilters } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams
}: {
  searchParams?: Promise<{ contact?: string; page?: string }>;
}) {
  const [contacts, filters] = await Promise.all([getContacts(), getCrmFilters()]);
  const resolvedSearchParams = (await searchParams) ?? {};

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Contacts</p>
          <h2>CRM inbox</h2>
        </div>
      </header>
      <ContactInbox
        contacts={contacts}
        statuses={filters.statuses}
        tags={filters.tags}
        projectTypes={filters.projectTypes}
        initialPage={Number(resolvedSearchParams.page ?? "1") || 1}
        initialSelectedEmail={resolvedSearchParams.contact ?? null}
      />
    </CrmShell>
  );
}
