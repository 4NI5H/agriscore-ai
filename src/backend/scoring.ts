export interface ScoringInput {
  land: {
    land_size_acres: number;
    soil_type: string;
    ownership_status: string;
  };
  weather: {
    historical_rainfall: number;
    drought_probability: number;
    flood_risk: number;
  };
  crop: {
    irrigation_type: string;
    avg_yield_last_3_seasons: number;
  };
  market: {
    price_volatility: number;
  };
  financial: {
    annual_income: number;
    existing_loans: number;
    repayment_history: string;
  };
  credit: {
    cibil_score: number;
  };
}

export function calculateAgriScore(input: ScoringInput) {
  let score = 0;

  // Land Stability - 20%
  let landScore = 0;
  if (input.land.ownership_status === 'Owned') landScore += 10;
  else landScore += 5;
  if (input.land.land_size_acres > 5) landScore += 10;
  else if (input.land.land_size_acres > 2) landScore += 7;
  else landScore += 4;
  score += (landScore / 20) * 20;

  // Weather Risk - 15%
  let weatherScore = 15;
  weatherScore -= (input.weather.drought_probability * 10);
  weatherScore -= (input.weather.flood_risk * 5);
  score += Math.max(0, weatherScore);

  // Crop Yield Productivity - 20%
  let cropScore = 0;
  if (input.crop.irrigation_type === 'Borewell' || input.crop.irrigation_type === 'Canal') cropScore += 10;
  else cropScore += 5;
  if (input.crop.avg_yield_last_3_seasons > 10) cropScore += 10;
  else if (input.crop.avg_yield_last_3_seasons > 5) cropScore += 7;
  else cropScore += 4;
  score += (cropScore / 20) * 20;

  // Market Stability - 10%
  let marketScore = 10 - (input.market.price_volatility * 10);
  score += Math.max(0, marketScore);

  // Farmer Financial Health - 25%
  let financialScore = 0;
  if (input.financial.annual_income > 500000) financialScore += 10;
  else if (input.financial.annual_income > 200000) financialScore += 7;
  else financialScore += 4;
  
  const debtToIncome = input.financial.existing_loans / (input.financial.annual_income || 1);
  if (debtToIncome < 0.2) financialScore += 10;
  else if (debtToIncome < 0.5) financialScore += 7;
  else financialScore += 3;

  if (input.financial.repayment_history === 'Good') financialScore += 5;
  else if (input.financial.repayment_history === 'Average') financialScore += 3;
  else financialScore += 0;
  score += (financialScore / 25) * 25;

  // Credit History - 10%
  let creditScore = (input.credit.cibil_score / 900) * 10;
  score += creditScore;

  // Final Score Normalization
  score = Math.round(Math.min(100, Math.max(0, score)));

  let riskCategory = '';
  if (score <= 40) riskCategory = 'High Risk';
  else if (score <= 60) riskCategory = 'Moderate Risk';
  else if (score <= 80) riskCategory = 'Low Risk';
  else riskCategory = 'Very Creditworthy';

  return {
    score,
    riskCategory,
    breakdown: {
      land: Math.round((landScore / 20) * 20),
      weather: Math.round(Math.max(0, weatherScore)),
      crop: Math.round((cropScore / 20) * 20),
      market: Math.round(Math.max(0, marketScore)),
      financial: Math.round((financialScore / 25) * 25),
      credit: Math.round(creditScore)
    }
  };
}

export function getLoanRecommendation(score: number, landSize: number, annualIncome: number) {
  let recommendedAmount = 0;
  let interestRate = 12;
  let tenureMonths = 12;

  if (score > 80) {
    recommendedAmount = annualIncome * 0.8;
    interestRate = 9;
    tenureMonths = 36;
  } else if (score > 60) {
    recommendedAmount = annualIncome * 0.5;
    interestRate = 11;
    tenureMonths = 24;
  } else if (score > 40) {
    recommendedAmount = annualIncome * 0.3;
    interestRate = 14;
    tenureMonths = 12;
  } else {
    recommendedAmount = 0;
    interestRate = 18;
    tenureMonths = 6;
  }

  // Cap based on land size (e.g., max 50k per acre)
  const landCap = landSize * 50000;
  recommendedAmount = Math.min(recommendedAmount, landCap);

  return {
    recommendedAmount: Math.round(recommendedAmount),
    interestRate,
    tenureMonths
  };
}
