// Returns "FY 2025" for same year or "FY 2024-25" for different years
export const generateYearName = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): string => {
  if (!startDate || !endDate) return "";

  try {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      return `FY ${startYear}`;
    }

    const endYearAbbr = endYear.toString().slice(-2);
    return `FY ${startYear}-${endYearAbbr}`;
  } catch (error) {
    console.error("Error generating year name:", error);
    return "";
  }
};
