import { Mail, Phone } from "lucide-react";

type Lead = {
  name: string;
  role: string;
  email: string;
  phone: string;
};

export function LeadCard({ lead }: { lead: Lead }) {
  return (
    <div className="w-56 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-float backdrop-blur-md">
      <div className="flex flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-full bg-secondary text-sm font-semibold text-ink ring-2 ring-brand-cyan/60">
          {lead.name
            .split(" ")
            .map((p) => p[0])
            .join("")}
        </span>
        <p className="mt-2 text-sm font-semibold text-ink">{lead.name}</p>
        <p className="text-xs text-muted-foreground">{lead.role}</p>
      </div>
      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Mail size={13} className="text-brand-blue" /> {lead.email}
        </p>
        <p className="flex items-center gap-2">
          <Phone size={13} className="text-brand-blue" /> {lead.phone}
        </p>
        <span className="block h-2 w-4/5 rounded-full bg-secondary" />
        <span className="block h-2 w-3/5 rounded-full bg-secondary" />
      </div>
    </div>
  );
}

const rows = [
  { name: "Jenny Wilson", role: "Technology Manager", dept: "Operations", email: "jennywil@mail.com", phone: "(713) 283-1981" },
  { name: "Bill Sanders", role: "IT Support", dept: "Support", email: "billsans@mail.com", phone: "(704) 555-0127" },
  { name: "Marcus Lee", role: "Head of Growth", dept: "Marketing", email: "marcuslee@mail.com", phone: "(219) 555-0114" },
  { name: "Ana Ruiz", role: "Sales Director", dept: "Revenue", email: "anaruiz@mail.com", phone: "(505) 555-0198" },
];

export function LeadTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/85 shadow-float backdrop-blur-md">
      <div className="grid grid-cols-[1.4fr_1fr_1.2fr] gap-3 border-b border-border/70 bg-secondary/70 px-5 py-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <span>Name</span>
        <span>Department</span>
        <span>Contact</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.name}
          className="grid grid-cols-[1.4fr_1fr_1.2fr] items-center gap-3 border-b border-border/50 px-5 py-3 last:border-0"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-ink">
              {r.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            <span>
              <span className="block text-sm font-medium text-ink">{r.name}</span>
              <span className="block text-xs text-muted-foreground">{r.role}</span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{r.dept}</span>
          <span>
            <span className="block text-xs text-ink">{r.email}</span>
            <span className="block text-xs text-muted-foreground">{r.phone}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export const heroLeads: Lead[] = [
  { name: "James Reed", role: "Head of Finance, Dropbox", email: "jamesrc@mail.com", phone: "(997) 976-2399" },
  { name: "Lauren Chaney", role: "IT Operations, Ublur", email: "lauren.c@ublur.com", phone: "(713) 283-1981" },
];
