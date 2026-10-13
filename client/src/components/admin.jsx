// Small building blocks shared by the admin pages

export const PageHeader = ({ title, text, action }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {text && <p className="mt-1 text-sm text-ink-soft">{text}</p>}
    </div>
    {action}
  </div>
);

export const StatCard = ({ label, value, hint, tone = '' }) => (
  <div className="panel p-4">
    <p className="text-sm text-ink-soft">{label}</p>
    <p className={`mt-1 font-display text-2xl font-bold sm:text-3xl ${tone}`}>{value}</p>
    {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
  </div>
);

// Wraps a table so it scrolls sideways on small screens
export const TableWrap = ({ children }) => (
  <div className="panel overflow-x-auto">
    <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
  </div>
);

export const Th = ({ children, className = '' }) => (
  <th scope="col" className={`whitespace-nowrap border-b border-line bg-paper px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-ink-soft ${className}`}>
    {children}
  </th>
);

export const Td = ({ children, className = '' }) => <td className={`border-b border-line px-4 py-3 align-middle ${className}`}>{children}</td>;

export const ActiveBadge = ({ on, yes = 'Active', no = 'Hidden' }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${on ? 'bg-brand-100 text-brand-800' : 'bg-black/10 text-ink-soft'}`}>{on ? yes : no}</span>
);

export const CheckField = ({ label, ...props }) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
    <input type="checkbox" className="h-4 w-4 accent-brand-600" {...props} />
    {label}
  </label>
);
