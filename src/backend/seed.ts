import db, { initDb } from "./database.ts";
import { calculateAgriScore, getLoanRecommendation } from "./scoring.ts";
import { generateAgriScoreExplanation } from "./ai.ts";

export async function seedData() {
  initDb();
  
  const count = db.prepare("SELECT COUNT(*) as count FROM farmers").get().count;
  if (count > 0) return;

  console.log("Seeding initial farmer data...");

  const farmers = [
    // Very Creditworthy (>80)
    { name: "Rajesh Kumar", village: "Hapur", district: "Ghaziabad", state: "UP", daysAgo: 25, land: 8.5, ownership: "Owned", crop: "Wheat", irrigation: "Borewell", yield: 12, rainfall: 1000, drought: 0.05, flood: 0.05, income: 600000, loans: 50000, repayment: "Good", cibil: 820, priceVol: 0.1 },
    { name: "Suresh Patil", village: "Satara", district: "Pune", state: "Maharashtra", daysAgo: 1, land: 10.5, ownership: "Owned", crop: "Sugarcane", irrigation: "Canal", yield: 15, rainfall: 1200, drought: 0.02, flood: 0.1, income: 800000, loans: 100000, repayment: "Good", cibil: 790, priceVol: 0.05 },
    { name: "Amit Singh", village: "Bhiwani", district: "Hisar", state: "Haryana", daysAgo: 12, land: 12.0, ownership: "Owned", crop: "Cotton", irrigation: "Borewell", yield: 11, rainfall: 800, drought: 0.1, flood: 0.02, income: 750000, loans: 80000, repayment: "Good", cibil: 850, priceVol: 0.12 },
    
    // Low Risk (61-80)
    { name: "Sunita Devi", village: "Mandi", district: "Kullu", state: "HP", daysAgo: 18, land: 3.5, ownership: "Owned", crop: "Apples", irrigation: "Rainfed", yield: 8, rainfall: 1500, drought: 0.05, flood: 0.2, income: 350000, loans: 40000, repayment: "Good", cibil: 710, priceVol: 0.2 },
    { name: "Lakshmi Rao", village: "Guntur", district: "Amaravati", state: "AP", daysAgo: 5, land: 4.2, ownership: "Leased", crop: "Chilli", irrigation: "Borewell", yield: 7, rainfall: 900, drought: 0.15, flood: 0.05, income: 280000, loans: 60000, repayment: "Average", cibil: 680, priceVol: 0.25 },
    { name: "Manoj Tiwari", village: "Buxar", district: "Buxar", state: "Bihar", daysAgo: 8, land: 5.5, ownership: "Owned", crop: "Rice", irrigation: "Canal", yield: 9, rainfall: 1100, drought: 0.1, flood: 0.3, income: 420000, loans: 150000, repayment: "Good", cibil: 730, priceVol: 0.15 },
    
    // Moderate Risk (41-60)
    { name: "Ramesh Yadav", village: "Etawah", district: "Etawah", state: "UP", daysAgo: 15, land: 2.5, ownership: "Leased", crop: "Mustard", irrigation: "Rainfed", yield: 4, rainfall: 600, drought: 0.3, flood: 0.05, income: 180000, loans: 80000, repayment: "Average", cibil: 450, priceVol: 0.2 },
    { name: "Pooja Sharma", village: "Alwar", district: "Alwar", state: "Rajasthan", daysAgo: 20, land: 3.0, ownership: "Leased", crop: "Bajra", irrigation: "Rainfed", yield: 3, rainfall: 400, drought: 0.4, flood: 0.01, income: 150000, loans: 50000, repayment: "Average", cibil: 500, priceVol: 0.18 },
    
    // High Risk (<=40)
    { name: "Vikram Singh", village: "Barmer", district: "Barmer", state: "Rajasthan", daysAgo: 2, land: 1.5, ownership: "Leased", crop: "Guar", irrigation: "Rainfed", yield: 2, rainfall: 200, drought: 1.0, flood: 0.0, income: 50000, loans: 50000, repayment: "Poor", cibil: 300, priceVol: 0.5 },
    { name: "Anjali Gupta", village: "Kalahandi", district: "Kalahandi", state: "Odisha", daysAgo: 10, land: 1.2, ownership: "Leased", crop: "Paddy", irrigation: "Rainfed", yield: 2.5, rainfall: 1200, drought: 0.8, flood: 0.6, income: 50000, loans: 50000, repayment: "Poor", cibil: 300, priceVol: 0.4 },
    

    { name: "Abdul Hamid", village: "Pampore", district: "Pulwama", state: "Jammu & Kashmir", daysAgo: 1, land: 2.5, ownership: "Owned", crop: "Saffron", irrigation: "Rainfed", yield: 1.2, rainfall: 700, drought: 0.1, flood: 0.2, income: 450000, loans: 50000, repayment: "Good", cibil: 750, priceVol: 0.15 },
    { name: "Tariq Ahmad", village: "Sopore", district: "Baramulla", state: "Jammu & Kashmir", daysAgo: 2, land: 4.0, ownership: "Owned", crop: "Apple", irrigation: "Canal", yield: 12, rainfall: 800, drought: 0.05, flood: 0.1, income: 600000, loans: 120000, repayment: "Good", cibil: 780, priceVol: 0.1 },
    { name: "Ghulam Nabi", village: "Shopian", district: "Shopian", state: "Jammu & Kashmir", daysAgo: 3, land: 3.5, ownership: "Owned", crop: "Apple", irrigation: "Rainfed", yield: 10, rainfall: 750, drought: 0.08, flood: 0.15, income: 550000, loans: 100000, repayment: "Good", cibil: 760, priceVol: 0.12 },

    { name: "Mathew Varghese", village: "Munnar", district: "Idukki", state: "Kerala", daysAgo: 1, land: 4.0, ownership: "Owned", crop: "Tea", irrigation: "Rainfed", yield: 10, rainfall: 3000, drought: 0.01, flood: 0.8, income: 400000, loans: 100000, repayment: "Good", cibil: 750, priceVol: 0.1 },
    { name: "Joseph Kurian", village: "Kumarakom", district: "Kottayam", state: "Kerala", daysAgo: 2, land: 2.5, ownership: "Owned", crop: "Rubber", irrigation: "Rainfed", yield: 8, rainfall: 2800, drought: 0.02, flood: 0.7, income: 350000, loans: 80000, repayment: "Good", cibil: 720, priceVol: 0.15 },
    { name: "Thomas Chacko", village: "Wayanad", district: "Wayanad", state: "Kerala", daysAgo: 3, land: 3.0, ownership: "Leased", crop: "Coffee", irrigation: "Rainfed", yield: 9, rainfall: 3200, drought: 0.01, flood: 0.9, income: 300000, loans: 120000, repayment: "Average", cibil: 650, priceVol: 0.2 },
    { name: "Manoj K", village: "Kannur", district: "Kannur", state: "Kerala", daysAgo: 10, land: 3.2, ownership: "Owned", crop: "Coconut", irrigation: "Rainfed", yield: 8, rainfall: 3100, drought: 0.03, flood: 0.65, income: 280000, loans: 70000, repayment: "Good", cibil: 710, priceVol: 0.1 }
  ];

  for (const f of farmers) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - f.daysAgo);
    const dateStr = createdAt.toISOString();

    const farmerId = db.prepare(`
      INSERT INTO farmers (name, aadhaar_number, phone, village, district, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(f.name, "123456789012", "9876543210", f.village, f.district, f.state, dateStr).lastInsertRowid;

    db.prepare(`
      INSERT INTO land_details (farmer_id, latitude, longitude, land_size_acres, soil_type, ownership_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(farmerId, 28.6139 + (Math.random() - 0.5), 77.2090 + (Math.random() - 0.5), f.land, "Alluvial", f.ownership);

    db.prepare(`
      INSERT INTO crop_data (farmer_id, crop_type, farming_season, irrigation_type, avg_yield_last_3_seasons)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, f.crop, "Kharif", f.irrigation, f.yield);

    db.prepare(`
      INSERT INTO weather_data (farmer_id, historical_rainfall, drought_probability, flood_risk, seasonal_rainfall_pattern)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, f.rainfall, f.drought, f.flood, "Stable");

    db.prepare(`
      INSERT INTO market_data (farmer_id, avg_crop_price, price_volatility)
      VALUES (?, ?, ?)
    `).run(farmerId, 2000, f.priceVol);

    db.prepare(`
      INSERT INTO financial_data (farmer_id, annual_income, existing_loans, repayment_history, assets_owned)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, f.income, f.loans, f.repayment, "Tractor, Cattle");

    db.prepare(`
      INSERT INTO credit_data (farmer_id, cibil_score, cooperative_bank_loans, microfinance_loans)
      VALUES (?, ?, ?, ?)
    `).run(farmerId, f.cibil, 0, 0);

    // Calculate score
    const scoringInput = {
      land: { land_size_acres: f.land, soil_type: "Alluvial", ownership_status: f.ownership },
      weather: { historical_rainfall: f.rainfall, drought_probability: f.drought, flood_risk: f.flood },
      crop: { irrigation_type: f.irrigation, avg_yield_last_3_seasons: f.yield },
      market: { price_volatility: f.priceVol },
      financial: { annual_income: f.income, existing_loans: f.loans, repayment_history: f.repayment },
      credit: { cibil_score: f.cibil }
    };
    
    const { score, riskCategory, breakdown } = calculateAgriScore(scoringInput);
    
    // Generate real explanation for seeded data
    let explanation = `
### AgriScore Assessment Summary
${f.name} has been assigned a score of **${score}/100** (${riskCategory}). This score reflects a comprehensive analysis of their agronomic practices, financial stability, and environmental risk factors.

#### Key Strengths
${f.repayment === 'Good' ? '* **Financial Discipline:** A strong repayment history indicates high reliability.' : '* **Active Financial Profile:** The farmer has an active financial history.'}
${f.ownership === 'Owned' ? '* **Land Ownership:** Full ownership of the land provides strong collateral value.' : '* **Land Access:** Has access to land for cultivation.'}
${f.yield > 5 ? '* **Consistent Yields:** The farmer has demonstrated stable crop yields.' : ''}
${f.cibil >= 700 ? '* **Good Credit History:** A strong CIBIL score of ' + f.cibil + ' shows good creditworthiness.' : ''}

#### Key Risks
${f.irrigation === 'Rainfed' ? '* **Climate Vulnerability:** High dependence on rainfed irrigation makes the farm susceptible to erratic monsoon patterns.' : ''}
${f.drought >= 0.3 ? '* **Drought Risk:** High probability of drought (' + (f.drought * 100) + '%) in the region.' : ''}
${f.flood >= 0.3 ? '* **Flood Risk:** High probability of flooding (' + (f.flood * 100) + '%) in the region.' : ''}
${f.repayment === 'Poor' ? '* **Repayment History:** Poor past repayment history is a significant risk factor.' : ''}
${f.cibil < 500 ? '* **Low Credit Score:** A low CIBIL score (' + f.cibil + ') indicates past credit issues.' : ''}
${f.priceVol >= 0.2 ? '* **Market Volatility:** The primary crop (' + f.crop + ') is subject to high price fluctuations.' : ''}

#### Recommendations for Improvement
${f.irrigation === 'Rainfed' ? '1. **Adopt Micro-Irrigation:** Transitioning to drip or sprinkler irrigation could improve water efficiency and reduce climate risk.\n' : ''}${f.cibil < 700 ? '2. **Improve Credit Score:** Timely repayment of existing small loans can help build a better credit profile.\n' : ''}3. **Crop Diversification:** Introducing a secondary cash crop could stabilize income against market volatility.
`.replace(/^\s*[\r\n]/gm, '');
    try {
      const aiExplanation = await generateAgriScoreExplanation(scoringInput, score, riskCategory);
      if (aiExplanation && aiExplanation.length > 50) {
        explanation = aiExplanation;
      }
    } catch (e) {
      console.error("Failed to generate seed explanation:", e);
    }

    db.prepare(`
      INSERT INTO agri_scores (farmer_id, score, risk_category, explanation, breakdown, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(farmerId, score, riskCategory, explanation, JSON.stringify(breakdown), dateStr);

    const recommendation = getLoanRecommendation(score, f.land, f.income);
    db.prepare(`
      INSERT INTO loan_recommendations (farmer_id, recommended_amount, interest_rate, tenure_months)
      VALUES (?, ?, ?, ?)
    `).run(farmerId, recommendation.recommendedAmount, recommendation.interestRate, recommendation.tenureMonths);
  }
  console.log("Seeding complete.");

  // Migration: Update existing placeholder explanations
  const placeholders = db.prepare("SELECT farmer_id, score, risk_category FROM agri_scores WHERE explanation = 'Initial seed score.'").all();
  if (placeholders.length > 0) {
    console.log(`Updating ${placeholders.length} placeholder explanations...`);
    for (const row of placeholders as any[]) {
      const farmerId = row.farmer_id;
      const land = db.prepare("SELECT * FROM land_details WHERE farmer_id = ?").get(farmerId);
      const crop = db.prepare("SELECT * FROM crop_data WHERE farmer_id = ?").get(farmerId);
      const weather = db.prepare("SELECT * FROM weather_data WHERE farmer_id = ?").get(farmerId);
      const market = db.prepare("SELECT * FROM market_data WHERE farmer_id = ?").get(farmerId);
      const financial = db.prepare("SELECT * FROM financial_data WHERE farmer_id = ?").get(farmerId);
      const credit = db.prepare("SELECT * FROM credit_data WHERE farmer_id = ?").get(farmerId);
      
      const scoringInput = { land, crop, weather, market, financial, credit };
      try {
        const explanation = await generateAgriScoreExplanation(scoringInput, row.score, row.risk_category);
        db.prepare("UPDATE agri_scores SET explanation = ? WHERE farmer_id = ?").run(explanation, farmerId);
      } catch (e) {
        console.error(`Failed to update explanation for farmer ${farmerId}:`, e);
      }
    }
    console.log("Migration complete.");
  }
}
