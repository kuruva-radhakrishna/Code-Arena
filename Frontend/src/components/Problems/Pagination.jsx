import './Pagination.css';

// Returns e.g. [1, '…', 4, 5, 6, '…', 20] for a compact page strip.
function pageWindow(current, total, siblings = 1) {
  const slots = siblings * 2 + 5; // first, last, current±siblings, two ellipses
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);
  const left = Math.max(current - siblings, 2);
  const right = Math.min(current + siblings, total - 1);
  const out = [1];
  if (left > 2) out.push('…'); else out.push(2);
  for (let p = Math.max(left, 3); p <= Math.min(right, total - 2); p++) out.push(p);
  if (right < total - 1) out.push('…'); else out.push(total - 1);
  out.push(total);
  return out;
}

function Pagination({ page, pageCount, onPage, pageSize, pageSizes, onPageSize, totalItems }) {
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <div className="pager" role="navigation" aria-label="Pagination">
      <span className="pager-info">
        {first}–{last} of {totalItems}
      </span>

      <div className="pager-pages">
        <button
          className="pager-btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pageWindow(page, pageCount).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="pager-gap">…</span>
          ) : (
            <button
              key={p}
              className={`pager-btn${p === page ? ' active' : ''}`}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}
        <button
          className="pager-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      <label className="pager-size">
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} aria-label="Rows per page">
          {pageSizes.map((s) => (
            <option key={s} value={s}>{s} / page</option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default Pagination;
