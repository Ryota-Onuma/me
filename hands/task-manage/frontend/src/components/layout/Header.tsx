import { forwardRef } from "react";
import { Link } from "react-router-dom";

interface HeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSettingsClick: () => void;
  onAgentClick: () => void;
  onRefresh: () => void;
  loading: boolean;
}

const Header = forwardRef<HTMLInputElement, HeaderProps>(
  (
    { query, onQueryChange, onSettingsClick, onAgentClick, onRefresh, loading },
    ref,
  ) => {
    return (
      <header className="topbar">
        <div className="brand">
          <h1>
            <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
              AI Orchestra
            </Link>
          </h1>
        </div>
        <div className="searchbar">
          <input
            ref={ref}
            className="search"
            type="text"
            placeholder="検索"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>
        <div className="actions">
          <button
            className="iconBtn ghost"
            onClick={onRefresh}
            disabled={loading}
            aria-label={loading ? "更新中" : "再読み込み"}
            title={loading ? "更新中" : "再読み込み"}
          >
            {/* refresh */}
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                fill="currentColor"
                d="M12 6v3l4-4-4-4v3C7.58 4 4 7.58 4 12s3.58 8 8 8a8 8 0 0 0 7.75-6h-2.1A6 6 0 1 1 12 6z"
              />
            </svg>
          </button>
          <button
            className="iconBtn"
            onClick={onAgentClick}
            aria-label="エージェント実行"
            title="エージェント実行"
          >
            {/* play/spark */}
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path fill="currentColor" d="M8 5v14l11-7L8 5z" />
            </svg>
          </button>
          <button
            className="iconBtn ghost"
            onClick={onSettingsClick}
            aria-label="設定"
            title="設定"
          >
            {/* gear */}
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                fill="currentColor"
                d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3.06-1.83-.3a7.2 7.2 0 0 0-.8-1.92l1.1-1.5a.9.9 0 0 0-.11-1.18l-1.36-1.36a.9.9 0 0 0-1.18-.11l-1.5 1.1c-.6-.33-1.25-.6-1.92-.8l-.3-1.83A.9.9 0 0 0 11.96 2h-1.92a.9.9 0 0 0-.88.74l-.3 1.83c-.67.2-1.32.47-1.92.8l-1.5-1.1a.9.9 0 0 0-1.18.11L2.9 6.74a.9.9 0 0 0-.11 1.18l1.1 1.5c-.33.6-.6 1.25-.8 1.92l-1.83.3a.9.9 0 0 0-.74.88v1.92c0 .44.32.82.74.88l1.83.3c.2.67.47 1.32.8 1.92l-1.1 1.5a.9.9 0 0 0 .11 1.18l1.36 1.36a.9.9 0 0 0 1.18.11l1.5-1.1c.6.33 1.25.6 1.92.8l.3 1.83c.06.42.44.74.88.74h1.92c.44 0 .82-.32.88-.74l.3-1.83c.67-.2 1.32-.47 1.92-.8l1.5 1.1c.37.27.9.23 1.18-.11l1.36-1.36c.34-.34.38-.86.11-1.18l-1.1-1.5c.33-.6.6-1.25.8-1.92l1.83-.3c.42-.06.74-.44.74-.88v-1.92a.9.9 0 0 0-.74-.88z"
              />
            </svg>
          </button>
        </div>
      </header>
    );
  },
);

Header.displayName = "Header";

export default Header;
