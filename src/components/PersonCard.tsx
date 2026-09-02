import type { Person } from "@/lib/feed";
import type { Lang, Messages } from "@/lib/i18n";
import { splitPhones, telHref, timeAgo } from "@/lib/format";
import { personTags } from "@/lib/derive";

const ic = "h-3.5 w-3.5 shrink-0 text-slate-400";

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <path
        d="M12 21s7-5.686 7-11a7 7 0 10-14 0c0 5.314 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 19a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={ic} aria-hidden>
      <path
        d="M5 5h14v10H9l-4 4V5z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden>
      <path
        d="M6 3h3l1.5 4.5-2 1.5a12 12 0 006 6l1.5-2L21 15v3a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8.25v-.5M12 11v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-1.5 text-sm text-slate-600">
      <span className="mt-0.5">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

const TAG_TONE: Record<string, string> = {
  violet: "bg-violet-100 text-violet-800",
  orange: "bg-orange-100 text-orange-800",
  sky: "bg-sky-100 text-sky-800",
};

function Tag({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${TAG_TONE[tone]}`}>
      {children}
    </span>
  );
}

export default function PersonCard({
  person,
  m,
  lang,
}: {
  person: Person;
  m: Messages;
  lang: Lang;
}) {
  const phones = splitPhones(person.phone);
  const isFound = person.status === "found";
  const isDeceased = person.status === "deceased";
  const tags = personTags(person);
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isDeceased
          ? "border-slate-300"
          : isFound
            ? "border-emerald-200"
            : "border-slate-200"
      }`}
    >
      <div
        className={`h-1 w-full ${
          isDeceased ? "bg-slate-400" : isFound ? "bg-emerald-400" : "bg-rose-400"
        }`}
      />
      <div className="p-4">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2.5">
            {person.photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={person.photo}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
              />
            )}
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-tight text-slate-900">
                {person.name}
              </h3>
              {person.nameEn && person.nameEn !== person.name && (
                <p className="truncate text-xs text-slate-400">{person.nameEn}</p>
              )}
              {(tags.minor || tags.elderly || tags.foreign) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {tags.minor && <Tag tone="violet">{m.tagMinor}</Tag>}
                  {tags.elderly && <Tag tone="orange">{m.tagElderly}</Tag>}
                  {tags.foreign && <Tag tone="sky">{m.tagForeign}</Tag>}
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            {person.flagged && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                {m.flagged}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isDeceased
                  ? "bg-slate-200 text-slate-700"
                  : isFound
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isDeceased ? "bg-slate-500" : isFound ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              {isDeceased ? m.statusDeceased : isFound ? m.statusRescued : m.statusMissing}
            </span>
          </div>
        </div>

        {person.possiblyRescued && (
          <div className="mb-2.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
            ⚑ {m.possiblyRescuedNote}
          </div>
        )}

        <div className="space-y-1.5">
          {person.place && <Row icon={<PinIcon />}>{person.place}</Row>}
          {person.age && (
            <Row icon={<UserIcon />}>
              {m.fieldAge}: {person.age}
            </Row>
          )}
          {person.when && <Row icon={<ClockIcon />}>{person.when}</Row>}
          {person.note && <Row icon={<NoteIcon />}>{person.note}</Row>}
        </div>

        {phones.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
            {phones.map((p) => (
              <a
                key={p}
                href={telHref(p)}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand/5 px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-brand/15 hover:bg-brand/10"
              >
                <PhoneIcon />
                {p}
              </a>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-slate-400">
          {person.reportedAt && (
            <span className="flex items-center gap-1">
              🕘 {m.reportedLabel} {timeAgo(person.reportedAt, lang)}
            </span>
          )}
          {person.source && (
            <span className="flex items-center gap-1">
              {m.source}:{" "}
              <a
                href={person.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand hover:underline"
              >
                {person.source.label} ↗
              </a>
            </span>
          )}
        </div>

        {person.floodLinked === false && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-amber-800/90">
            <span className="mt-0.5"><InfoIcon /></span>
            <span className="min-w-0 break-words">{m.genericAdvisory}</span>
          </div>
        )}
      </div>
    </div>
  );
}
