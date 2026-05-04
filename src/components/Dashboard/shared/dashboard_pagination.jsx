import React, { useMemo } from "react";
import { motion as Motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./dashboard_pagination.css";

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage > 1) pages.add(currentPage - 1);
  if (currentPage < totalPages) pages.add(currentPage + 1);

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const items = [];

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous && page - previous > 1) {
      items.push(`ellipsis-${previous}-${page}`);
    }
    items.push(page);
  });

  return items;
}

export default function DashboardPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  label = "Pagination",
}) {
  const pages = useMemo(
    () => buildPageItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  if (totalPages <= 1) return null;

  return (
    <nav className={`dashboardPagination ${className}`.trim()} aria-label={label}>
      <Motion.button
        type="button"
        className="dashboardPagination__arrow"
        whileHover={currentPage > 1 ? { x: -1 } : undefined}
        whileTap={currentPage > 1 ? { scale: 0.97 } : undefined}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft aria-hidden="true" />
      </Motion.button>

      <div className="dashboardPagination__pages">
        {pages.map((page) =>
          typeof page === "number" ? (
            <Motion.button
              key={page}
              type="button"
              className={`dashboardPagination__page ${
                page === currentPage ? "dashboardPagination__page--active" : ""
              }`}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </Motion.button>
          ) : (
            <span key={page} className="dashboardPagination__ellipsis" aria-hidden="true">
              ...
            </span>
          )
        )}
      </div>

      <Motion.button
        type="button"
        className="dashboardPagination__arrow"
        whileHover={currentPage < totalPages ? { x: 1 } : undefined}
        whileTap={currentPage < totalPages ? { scale: 0.97 } : undefined}
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight aria-hidden="true" />
      </Motion.button>
    </nav>
  );
}
