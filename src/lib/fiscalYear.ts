export function fiscalYearStartYear(timestamp: number): number {
  const date = new Date(timestamp);
  const isAfterFiscalYearStart =
    date.getMonth() > 6 || (date.getMonth() === 6 && date.getDate() >= 16);
  return date.getFullYear() - (isAfterFiscalYearStart ? 0 : 1);
}

export function fiscalYearLabel(startYear: number): string {
  const year = startYear + 57;
  return `${year}/${String((year + 1) % 100).padStart(2, "0")}`;
}
