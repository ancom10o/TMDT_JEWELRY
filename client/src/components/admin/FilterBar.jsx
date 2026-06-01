/* eslint-disable react/prop-types */
function FilterBar({ children }) {
  return (
    <div className="grid items-start gap-3 rounded-[28px] border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}

export default FilterBar;
