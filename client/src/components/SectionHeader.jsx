/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';

function SectionHeader({ eyebrow, title, description, actionLabel, actionTo, align = 'between' }) {
  const wrapperClass =
    align === 'start'
      ? 'flex flex-col gap-3'
      : 'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between';

  return (
    <div className={wrapperClass}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-copy">{description}</p> : null}
      </div>

      {actionLabel && actionTo ? (
        <Link to={actionTo} className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition hover:text-gold">
          {actionLabel}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}

export default SectionHeader;
