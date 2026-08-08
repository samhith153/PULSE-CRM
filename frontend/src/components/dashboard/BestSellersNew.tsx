import { MoreVertical, MoveUpRight } from 'lucide-react';

const sellers = [
  { name: 'Pisang Kepok', price: '$24', delta: '+4.2%', total: '$2,423.00', initials: 'PK' },
  { name: 'Anggur Merah', price: '$18', delta: '+2.8%', total: '$1,982.00', initials: 'AM' },
  { name: 'Mangga Harum', price: '$32', delta: '+6.4%', total: '$1,540.00', initials: 'MH' },
];

export function BestSellersNew() {
  return (
    <section className="card-surface p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-[19px] font-bold tracking-tight">Best Sellers</h2>
        <button
          aria-label="More options"
          className="ml-auto grid size-9 place-items-center rounded-full"
        >
          <MoreVertical className="size-4 text-muted-foreground" />
        </button>
      </div>

      <table className="mt-5 w-full border-collapse text-left">
        <thead>
          <tr className="bg-muted text-xs text-muted-foreground">
            <th className="rounded-l-xl px-4 py-3 font-medium">Seller</th>
            <th className="px-4 py-3 text-center font-medium">Stats</th>
            <th className="rounded-r-xl px-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {sellers.map((s) => (
            <tr key={s.name} className="border-b border-border last:border-0">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-brand-pale text-xs font-bold text-brand-deep">
                    {s.initials}
                  </span>
                  <div className="leading-tight">
                    <p className="text-[15px] font-bold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.price}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-1 text-[11px] font-semibold text-mint-foreground">
                  <MoveUpRight className="size-3" />
                  {s.delta}
                </span>
              </td>
              <td className="px-4 py-4 text-right text-[15px] font-semibold">{s.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
