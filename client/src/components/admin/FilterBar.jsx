/* eslint-disable react/prop-types */
function FilterBar({ children }) {
  return (
    <div className="flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-4 sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  );
}

export default FilterBar;
