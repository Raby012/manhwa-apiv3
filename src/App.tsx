import { useState, useEffect, useRef, useCallback } from "react";

const BASE = "https://manhwa-api2.onrender.com";
const RAIL = "https://manhwa-api-production.up.railway.app";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Manga {
  id?: any;
  slug?: string;
  title?: any;
  page?: string;
  coverImage?: { large?: string; medium?: string };
  image?: string;
  poster?: string;
  cover_small?: string;
  status?: string;
  countryOfOrigin?: string;
  format?: string;
  description?: string;
  genres?: string[];
  authors?: string;
  year?: any;
  type?: string;
  total_chapters?: number;
}

interface Chapter {
  ch_title?: string;
  chapter_number?: string;
  slug?: string;
  time?: string;
  pages?: number;
  provider?: string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getImage(m: any): string {
  return m?.coverImage?.large || m?.coverImage?.medium ||
    m?.image || m?.poster || m?.cover_small || "";
}

function getTitle(m: any): string {
  if (typeof m?.title === "string") return m.title;
  return m?.title?.english || m?.title?.romaji || m?.title?.native ||
    m?.page || "Unknown";
}

function getId(m: any): any {
  return m?.id || m?.slug || m?.anilistId || "";
}

function getType(m: any): string {
  if (m?.type) return m.type.toUpperCase();
  if (m?.countryOfOrigin === "KR") return "MANHWA";
  if (m?.countryOfOrigin === "CN") return "MANHUA";
  return "MANGA";
}

function getStatus(m: any): string {
  const s = m?.status || "";
  if (["RELEASING", "ongoing"].includes(s)) return "ONGOING";
  if (["FINISHED", "completed"].includes(s)) return "COMPLETED";
  return s.toUpperCase();
}

function timeAgo(d: string): string {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

async function apiFetch(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = "200px", r = "8px" }: any) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg,#1a1a1a 25%,#252525 50%,#1a1a1a 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.5s infinite",
    }} />
  );
}

// ─── MANGA CARD ───────────────────────────────────────────────────────────────
function MangaCard({ manga, onClick }: { manga: any; onClick: (m: any) => void }) {
  const image = getImage(manga);
  const title = getTitle(manga);
  const type = getType(manga);
  const status = getStatus(manga);
  const typeColor = type === "MANHWA" ? "#a855f7" : type === "MANHUA" ? "#10b981" : "#f59e0b";

  return (
    <div
      onClick={() => onClick(manga)}
      style={{
        borderRadius: "12px", overflow: "hidden",
        background: "#161616", cursor: "pointer",
        border: "1px solid #222", transition: "all 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={e => (e.currentTarget.style.border = `1px solid ${typeColor}`)}
      onMouseLeave={e => (e.currentTarget.style.border = "1px solid #222")}
    >
      <div style={{ position: "relative", aspectRatio: "2/3" }}>
        {image ? (
          <img
            src={image} alt={title} loading="lazy"
            referrerPolicy="no-referrer"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={e => {
              const t = e.target as HTMLImageElement;
              if (!t.src.includes("weserv") && image)
                t.src = `https://images.weserv.nl/?url=${encodeURIComponent(image)}&w=200&output=jpg`;
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#222", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#444", fontSize: "11px" }}>No Image</span>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 55%,rgba(13,13,13,0.97))" }} />
        <span style={{
          position: "absolute", top: 6, left: 6,
          background: typeColor, color: "#fff",
          fontSize: "9px", fontWeight: 700, padding: "2px 5px", borderRadius: "3px",
        }}>{type}</span>
        {status && (
          <span style={{
            position: "absolute", top: 6, right: 6,
            background: status === "ONGOING" ? "#10b981" : "#555",
            color: "#fff", fontSize: "8px", fontWeight: 600,
            padding: "2px 4px", borderRadius: "3px",
          }}>{status}</span>
        )}
      </div>
      <div style={{ padding: "8px 8px 10px" }}>
        <p style={{
          color: "#fff", fontSize: "12px", fontWeight: 600, margin: 0,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4,
        }}>{title}</p>
      </div>
    </div>
  );
}

// ─── SECTION ROW ──────────────────────────────────────────────────────────────
function Section({ title, emoji, items, onCardClick, accent = "#a855f7", onViewAll }: any) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items?.length) return null;
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 170, behavior: "smooth" });
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 4, height: 22, background: accent, borderRadius: 2 }} />
          <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 }}>
            {emoji} {title} <span style={{ color: "#444", fontSize: 13, fontWeight: 400 }}>({items.length})</span>
          </h2>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => scroll(-1)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>‹</button>
          <button onClick={() => scroll(1)} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 14 }}>›</button>
          {onViewAll && (
            <button onClick={onViewAll} style={{ background: "none", border: `1px solid ${accent}44`, color: accent, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, cursor: "pointer" }}>VIEW ALL →</button>
          )}
        </div>
      </div>
      <div ref={ref} style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 16px 8px", scrollbarWidth: "none" }}>
        {items.map((m: any, i: number) => (
          <div key={`${getId(m)}-${i}`} style={{ minWidth: 150, width: 150 }}>
            <MangaCard manga={m} onClick={onCardClick} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HERO SLIDER ──────────────────────────────────────────────────────────────
function HeroSlider({ items, onCardClick }: any) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!items?.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % Math.min(items.length, 8)), 5000);
    return () => clearInterval(t);
  }, [items]);
  if (!items?.length) return null;
  const hero = items[Math.min(idx, items.length - 1)];
  const image = getImage(hero);
  const title = getTitle(hero);
  const desc = hero?.description?.replace(/<[^>]+>/g, "")?.slice(0, 120) || "";
  return (
    <div style={{ position: "relative", height: 360, overflow: "hidden", marginBottom: 28 }}>
      {image && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center top", filter: "blur(10px) brightness(0.35)", transform: "scale(1.1)", transition: "all 0.8s" }} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right,rgba(13,13,13,0.97) 40%,transparent),linear-gradient(to top,rgba(13,13,13,0.9),transparent 60%)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 20px", display: "flex", gap: 16, alignItems: "flex-end", zIndex: 2 }}>
        {image && (
          <img src={image} alt={title} referrerPolicy="no-referrer"
            style={{ width: 110, aspectRatio: "2/3", objectFit: "cover", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.8)", border: "2px solid rgba(168,85,247,0.4)", flexShrink: 0 }}
            onError={e => { (e.target as any).style.display = "none"; }}
          />
        )}
        <div style={{ flex: 1 }}>
          <span style={{ background: "#a855f7", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, display: "inline-block", marginBottom: 8, letterSpacing: 1 }}>
            {getType(hero)} #{idx + 1}
          </span>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.2 }}>{title}</h1>
          {desc && <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, margin: "0 0 14px", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</p>}
          <button onClick={() => onCardClick(hero)}
            style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ▶ Read Now
          </button>
        </div>
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 5, zIndex: 3 }}>
        {items.slice(0, 8).map((_: any, i: number) => (
          <div key={i} onClick={() => setIdx(i)}
            style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 3, background: i === idx ? "#a855f7" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.3s" }} />
        ))}
      </div>
    </div>
  );
}

// ─── WAKE-UP SKELETON ─────────────────────────────────────────────────────────
function WakeUpScreen({ countdown }: { countdown: number }) {
  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", padding: "16px 16px 100px" }}>
      <div style={{ background: "#1a1a2e", border: "1px solid #a855f7", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "center" }}>
        <p style={{ color: "#a855f7", fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>Connecting to server...</p>
        <p style={{ color: "#666", fontSize: 12, margin: "0 0 10px" }}>
          {countdown > 0 ? `Backend waking up — ready in ~${countdown}s` : "Almost ready..."}
        </p>
        <div style={{ background: "#222", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(90deg,#a855f7,#ec4899)", height: "100%", borderRadius: 4, width: `${((30 - Math.max(countdown, 0)) / 30) * 100}%`, transition: "width 1s ease" }} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: "hidden", background: "#161616", border: "1px solid #222" }}>
            <Skeleton h="200px" r="0" />
            <div style={{ padding: 8 }}>
              <Skeleton h="12px" r="6px" w="80%" />
              <div style={{ marginTop: 6 }}><Skeleton h="10px" r="6px" w="50%" /></div>
            </div>
          </div>
        ))}
      </div>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ onNavigate }: { onNavigate: (page: string, data?: any) => void }) {
  const [sections, setSections] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [waking, setWaking] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
    async function load() {
      try {
        await fetch(`${BASE}/`).catch(() => {});
        const data = await apiFetch(`${BASE}/api/home`);
        setSections({
          trending: data.trending || data.popular || [],
          latest: data.latest || data.recentlyUpdated || [],
          newArrivals: data.newArrivals || data.new_arrivals || [],
        });
      } catch {
        try {
          const [tr, la] = await Promise.all([
            apiFetch(`${RAIL}/api/trending/1`),
            apiFetch(`${RAIL}/api/latest/1`),
          ]);
          setSections({ trending: tr.list || [], latest: la.list || [] });
        } catch {}
      } finally {
        setWaking(false);
        setLoading(false);
        clearInterval(timer);
      }
    }
    load();
    return () => clearInterval(timer);
  }, []);

  const go = (manga: any) => onNavigate("detail", manga);

  if (waking || loading) return <WakeUpScreen countdown={countdown} />;

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", paddingBottom: 100 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <HeroSlider items={sections.trending?.slice(0, 8) || sections.latest?.slice(0, 8) || []} onCardClick={go} />
      <Section title="Trending Now" emoji="🔥" items={sections.trending} onCardClick={go} accent="#ec4899" onViewAll={() => onNavigate("browse")} />
      <Section title="Latest Updates" emoji="⚡" items={sections.latest} onCardClick={go} accent="#a855f7" onViewAll={() => onNavigate("browse")} />
      <Section title="New Arrivals" emoji="🆕" items={sections.newArrivals} onCardClick={go} accent="#10b981" onViewAll={() => onNavigate("browse")} />
      {!sections.trending?.length && !sections.latest?.length && (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p style={{ fontSize: 40, margin: "0 0 16px" }}>📚</p>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Failed to load content</p>
          <p style={{ color: "#666", fontSize: 14 }}>The server may still be starting. Try refreshing.</p>
          <button onClick={() => window.location.reload()} style={{ background: "#a855f7", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>Refresh</button>
        </div>
      )}
    </div>
  );
}

// ─── BROWSE PAGE ──────────────────────────────────────────────────────────────
function BrowsePage({ onNavigate, initialQuery = "" }: { onNavigate: (p: string, d?: any) => void; initialQuery?: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [inputVal, setInputVal] = useState(initialQuery);
  const [filter, setFilter] = useState("all");
  const loaderRef = useRef<HTMLDivElement>(null);
  const isSearch = query.length >= 2;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      let data: any;
      if (isSearch) {
        data = await apiFetch(`${BASE}/api/search/${encodeURIComponent(query)}?page=${page}`).catch(() =>
          apiFetch(`${RAIL}/api/search/${encodeURIComponent(query)}?page=${page}`)
        );
        const newItems = data.list || data.results || data.media || [];
        setItems(p => page === 1 ? newItems : [...p, ...newItems]);
        setHasMore(newItems.length >= 20);
      } else {
        const endpoint = filter === "manhwa" ? `${RAIL}/api/manhwa/${page}`
          : filter === "manhua" ? `${RAIL}/api/manhua/${page}`
          : filter === "manga" ? `${RAIL}/api/manga/${page}`
          : `${RAIL}/api/all/${page}`;
        data = await apiFetch(endpoint);
        const newItems = data.list || [];
        if (!newItems.length) { setHasMore(false); setLoading(false); return; }
        setItems(p => page === 1 ? newItems : [...p, ...newItems]);
        setHasMore(newItems.length >= 20);
      }
      setPage(p => p + 1);
    } catch { setHasMore(false); }
    setLoading(false);
  }, [loading, hasMore, page, query, filter, isSearch]);

  useEffect(() => { setItems([]); setPage(1); setHasMore(true); }, [query, filter]);
  useEffect(() => { if (hasMore && items.length === 0) loadMore(); }, [query, filter, hasMore, items.length]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMore(); }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [loadMore]);

  const doSearch = () => { setQuery(inputVal); };

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", paddingBottom: 100 }}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, display: "flex", background: "#161616", border: "1px solid #2a2a2a", borderRadius: 10, overflow: "hidden" }}>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              placeholder="Search manhwa, manga, manhua..."
              style={{ flex: 1, background: "none", border: "none", color: "#fff", fontSize: 14, padding: "12px 14px", outline: "none" }}
            />
            {inputVal && <button onClick={() => { setInputVal(""); setQuery(""); }} style={{ background: "none", border: "none", color: "#666", fontSize: 18, padding: "0 12px", cursor: "pointer" }}>✕</button>}
          </div>
          <button onClick={doSearch} style={{ background: "#a855f7", color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontSize: 18, cursor: "pointer" }}>🔍</button>
        </div>
        {!isSearch && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {["all", "manhwa", "manga", "manhua"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ background: filter === f ? "#a855f7" : "#1a1a1a", color: filter === f ? "#fff" : "#888", border: filter === f ? "none" : "1px solid #333", borderRadius: 20, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", textTransform: "capitalize" }}>
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}
        {isSearch && <p style={{ color: "#666", fontSize: 13, marginBottom: 12 }}>{items.length > 0 ? `${items.length} results for "${query}"` : `Searching for "${query}"...`}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, padding: "0 16px" }}>
        {items.map((m, i) => <MangaCard key={`${getId(m)}-${i}`} manga={m} onClick={manga => onNavigate("detail", manga)} />)}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ borderRadius: 12, overflow: "hidden", background: "#161616", border: "1px solid #222" }}>
            <Skeleton h="200px" r="0" />
            <div style={{ padding: 8 }}><Skeleton h="12px" r="6px" w="80%" /></div>
          </div>
        ))}
      </div>
      {isSearch && items.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>🔍</p>
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>No results for "{query}"</p>
          <p style={{ color: "#666", fontSize: 13 }}>Try a different spelling</p>
        </div>
      )}
      <div ref={loaderRef} style={{ padding: 20, textAlign: "center" }}>
        {loading && <div style={{ width: 28, height: 28, border: "3px solid #222", borderTop: "3px solid #a855f7", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />}
        {!hasMore && items.length > 0 && <p style={{ color: "#333", fontSize: 12 }}>All caught up ✓</p>}
      </div>
    </div>
  );
}

// ─── DETAIL PAGE ──────────────────────────────────────────────────────────────
function DetailPage({ manga: initial, onNavigate }: { manga: any; onNavigate: (p: string, d?: any) => void }) {
  const [manga, setManga] = useState<any>(initial);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingChap, setLoadingChap] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(false);
  const id = getId(initial);
  const image = getImage(manga);
  const title = getTitle(manga);
  const type = getType(manga);
  const typeColor = type === "MANHWA" ? "#a855f7" : type === "MANHUA" ? "#10b981" : "#f59e0b";
  const desc = (manga?.description || "").replace(/<[^>]+>/g, "");

  useEffect(() => {
    async function load() {
      try {
        const info = await apiFetch(`${BASE}/api/info/${id}`).catch(() => null);
        if (info) setManga((p: any) => ({ ...p, ...info }));
      } catch {}
      try {
        setLoadingChap(true);
        const chapData = await apiFetch(`${BASE}/api/chapters/${id}`).catch(() =>
          apiFetch(`${RAIL}/api/chapters/${id}?title=${encodeURIComponent(getTitle(initial))}`)
        );
        setChapters(chapData.ch_list || []);
      } catch {}
      setLoadingChap(false);
    }
    load();
    window.scrollTo(0, 0);
  }, [id]);

  const filtered = chapters.filter(c =>
    !filter || c.ch_title?.toLowerCase().includes(filter.toLowerCase()) ||
    c.chapter_number?.includes(filter)
  );
  const displayed = showAll ? filtered : filtered.slice(0, 80);

  const saveBookmark = () => {
    const bm = JSON.parse(localStorage.getItem("manhwahub_bookmarks") || "[]");
    const exists = bm.find((b: any) => getId(b) === id);
    if (!exists) { bm.unshift(manga); localStorage.setItem("manhwahub_bookmarks", JSON.stringify(bm.slice(0, 100))); }
    alert("Bookmarked!");
  };

  const firstChap = chapters.length > 0 ? chapters[chapters.length - 1] : null;

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", paddingBottom: 100 }}>
      <button onClick={() => onNavigate("home")} style={{ position: "fixed", top: 12, left: 12, zIndex: 100, background: "rgba(0,0,0,0.8)", border: "1px solid #333", color: "#fff", borderRadius: "50%", width: 38, height: 38, fontSize: 18, cursor: "pointer" }}>←</button>
      <div style={{ position: "relative", minHeight: 380, overflow: "hidden" }}>
        {image && <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center top", filter: "blur(20px) brightness(0.25)", transform: "scale(1.1)" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%,rgba(13,13,13,1) 90%)" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "70px 16px 24px", display: "flex", gap: 16, alignItems: "flex-end" }}>
          <div style={{ flexShrink: 0 }}>
            {image ? (
              <img src={image} alt={title} referrerPolicy="no-referrer"
                style={{ width: 130, aspectRatio: "2/3", objectFit: "cover", borderRadius: 12, boxShadow: "0 16px 48px rgba(0,0,0,0.8)", border: "2px solid rgba(168,85,247,0.4)" }}
                onError={e => { (e.target as any).style.display = "none"; }}
              />
            ) : <div style={{ width: 130, aspectRatio: "2/3", background: "#222", borderRadius: 12 }} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              <span style={{ background: typeColor, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4 }}>{type}</span>
              <span style={{ background: getStatus(manga) === "ONGOING" ? "#10b981" : "#555", color: "#fff", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4 }}>{getStatus(manga) || "ONGOING"}</span>
              {manga?.year && <span style={{ background: "#333", color: "#aaa", fontSize: 10, padding: "2px 8px", borderRadius: 4 }}>{manga.year}</span>}
            </div>
            <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 6px", lineHeight: 1.2 }}>{title}</h1>
            {manga?.authors && <p style={{ color: "#a0a0a0", fontSize: 13, margin: "0 0 12px" }}>{manga.authors}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
              {(manga?.genres || []).slice(0, 5).map((g: string) => (
                <span key={g} style={{ background: `${typeColor}20`, color: typeColor, fontSize: 10, padding: "2px 8px", borderRadius: 12, border: `1px solid ${typeColor}40` }}>{g}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {firstChap && (
                <button onClick={() => onNavigate("reader", { chapter: firstChap, manga })}
                  style={{ background: `linear-gradient(135deg,${typeColor},#ec4899)`, color: "#fff", border: "none", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  ▶ Start Reading
                </button>
              )}
              <button onClick={saveBookmark} style={{ background: "#1a1a1a", border: "1px solid #333", color: "#888", padding: "10px 14px", borderRadius: 10, fontSize: 12, cursor: "pointer" }}>🔖 Save</button>
            </div>
          </div>
        </div>
      </div>
      {desc && (
        <div style={{ margin: "0 16px 16px", background: "#161616", borderRadius: 12, padding: 16, border: "1px solid #222" }}>
          <p style={{ color: "#a0a0a0", fontSize: 14, lineHeight: 1.7, margin: 0, display: showFull ? "block" : "-webkit-box", WebkitLineClamp: showFull ? undefined : 4, WebkitBoxOrient: "vertical" as any, overflow: showFull ? "visible" : "hidden" }}>{desc}</p>
          {desc.length > 200 && <button onClick={() => setShowFull(p => !p)} style={{ color: typeColor, background: "none", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "8px 0 0" }}>{showFull ? "Show Less ↑" : "Read More ↓"}</button>}
        </div>
      )}
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}>
            📚 {loadingChap ? "Loading..." : `${chapters.length} Chapters`}
          </h3>
          <input value={filter} onChange={e => setFilter(e.target.value)}
            placeholder="Search chapter..."
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#fff", padding: "7px 12px", borderRadius: 8, fontSize: 12, outline: "none", width: 140 }}
          />
        </div>
        {loadingChap ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #222", borderTop: `3px solid ${typeColor}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <p style={{ color: "#666", fontSize: 13 }}>Loading all chapters...</p>
          </div>
        ) : chapters.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: "#666", fontSize: 14 }}>No English chapters found</p>
          </div>
        ) : (
          <>
            {displayed.map((ch, i) => (
              <div key={`${ch.slug}-${i}`}
                onClick={() => {
                  const history = JSON.parse(localStorage.getItem("manhwahub_history") || "[]");
                  history.unshift({ manga, chapter: ch, time: new Date().toISOString() });
                  localStorage.setItem("manhwahub_history", JSON.stringify(history.slice(0, 50)));
                  onNavigate("reader", { chapter: ch, manga });
                }}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#161616", borderRadius: 8, marginBottom: 6, cursor: "pointer", border: "1px solid #1f1f1f", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1f1f2e"; e.currentTarget.style.border = `1px solid ${typeColor}60`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#161616"; e.currentTarget.style.border = "1px solid #1f1f1f"; }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ color: typeColor, fontWeight: 700, fontSize: 13, marginRight: 8 }}>Ch.{ch.chapter_number}</span>
                  <span style={{ color: "#ccc", fontSize: 13 }}>{ch.ch_title?.replace(`Chapter ${ch.chapter_number}`, "").replace("— ", "").trim() || ""}</span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {ch.time && <div style={{ color: "#555", fontSize: 11 }}>{timeAgo(ch.time)}</div>}
                  {ch.pages ? <div style={{ color: "#444", fontSize: 10 }}>{ch.pages}p</div> : null}
                </div>
              </div>
            ))}
            {filtered.length > 80 && !showAll && (
              <button onClick={() => setShowAll(true)} style={{ width: "100%", padding: 14, background: "#1a1a1a", color: typeColor, border: `1px solid ${typeColor}40`, borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 8 }}>
                Show All {filtered.length} Chapters ↓
              </button>
            )}
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── READER PAGE ──────────────────────────────────────────────────────────────
function ReaderPage({ chapter, manga, onNavigate }: { chapter: Chapter; manga: any; onNavigate: (p: string, d?: any) => void }) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showBar, setShowBar] = useState(true);
  const [progress, setProgress] = useState(0);
  const slug = chapter?.slug || "";

  useEffect(() => {
    window.scrollTo(0, 0);
    async function load() {
      setLoading(true);
      setError("");
      try {
        let data: any = await apiFetch(`${BASE}/api/chapter/${slug}`).catch(() =>
          apiFetch(`${RAIL}/api/chapter/${getId(manga)}/${slug}`)
        );
        const imgs = (data?.chapters || data?.pages || []).map((p: any) => p.ch || p.img || p.url || p);
        if (!imgs.length) throw new Error("No pages found");
        setPages(imgs);
      } catch (e: any) {
        setError(e.message || "Failed to load chapter");
      }
      setLoading(false);
    }
    load();

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      setProgress(Math.round((scrollTop / (scrollHeight - clientHeight)) * 100));
      setShowBar(scrollTop < 100);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  return (
    <div style={{ background: "#000", minHeight: "100vh" }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      {/* Top bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: showBar ? "rgba(0,0,0,0.95)" : "transparent",
        transition: "all 0.3s", padding: showBar ? "10px 14px" : 0,
        borderBottom: showBar ? "1px solid #1a1a1a" : "none",
      }}>
        {showBar && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => onNavigate("detail", manga)} style={{ background: "none", border: "none", color: "#a855f7", fontSize: 22, cursor: "pointer" }}>←</button>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontSize: 13, fontWeight: 700, margin: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{getTitle(manga)}</p>
              <p style={{ color: "#666", fontSize: 11, margin: 0 }}>Chapter {chapter.chapter_number}</p>
            </div>
            <span style={{ color: "#a855f7", fontSize: 12, fontWeight: 600 }}>{progress}%</span>
          </div>
        )}
        <div style={{ height: 2, background: "#1a1a1a" }}>
          <div style={{ height: "100%", background: "#a855f7", width: `${progress}%`, transition: "width 0.2s" }} />
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div style={{ width: 44, height: 44, border: "4px solid #1a1a1a", borderTop: "4px solid #a855f7", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ color: "#666", marginTop: 16, fontSize: 14 }}>Loading chapter...</p>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <p style={{ color: "#e53e3e", fontSize: 16, fontWeight: 700 }}>Failed to load</p>
          <p style={{ color: "#666", fontSize: 13 }}>{error}</p>
          <button onClick={() => onNavigate("detail", manga)} style={{ background: "#a855f7", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>← Go Back</button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ paddingTop: 48 }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {pages.map((url, i) => (
              <img key={i} src={url} alt={`Page ${i + 1}`}
                referrerPolicy="no-referrer"
                style={{ width: "100%", display: "block", marginBottom: 2 }}
                loading={i < 3 ? "eager" : "lazy"}
                onError={e => {
                  const t = e.target as HTMLImageElement;
                  if (!t.src.includes("weserv"))
                    t.src = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
                  else if (!t.src.includes("proxy"))
                    t.src = `${BASE}/api/proxy/image?url=${encodeURIComponent(url)}`;
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, padding: 16, justifyContent: "center" }}>
            <button onClick={() => onNavigate("detail", manga)} style={{ flex: 1, maxWidth: 200, padding: 14, background: "#1a1a1a", color: "#fff", border: "1px solid #333", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>← Back to Chapters</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CATEGORIES PAGE ──────────────────────────────────────────────────────────
function CategoriesPage({ onNavigate }: { onNavigate: (p: string, d?: any) => void }) {
  const genres = ["Action", "Romance", "Fantasy", "Isekai", "Comedy", "Drama", "Horror", "Martial Arts", "School Life", "Slice of Life", "Supernatural", "Harem", "Thriller", "Mystery", "Adventure", "Sports", "Sci-Fi", "Historical", "Psychological", "Tragedy"];
  const colors = ["#a855f7", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];
  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", padding: "20px 16px 100px" }}>
      <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Categories</h1>
      <p style={{ color: "#666", fontSize: 13, margin: "0 0 24px" }}>Browse by genre</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        {genres.map((g, i) => (
          <div key={g} onClick={() => onNavigate("browse", { query: g })}
            style={{ background: `${colors[i % colors.length]}15`, border: `1px solid ${colors[i % colors.length]}40`, borderRadius: 12, padding: "18px 14px", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = `${colors[i % colors.length]}25`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${colors[i % colors.length]}15`; }}
          >
            <p style={{ color: colors[i % colors.length], fontSize: 14, fontWeight: 700, margin: 0 }}>{g}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BOOKMARKS PAGE ───────────────────────────────────────────────────────────
function BookmarksPage({ onNavigate }: { onNavigate: (p: string, d?: any) => void }) {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  useEffect(() => { setBookmarks(JSON.parse(localStorage.getItem("manhwahub_bookmarks") || "[]")); }, []);
  const remove = (id: any) => {
    const updated = bookmarks.filter(b => getId(b) !== id);
    setBookmarks(updated);
    localStorage.setItem("manhwahub_bookmarks", JSON.stringify(updated));
  };
  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", padding: "20px 16px 100px" }}>
      <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 6px" }}>Bookmarks</h1>
      <p style={{ color: "#666", fontSize: 13, margin: "0 0 24px" }}>{bookmarks.length} saved</p>
      {bookmarks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p style={{ fontSize: 50, margin: "0 0 16px" }}>🔖</p>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>No bookmarks yet</p>
          <p style={{ color: "#666", fontSize: 14 }}>Save manga to read later</p>
          <button onClick={() => onNavigate("browse")} style={{ background: "#a855f7", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>Browse Manga</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bookmarks.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 12, background: "#161616", borderRadius: 12, padding: 12, border: "1px solid #222", alignItems: "center" }}>
              <img src={getImage(m)} alt={getTitle(m)} referrerPolicy="no-referrer"
                style={{ width: 56, height: 80, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                onError={e => { (e.target as any).style.background = "#222"; (e.target as any).src = ""; }}
              />
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => onNavigate("detail", m)}>
                <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: "0 0 4px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", cursor: "pointer" }}>{getTitle(m)}</p>
                <p style={{ color: "#666", fontSize: 12, margin: 0 }}>{getType(m)} • {getStatus(m)}</p>
              </div>
              <button onClick={() => remove(getId(m))} style={{ background: "none", border: "none", color: "#444", fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── HISTORY PAGE ─────────────────────────────────────────────────────────────
function HistoryPage({ onNavigate }: { onNavigate: (p: string, d?: any) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => { setHistory(JSON.parse(localStorage.getItem("manhwahub_history") || "[]")); }, []);
  const clear = () => { setHistory([]); localStorage.removeItem("manhwahub_history"); };
  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", padding: "20px 16px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}>History</h1>
          <p style={{ color: "#666", fontSize: 13, margin: 0 }}>{history.length} chapters read</p>
        </div>
        {history.length > 0 && <button onClick={clear} style={{ background: "none", border: "1px solid #e53e3e44", color: "#e53e3e", padding: "7px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Clear All</button>}
      </div>
      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <p style={{ fontSize: 50, margin: "0 0 16px" }}>📖</p>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>No reading history</p>
          <p style={{ color: "#666", fontSize: 14 }}>Start reading to track your progress</p>
          <button onClick={() => onNavigate("browse")} style={{ background: "#a855f7", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>Browse Manga</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {history.map((h, i) => (
            <div key={i} onClick={() => onNavigate("reader", { chapter: h.chapter, manga: h.manga })}
              style={{ display: "flex", gap: 12, background: "#161616", borderRadius: 12, padding: 12, border: "1px solid #222", alignItems: "center", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.border = "1px solid #a855f740"}
              onMouseLeave={e => e.currentTarget.style.border = "1px solid #222"}
            >
              <img src={getImage(h.manga)} alt="" referrerPolicy="no-referrer"
                style={{ width: 50, height: 70, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
                onError={e => { (e.target as any).style.background = "#222"; (e.target as any).src = ""; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, margin: "0 0 3px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{getTitle(h.manga)}</p>
                <p style={{ color: "#a855f7", fontSize: 12, margin: "0 0 3px" }}>Ch.{h.chapter?.chapter_number}</p>
                <p style={{ color: "#555", fontSize: 11, margin: 0 }}>{timeAgo(h.time)}</p>
              </div>
              <span style={{ color: "#a855f7", fontSize: 18 }}>▶</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNav({ active, onNavigate }: { active: string; onNavigate: (p: string) => void }) {
  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "browse", label: "Browse", icon: "🔍" },
    { id: "categories", label: "Categories", icon: "⊞" },
    { id: "bookmarks", label: "Saved", icon: "🔖" },
    { id: "history", label: "History", icon: "🕐" },
  ];
  const isActive = (id: string) => active === id || (active === "search" && id === "browse");
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "rgba(13,13,13,0.98)", borderTop: "1px solid #1a1a1a",
      display: "flex", backdropFilter: "blur(10px)",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onNavigate(t.id)}
          style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            padding: "10px 0 12px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3,
            color: isActive(t.id) ? "#a855f7" : "#555",
            transition: "color 0.2s",
          }}>
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: isActive(t.id) ? 700 : 400, letterSpacing: 0.3 }}>{t.label}</span>
          {isActive(t.id) && <div style={{ width: 20, height: 2, background: "#a855f7", borderRadius: 1 }} />}
        </button>
      ))}
    </div>
  );
}

// ─── TOP NAV ──────────────────────────────────────────────────────────────────
function TopNav({ onNavigate, page }: { onNavigate: (p: string) => void; page: string }) {
  const hideOn = ["detail", "reader"];
  if (hideOn.includes(page)) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: "rgba(13,13,13,0.98)", borderBottom: "1px solid #1a1a1a", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onNavigate("home")}>
        <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#a855f7,#ec4899)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14 }}>⊞</span>
        </div>
        <span style={{ color: "#fff", fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>MANHWA<span style={{ color: "#a855f7" }}>HUB</span></span>
      </div>
      <button onClick={() => onNavigate("browse")} style={{ background: "none", border: "none", color: "#666", fontSize: 22, cursor: "pointer", padding: "4px 8px" }}>🔍</button>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [pageData, setPageData] = useState<any>(null);

  const navigate = (p: string, data?: any) => {
    setPage(p);
    setPageData(data || null);
    if (!["reader", "detail"].includes(p)) window.scrollTo(0, 0);
  };

  const hideNavOn = ["reader"];
  const topOffset = hideNavOn.includes(page) ? 0 : 56;

  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#0d0d0d" }}>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        body{margin:0;padding:0;background:#0d0d0d}
        ::-webkit-scrollbar{display:none}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        input::placeholder{color:#555}
        button:active{transform:scale(0.97)}
      `}</style>
      <TopNav onNavigate={navigate} page={page} />
      <div style={{ paddingTop: topOffset }}>
        {page === "home" && <HomePage onNavigate={navigate} />}
        {page === "browse" && <BrowsePage onNavigate={navigate} initialQuery={pageData?.query || ""} />}
        {page === "categories" && <CategoriesPage onNavigate={navigate} />}
        {page === "bookmarks" && <BookmarksPage onNavigate={navigate} />}
        {page === "history" && <HistoryPage onNavigate={navigate} />}
        {page === "detail" && pageData && <DetailPage manga={pageData} onNavigate={navigate} />}
        {page === "reader" && pageData?.chapter && <ReaderPage chapter={pageData.chapter} manga={pageData.manga} onNavigate={navigate} />}
      </div>
      {!hideNavOn.includes(page) && <BottomNav active={page} onNavigate={navigate} />}
    </div>
  );
      }
