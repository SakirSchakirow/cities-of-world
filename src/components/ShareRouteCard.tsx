import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Download, Film, Send } from 'lucide-react';
import { TRANSLATIONS, type Language } from '../i18n/translations';
import type { DistanceUnit, GameMode, TurnRecord } from '../types/game';
import { formatDistance } from '../utils/geo';
import { buildReplayUrl, routeTotalKm, shortRouteChain } from '../utils/replayLink';

interface ShareRouteCardProps {
  lang: Language;
  turns: TurnRecord[];
  unit: DistanceUnit;
  mode: GameMode;
  score: number;
}

const GIF_FILENAME = 'cities-of-world-route.gif';

function canShareFiles(): boolean {
  try {
    const probe = new File([new Uint8Array(1)], GIF_FILENAME, { type: 'image/gif' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export function ShareRouteCard({ lang, turns, unit, mode, score }: ShareRouteCardProps) {
  const t = TRANSLATIONS[lang];
  const [gifBlob, setGifBlob] = useState<Blob | null>(null);
  const [gifProgress, setGifProgress] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const generatingRef = useRef<Promise<Blob> | null>(null);

  const nativeFileShare = useMemo(canShareFiles, []);
  const totalKm = routeTotalKm(turns);
  const cityCount = turns.filter((turn) => turn.city).length;
  const replayUrl = useMemo(() => buildReplayUrl(turns, { score, mode, unit, lang }), [turns, score, mode, unit, lang]);
  const postText = t.postText(formatDistance(totalKm, unit), cityCount, shortRouteChain(turns));
  const fullPost = `${postText}\n${replayUrl}`;

  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(replayUrl)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(replayUrl)}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(fullPost)}`;

  const getGif = (): Promise<Blob> => {
    if (gifBlob) return Promise.resolve(gifBlob);
    if (!generatingRef.current) {
      setGifProgress(0);
      generatingRef.current = import('../utils/routeGif')
        .then(({ generateRouteGif }) =>
          generateRouteGif({
            turns,
            unit,
            brandTitle: t.brandTitle,
            footerText: t.gifFooter,
            onProgress: (fraction) => setGifProgress(Math.round(fraction * 100)),
          }),
        )
        .then((blob) => {
          setGifBlob(blob);
          return blob;
        })
        .finally(() => {
          setGifProgress(null);
          generatingRef.current = null;
        });
    }
    return generatingRef.current;
  };

  // Prepare the GIF in the background right away, so "Share" can open the share sheet
  // immediately (browsers only allow it shortly after a click).
  useEffect(() => {
    if (!nativeFileShare) return;
    const timer = window.setTimeout(() => {
      getGif().catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setNotice(message);
      window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setNotice(t.copyFailed);
      return false;
    }
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = GIF_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const handleNativeShare = async () => {
    setNotice(null);
    if (!gifBlob) {
      // Not ready yet: finish it; the next tap shares instantly.
      try {
        await getGif();
        setNotice(t.gifReadyTapAgain);
      } catch {
        setNotice(t.gifFailed);
      }
      return;
    }
    const file = new File([gifBlob], GIF_FILENAME, { type: 'image/gif' });
    // Some apps drop the text when a file is attached, so keep it on the clipboard too.
    navigator.clipboard?.writeText(fullPost).catch(() => undefined);
    try {
      await navigator.share({ files: [file], title: t.brandTitle, text: fullPost });
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') setNotice(t.shareFailed);
    }
  };

  const handleDownload = async () => {
    setNotice(null);
    try {
      const blob = await getGif();
      downloadBlob(blob);
      setNotice(t.gifDownloaded);
    } catch {
      setNotice(t.gifFailed);
    }
  };

  const busy = gifProgress !== null;
  const btnBase =
    'min-h-[40px] px-3.5 py-2 rounded-xl text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap transition-colors';
  const socialBase =
    'min-h-[34px] inline-flex items-center px-3 py-1.5 rounded-lg text-white text-xs font-extrabold transition-colors whitespace-nowrap';

  return (
    <section
      aria-labelledby="share-route-title"
      className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-br from-[#FFF7DB] via-white to-[#EEF3FF] space-y-3"
    >
      <div>
        <h3 id="share-route-title" className="font-display text-lg sm:text-xl font-black text-slate-950">
          {t.shareTitle}
        </h3>
        <p className="text-sm font-semibold text-slate-600">{t.shareSubtitle}</p>
      </div>

      <p className="rounded-xl bg-white/90 border border-slate-200 px-3 py-2 text-[13px] leading-snug text-slate-800 whitespace-pre-line">
        {postText}
        {'\n'}
        <span className="text-[#3A86FF] font-semibold break-all">{replayUrl}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {nativeFileShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            aria-busy={busy}
            className={`${btnBase} bg-[#FB5607] hover:bg-[#E04800] text-white shadow-sm`}
          >
            <Send className="w-4 h-4" aria-hidden="true" />
            <span className="tabular-nums">{busy ? t.gifGenerating(gifProgress ?? 0) : t.shareNativeBtn}</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy && !nativeFileShare}
          aria-busy={busy}
          className={`${btnBase} ${
            nativeFileShare
              ? 'bg-white border border-slate-300 hover:border-slate-500 text-slate-800'
              : 'bg-[#FB5607] hover:bg-[#E04800] text-white shadow-sm'
          } disabled:cursor-wait`}
        >
          {nativeFileShare ? <Download className="w-4 h-4" aria-hidden="true" /> : <Film className="w-4 h-4" aria-hidden="true" />}
          <span className="tabular-nums">
            {busy && !nativeFileShare ? t.gifGenerating(gifProgress ?? 0) : t.gifBtn}
          </span>
        </button>
        <button
          type="button"
          onClick={() => copyText(fullPost, t.copiedClipboard)}
          className={`${btnBase} bg-white border border-slate-300 hover:border-slate-500 text-slate-800`}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
          <span>{t.copyPostBtn}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500">{t.postOn}</span>
        <a
          href={linkedinHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => copyText(fullPost, t.copiedLinkedIn)}
          className={`${socialBase} bg-[#0A66C2] hover:bg-[#004182]`}
        >
          LinkedIn
        </a>
        <a href={xHref} target="_blank" rel="noopener noreferrer" className={`${socialBase} bg-slate-900 hover:bg-slate-800`}>
          X / Twitter
        </a>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${socialBase} bg-[#128C7E] hover:bg-[#075E54]`}
        >
          WhatsApp
        </a>
      </div>

      <p className="text-xs font-semibold text-slate-500">{nativeFileShare ? t.shareTipNative : t.shareTip}</p>

      {notice && (
        <div role="status" className="text-xs font-bold text-[#3A86FF]">
          {notice}
        </div>
      )}
    </section>
  );
}
