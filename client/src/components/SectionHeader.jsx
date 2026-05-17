/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';

function SectionHeader({ eyebrow, title, description, actionLabel, actionTo, align = 'between' }) {
  const wrapperClass =
    align === 'start'
      ? 'flex flex-col gap-2.5'
      : 'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4';

  return (
    <div className={wrapperClass}>
      <div>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-copy">{description}</p> : null}
      </div>

      {actionLabel && actionTo ? (
        <Link to={actionTo} className="inline-flex items-center gap-2 text-sm font-semibold text-navy transition hover:text-gold sm:pb-1">
          {actionLabel}
          <span aria-hidden="true">&rarr;</span>
        </Link>
      ) : null}
    </div>
  );
}

export default SectionHeader;
