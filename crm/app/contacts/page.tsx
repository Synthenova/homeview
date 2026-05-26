import { CrmShell } from "@/components/CrmShell";
import { ContactQueryTable, type ContactQuery } from "@/components/ContactQueryTable";
import { getContacts } from "@/lib/crm-data";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await getContacts();
  const serializedContacts = contacts.map((contact) => ({
    ...contact,
    created_at: contact.created_at.toISOString()
  })) as ContactQuery[];

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Contacts</p>
          <h2>Contact form queries</h2>
        </div>
      </header>
      <section className="crm-panel">
        <ContactQueryTable contacts={serializedContacts} />
      </section>
    </CrmShell>
  );
}
