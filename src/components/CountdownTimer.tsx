import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { t } from "@/lib/i18n";

export function CountdownTimer({ endsAt }: { endsAt: Date }) {
  const { lang } = useApp();
  const [diff, setDiff] = useState(() => Math.max(0, endsAt.getTime() - Date.now()));

  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, endsAt.getTime() - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const Box = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-luxury text-white flex items-center justify-center text-2xl md:text-3xl font-extrabold shadow-luxury border border-gold/30">
        {String(v).padStart(2, "0")}
      </div>
      <span className="text-xs mt-1 font-semibold opacity-70">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <Box v={d} label={t(lang, "days")} />
      <span className="text-2xl text-gold font-bold">:</span>
      <Box v={h} label={t(lang, "hours")} />
      <span className="text-2xl text-gold font-bold">:</span>
      <Box v={m} label={t(lang, "minutes")} />
      <span className="text-2xl text-gold font-bold">:</span>
      <Box v={s} label={t(lang, "seconds")} />
    </div>
  );
}
