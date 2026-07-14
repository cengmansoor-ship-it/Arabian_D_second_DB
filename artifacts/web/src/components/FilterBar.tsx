import { Search, X } from "lucide-react";

interface FilterBarProps {
  startDate: string;
  endDate: string;
  q: string;
  onStartDate: (v: string) => void;
  onEndDate: (v: string) => void;
  onQ: (v: string) => void;
  onSearch: () => void;
  onClear: () => void;
  placeholder?: string;
  /** Extra filter inputs rendered between date pickers and buttons */
  children?: React.ReactNode;
}

/**
 * Reusable filter bar used at the top of every list/ledger page.
 * Contains: search field, start date, end date, optional extra filters, Search + Clear buttons.
 */
export default function FilterBar({
  startDate,
  endDate,
  q,
  onStartDate,
  onEndDate,
  onQ,
  onSearch,
  onClear,
  placeholder = "لټون (نوم، شمیره...)",
  children,
}: FilterBarProps) {
  return (
    <div className="card no-print" style={{ marginBottom: 20 }}>
      <div className="card-body" style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>

          {/* Search */}
          <div style={{ flex: "2 1 200px" }}>
            <label className="form-label">لټون</label>
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute", right: 14, top: "50%",
                  transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none",
                }}
              />
              <input
                className="form-input"
                placeholder={placeholder}
                value={q}
                onChange={(e) => onQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
                style={{ paddingRight: 40 }}
              />
            </div>
          </div>

          {/* Start date */}
          <div style={{ flex: "1 1 140px" }}>
            <label className="form-label">د شروع نیټه</label>
            <input
              className="form-input"
              type="date"
              value={startDate}
              onChange={(e) => onStartDate(e.target.value)}
            />
          </div>

          {/* End date */}
          <div style={{ flex: "1 1 140px" }}>
            <label className="form-label">د ختم نیټه</label>
            <input
              className="form-input"
              type="date"
              value={endDate}
              onChange={(e) => onEndDate(e.target.value)}
            />
          </div>

          {/* Extra slot (e.g. party dropdown, category select, currency picker) */}
          {children}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, flexShrink: 0, alignSelf: "flex-end" }}>
            <button
              className="btn btn-primary"
              onClick={onSearch}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Search size={15} /> لټون
            </button>
            <button
              className="btn btn-outline"
              onClick={onClear}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <X size={15} /> پاک
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
