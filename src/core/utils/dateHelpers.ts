export const getDateRanges = () => {
  const format = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const now = new Date();

  const today = format(now);

  // 🔹 Current Month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // 🔹 Last Month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // 🔹 Financial Year (India: Apr → Mar)
  let fyStart: Date;
  let fyEnd: Date;

  if (now.getMonth() >= 3) {
    // April (3) to December
    fyStart = new Date(now.getFullYear(), 3, 1); // Apr 1
    fyEnd = new Date(now.getFullYear() + 1, 2, 31); // Mar 31 next year
  } else {
    // Jan–Mar
    fyStart = new Date(now.getFullYear() - 1, 3, 1);
    fyEnd = new Date(now.getFullYear(), 2, 31);
  }

  // 🔹 Previous Financial Year
  const prevFyStart = new Date(fyStart.getFullYear() - 1, 3, 1);
  const prevFyEnd = new Date(fyEnd.getFullYear() - 1, 2, 31);

  return {
    today,
    currentMonth: {
      from_date: format(currentMonthStart),
      to_date: format(currentMonthEnd),
    },
    lastMonth: {
      from_date: format(lastMonthStart),
      to_date: format(lastMonthEnd),
    },
    financialYear: {
      from_date: format(fyStart),
      to_date: format(fyEnd),
    },
    prevFinancialYear: {
      from_date: format(prevFyStart),
      to_date: format(prevFyEnd),
    },
  };
};
