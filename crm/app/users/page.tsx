import { UserCreateForm } from "./UserCreateForm";
import { disableCrmUser } from "./actions";
import { canDeleteUsers, getCrmUsers, requireUserManager } from "@/lib/auth";
import { CrmShell } from "@/components/CrmShell";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "Active";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export default async function UsersPage() {
  const [actor, users] = await Promise.all([requireUserManager(), getCrmUsers()]);
  const canDisable = canDeleteUsers(actor.role);

  return (
    <CrmShell>
      <header className="crm-topbar">
        <div>
          <p className="eyebrow">Access</p>
          <h2>CRM users</h2>
        </div>
        <span className="crm-pill">{actor.role.replace("_", " ")}</span>
      </header>
      <div className="crm-grid">
        <section className="crm-panel">
          <div className="panel-head">
            <h3>Create login</h3>
          </div>
          <UserCreateForm />
        </section>
        <section className="crm-panel">
          <div className="panel-head">
            <h3>Current access</h3>
          </div>
          <div className="crm-table users-table">
            <div className="crm-row user-row super-admin-row">
              <span>
                <strong>{process.env.CRM_SUPER_ADMIN_EMAIL || "Missing CRM_SUPER_ADMIN_EMAIL"}</strong>
                <em>env managed</em>
              </span>
              <span>super admin</span>
              <span>Cannot be deleted</span>
              <span>Active</span>
            </div>
            {users.map((user) => (
              <div className="crm-row user-row" key={user.id}>
                <span>{user.email}</span>
                <span>{user.role}</span>
                <span>{user.disabled_at ? "Disabled" : formatDate(user.created_at)}</span>
                <span>
                  {canDisable && !user.disabled_at ? (
                    <form action={disableCrmUser}>
                      <input name="userId" type="hidden" value={user.id} />
                      <button className="text-button" type="submit">
                        Delete
                      </button>
                    </form>
                  ) : (
                    formatDate(user.disabled_at)
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </CrmShell>
  );
}
