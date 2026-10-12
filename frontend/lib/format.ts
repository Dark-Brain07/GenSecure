export function attoToGen(atto: string | bigint | number = "0", decimals = 4): string {
  try {
    const raw = typeof atto === "bigint" ? atto : BigInt(String(atto || 0));
    const negative = raw < 0n;
    const abs = negative ? -raw : raw;
    const whole = abs / 10n ** 18n;
    const fraction = abs % 10n ** 18n;
    const fracStr = fraction.toString().padStart(18, "0").slice(0, decimals);
    const trimmed = fracStr.replace(/0+$/, "");
    const result = trimmed ? `${whole}.${trimmed}` : whole.toString();
    return negative ? `-${result}` : result;
  } catch {
    return "0";
  }
}

export function genToAtto(genStr: string): bigint {
  const clean = genStr.trim();
  if (!clean || isNaN(Number(clean))) throw new Error("Invalid GEN amount");
  const [whole, frac = ""] = clean.split(".");
  const fracPadded = frac.padEnd(18, "0").slice(0, 18);
  return BigInt(whole || 0) * 10n ** 18n + BigInt(fracPadded);
}

export function shorten(address = "", start = 6, end = 4): string {
  if (!address) return "";
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}…${address.slice(-end)}`;
}

export function timeLabel(epochSeconds: string | number = 0): string {
  const s = Number(epochSeconds);
  if (!s || isNaN(s)) return "Indefinite";
  const now = Math.floor(Date.now() / 1000);
  const diff = s - now;
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h left`;
  const minutes = Math.floor((diff % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function isoLabel(isoStr = ""): string {
  if (!isoStr) return "Pending";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return isoStr;
  }
}
