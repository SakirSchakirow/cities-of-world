import { ShieldCheck, X } from 'lucide-react';
import { TRANSLATIONS, type Language } from '../i18n/translations';

interface PrivacyDisclaimerModalProps {
  lang: Language;
  onClose: () => void;
}

export function PrivacyDisclaimerModal({ lang, onClose }: PrivacyDisclaimerModalProps) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.privacyTitle}
        className="w-full max-w-xl max-h-[88dvh] flex flex-col rounded-2xl bg-white border-2 border-[#3A86FF]/30 shadow-2xl overflow-hidden"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-5 h-5 text-[#3A86FF] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg sm:text-xl font-black text-slate-950 truncate">
              {t.privacyTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.privacyClose}
            className="min-h-[40px] min-w-[40px] p-2 rounded-lg text-slate-500 hover:text-slate-950 hover:bg-slate-200/70 transition-colors cursor-pointer flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto custom-scroll space-y-5 text-sm text-slate-700 leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec1Title}
            </h3>
            <p>{t.privacySec1Body}</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec2Title}
            </h3>
            <p>{t.privacySec2Body}</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec3Title}
            </h3>
            <p>{t.privacySec3Body1}</p>
            <p>{t.privacySec3Body2}</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec4Title}
            </h3>
            <p>{t.privacySec4Body}</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec5Title}
            </h3>
            <p>{t.privacySec5Body}</p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <a
                href="https://www.geonames.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#3A86FF] hover:text-[#2563EB] underline underline-offset-2"
              >
                {t.privacySec5LinkLabel}
              </a>
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#3A86FF] hover:text-[#2563EB] underline underline-offset-2"
              >
                {t.privacySec5LicenseLabel}
              </a>
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec6Title}
            </h3>
            <p>{t.privacySec6Body}</p>
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <a
                href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#3A86FF] hover:text-[#2563EB] underline underline-offset-2"
              >
                {t.privacySec6GithubLabel}
              </a>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#3A86FF] hover:text-[#2563EB] underline underline-offset-2"
              >
                {t.privacySec6GoogleLabel}
              </a>
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec7Title}
            </h3>
            <p>{t.privacySec7Body}</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec8Title}
            </h3>
            <p>{t.privacySec8Body1}</p>
            <p>{t.privacySec8Body2}</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec9Title}
            </h3>
            <p>{t.privacySec9Body}</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec10Title}
            </h3>
            <p>{t.privacySec10Body}</p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-display text-base font-extrabold text-slate-950">
              {t.privacySec11Title}
            </h3>
            <p className="font-semibold text-slate-950">{t.privacySec11Owner}</p>
            <p>{t.privacySec11Body}</p>
          </section>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#3A86FF] hover:bg-[#2563EB] text-white text-sm font-extrabold cursor-pointer whitespace-nowrap"
          >
            {t.privacyClose}
          </button>
        </div>
      </div>
    </div>
  );
}
