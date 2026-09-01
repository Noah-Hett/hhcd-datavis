export default function SimpleSearch() {
  return (
    <div className="simple-search">
      <label className="simple-search-label">
        <span className="sr-only">Search reports</span>
        <input
          type="search"
          className="simple-search-input"
          placeholder="Search reports"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
    </div>
  );
}
