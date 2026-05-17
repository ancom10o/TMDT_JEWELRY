/* eslint-disable react/prop-types */
const toneMap = {
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
  neutral: 'bg-slate-100 text-slate-700',
  accent: 'bg-indigo-100 text-indigo-700'
};

function StatusBadge({ label, tone = 'neutral' }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${toneMap[tone] || toneMap.neutral}`}>{label}</span>;
}

export default StatusBadge;
