export const calculateCEI = (
  beginningAR: number,
  creditSales: number,
  endingTotalAR: number,
  endingCurrentAR: number
): number => {
  const numerator = beginningAR + creditSales - endingTotalAR;
  const denominator = beginningAR + creditSales - endingCurrentAR;

  if (denominator <= 0) return 0;

  const cei = (numerator / denominator) * 100;

  return Math.max(0, Math.min(100, parseFloat(cei.toFixed(1))));
};