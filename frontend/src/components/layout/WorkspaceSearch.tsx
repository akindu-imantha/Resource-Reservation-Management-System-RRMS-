import { Search, X } from "lucide-react";
import styles from "./WorkspaceSearch.module.css";

type Props = { value: string; onChange: (value: string) => void; placeholder: string; resultCount: number; totalCount: number };

export default function WorkspaceSearch({ value, onChange, placeholder, resultCount, totalCount }: Props) {
  return <div className={styles.searchArea}>
    <label className={styles.searchBox}>
      <Search size={17} aria-hidden="true" />
      <input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button type="button" onClick={() => onChange("")} aria-label="Clear search"><X size={16} /></button>}
    </label>
    <span className={styles.count} aria-live="polite">Showing {resultCount} of {totalCount}</span>
  </div>;
}
