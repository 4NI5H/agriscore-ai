import express from "express";
import { createServer as createViteServer } from "vite";
import db, { initDb } from "./src/backend/database.ts";
import { seedData } from "./src/backend/seed.ts";
import { calculateAgriScore, getLoanRecommendation } from "./src/backend/scoring.ts";
import { generateAgriScoreExplanation, generateMacroClimateAlert } from "./src/backend/ai.ts";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;


  app.use(express.json());

  // Initialize DB and Seed
  initDb();
  await seedData();

  // API Routes
  app.get("/api/farmers", (req, res) => {
    const farmers = db.prepare(`
      SELECT f.*, s.score, s.risk_category 
      FROM farmers f 
      LEFT JOIN agri_scores s ON f.id = s.farmer_id 
      ORDER BY f.created_at DESC
    `).all();
    res.json(farmers);
  });

  app.post("/api/farmers", (req, res) => {
    const { farmer, land, crop, weather, market, financial, credit } = req.body;
    
    const insertFarmer = db.prepare(`
      INSERT INTO farmers (name, aadhaar_number, phone, village, district, state)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertFarmer.run(
      farmer.name, farmer.aadhaar_number, farmer.phone, 
      farmer.village, farmer.district, farmer.state
    );
    const farmerId = result.lastInsertRowid;

    db.prepare(`
      INSERT INTO land_details (farmer_id, latitude, longitude, land_size_acres, soil_type, ownership_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(farmerId, land.latitude, land.longitude, land.land_size_acres, land.soil_type, land.ownership_status);

    db.prepare(`
      INSERT INTO crop_data (farmer_id, crop_type, farming_season, irrigation_type, avg_yield_last_3_seasons)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, crop.crop_type, crop.farming_season, crop.irrigation_type, crop.avg_yield_last_3_seasons);

    db.prepare(`
      INSERT INTO weather_data (farmer_id, historical_rainfall, drought_probability, flood_risk, seasonal_rainfall_pattern)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, weather.historical_rainfall, weather.drought_probability, weather.flood_risk, weather.seasonal_rainfall_pattern);

    db.prepare(`
      INSERT INTO market_data (farmer_id, avg_crop_price, price_volatility)
      VALUES (?, ?, ?)
    `).run(farmerId, market.avg_crop_price, market.price_volatility);

    db.prepare(`
      INSERT INTO financial_data (farmer_id, annual_income, existing_loans, repayment_history, assets_owned)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, financial.annual_income, financial.existing_loans, financial.repayment_history, financial.assets_owned);

    db.prepare(`
      INSERT INTO credit_data (farmer_id, cibil_score, cooperative_bank_loans, microfinance_loans)
      VALUES (?, ?, ?, ?)
    `).run(farmerId, credit.cibil_score, credit.cooperative_bank_loans, credit.microfinance_loans);

    res.json({ id: farmerId });
  });

  app.get("/api/farmers/:id", (req, res) => {
    const farmerId = req.params.id;
    const farmer = db.prepare("SELECT * FROM farmers WHERE id = ?").get(farmerId);
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });

    const land = db.prepare("SELECT * FROM land_details WHERE farmer_id = ?").get(farmerId);
    const crop = db.prepare("SELECT * FROM crop_data WHERE farmer_id = ?").get(farmerId);
    const weather = db.prepare("SELECT * FROM weather_data WHERE farmer_id = ?").get(farmerId);
    const market = db.prepare("SELECT * FROM market_data WHERE farmer_id = ?").get(farmerId);
    const financial = db.prepare("SELECT * FROM financial_data WHERE farmer_id = ?").get(farmerId);
    const credit = db.prepare("SELECT * FROM credit_data WHERE farmer_id = ?").get(farmerId);
    const score = db.prepare("SELECT * FROM agri_scores WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 1").get(farmerId) as any;
    if (score && score.breakdown) {
      score.breakdown = JSON.parse(score.breakdown);
    }
    const recommendation = db.prepare("SELECT * FROM loan_recommendations WHERE farmer_id = ?").get(farmerId);

    res.json({ farmer, land, crop, weather, market, financial, credit, score, recommendation });
  });

  app.delete("/api/farmers/:id", (req, res) => {
    const farmerId = req.params.id;
    
    // Use a transaction to ensure all related records are deleted
    const deleteTransaction = db.transaction(() => {
      db.prepare("DELETE FROM land_details WHERE farmer_id = ?").run(farmerId);
      db.prepare("DELETE FROM crop_data WHERE farmer_id = ?").run(farmerId);
      db.prepare("DELETE FROM weather_data WHERE farmer_id = ?").run(farmerId);
      db.prepare("DELETE FROM market_data WHERE farmer_id = ?").run(farmerId);
      db.prepare("DELETE FROM financial_data WHERE farmer_id = ?").run(farmerId);
      db.prepare("DELETE FROM credit_data WHERE farmer_id = ?").run(farmerId);
      db.prepare("DELETE FROM agri_scores WHERE farmer_id = ?").run(farmerId);
      db.prepare("DELETE FROM loan_recommendations WHERE farmer_id = ?").run(farmerId);
      db.prepare("DELETE FROM farmers WHERE id = ?").run(farmerId);
    });

    try {
      deleteTransaction();
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting farmer:", error);
      res.status(500).json({ error: "Failed to delete farmer" });
    }
  });

  app.post("/api/farmers/:id/score", async (req, res) => {
    const farmerId = req.params.id;
    const farmerData = db.prepare("SELECT * FROM farmers WHERE id = ?").get(farmerId);
    if (!farmerData) return res.status(404).json({ error: "Farmer not found" });

    const land = db.prepare("SELECT * FROM land_details WHERE farmer_id = ?").get(farmerId);
    const crop = db.prepare("SELECT * FROM crop_data WHERE farmer_id = ?").get(farmerId);
    const weather = db.prepare("SELECT * FROM weather_data WHERE farmer_id = ?").get(farmerId);
    const market = db.prepare("SELECT * FROM market_data WHERE farmer_id = ?").get(farmerId);
    const financial = db.prepare("SELECT * FROM financial_data WHERE farmer_id = ?").get(farmerId);
    const credit = db.prepare("SELECT * FROM credit_data WHERE farmer_id = ?").get(farmerId);

    const scoringInput = { land, crop, weather, market, financial, credit };
    const { score, riskCategory, breakdown } = calculateAgriScore(scoringInput);
    
    // Generate AI explanation
    const explanation = await generateAgriScoreExplanation(scoringInput, score, riskCategory);

    // Save score
    db.prepare(`
      INSERT INTO agri_scores (farmer_id, score, risk_category, explanation, breakdown)
      VALUES (?, ?, ?, ?, ?)
    `).run(farmerId, score, riskCategory, explanation, JSON.stringify(breakdown));

    // Generate recommendation
    const recommendation = getLoanRecommendation(score, land.land_size_acres, financial.annual_income);
    
    db.prepare(`
      INSERT INTO loan_recommendations (farmer_id, recommended_amount, interest_rate, tenure_months)
      VALUES (?, ?, ?, ?)
    `).run(farmerId, recommendation.recommendedAmount, recommendation.interestRate, recommendation.tenureMonths);

    res.json({ score, riskCategory, breakdown, explanation, recommendation });
  });

  app.get("/api/dashboard", (req, res) => {
    const totalFarmers = db.prepare("SELECT COUNT(*) as count FROM farmers").get().count;
    const avgScore = db.prepare("SELECT AVG(score) as avg FROM agri_scores").get().avg || 0;
    const riskDistribution = db.prepare(`
      SELECT risk_category, COUNT(*) as count 
      FROM agri_scores 
      GROUP BY risk_category
    `).all();
    
    const recentScores = db.prepare(`
      SELECT f.name, s.score, s.risk_category, s.created_at
      FROM agri_scores s
      JOIN farmers f ON s.farmer_id = f.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `).all();

    const dailyTrends = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count, AVG(score) as avg_score
      FROM agri_scores
      WHERE created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();

    res.json({ 
      totalFarmers, 
      avgScore: Math.round(avgScore), 
      riskDistribution, 
      recentScores,
      dailyTrends 
    });
  });

  app.get("/api/weather", async (req, res) => {
    try {
      const state = req.query.state as string;
      if (!state) {
        return res.status(400).json({ error: "State is required" });
      }

      // Map "Jammu & Kashmir" to "Jammu" for better geocoding results
      const searchState = state === "Jammu & Kashmir" ? "Jammu" : state;

      // 1. Geocode the state using Open-Meteo
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchState)}&count=1&format=json`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        return res.json({
           title: `Climate Monitoring: ${state}`,
           description: `Unable to fetch real-time data for ${state}.`,
           impact: `Monitoring standard conditions.`,
           action: "Continue standard monitoring.",
           type: "info"
        });
      }

      const { latitude, longitude } = geoData.results[0];
      const name = state; // Use the original state name for display

      // 2. Fetch weather forecast (7 days)
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_sum&timezone=auto`);
      const weatherData = await weatherRes.json();

      if (!weatherData.daily) {
         throw new Error("Invalid weather data");
      }

      const maxTemps = weatherData.daily.temperature_2m_max;
      const precipitations = weatherData.daily.precipitation_sum;

      const maxTemp = Math.max(...maxTemps);
      const totalPrecip = precipitations.reduce((a: number, b: number) => a + b, 0);

      // 3. Analyze and create alert using AI
      let alert = null;
      try {
        alert = await generateMacroClimateAlert(name, maxTemp, totalPrecip);
      } catch (aiError) {
        console.error("AI Alert Generation Error:", aiError);
      }
      
      if (!alert) {
        console.log("Using fallback alert for", name);
        // Fallback if AI fails
        alert = {
          title: `Stable Climate: ${name}`,
          description: `Stable weather patterns expected for the next 7 days. Max temp: ${maxTemp}°C, Total rain: ${totalPrecip.toFixed(1)}mm.`,
          impact: `Optimal growing conditions for farmers in this region.`,
          action: "Continue standard monitoring and support.",
          type: "success",
          debug_error: "AI failed to generate alert"
        };

        if (totalPrecip > 100) {
          alert = {
            title: `Heavy Rainfall Alert: ${name}`,
            description: `High precipitation (${totalPrecip.toFixed(1)}mm) expected over the next 7 days.`,
            impact: `Potential waterlogging in low-lying areas affecting crop yields.`,
            action: "Advise early harvesting or improved drainage systems.",
            type: "warning"
          };
        } else if (maxTemp > 38 && totalPrecip < 10) {
          alert = {
            title: `Heatwave & Dry Spell Warning: ${name}`,
            description: `Extreme temperatures up to ${maxTemp}°C with minimal rain expected.`,
            impact: `Water scarcity and heat stress may severely impact crop yields.`,
            action: "Proactively offer drought-resistant crop insurance or restructure upcoming repayment cycles.",
            type: "danger"
          };
        } else if (maxTemp > 35) {
           alert = {
            title: `High Temperature Alert: ${name}`,
            description: `Temperatures reaching ${maxTemp}°C expected.`,
            impact: `Increased water requirement for crops.`,
            action: "Advise farmers on optimal irrigation schedules.",
            type: "warning"
          };
        }
      }

      res.json(alert);
    } catch (error) {
      console.error("Weather API Error:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  app.get("/api/weather/portfolio", async (req, res) => {
    try {
      // District-first targeting: if we have district, use it; otherwise don't attempt location targeting.
      // We keep state alongside district only to disambiguate geocoding.
      const districtRows = db
        .prepare(
          `
          SELECT DISTINCT district, state
          FROM farmers
          WHERE district IS NOT NULL AND TRIM(district) <> ''
        `
        )
        .all() as any[];

      const districts = districtRows
        .map((r) => ({
          district: String(r.district),
          state: r.state ? String(r.state) : ""
        }))
        .filter((r) => r.district && r.district.trim().length > 0);

      if (districts.length === 0) {
        return res.json({
          alert: {
            title: "Stable Climate Conditions",
            description: "No district data available for targeting; defaulting to safe monitoring.",
            impact: "All regions appear stable; no farmer profiles are flagged as impacted.",
            action: "Continue standard monitoring and ensure district is captured for better targeting.",
            type: "success",
            affectedStates: []
          },
          affectedFarmers: [],
          stateForecasts: []
        });
      }

      // Build forecasts for each district (7 days), using the same geocode+forecast flow as /api/weather
      const stateForecasts = await Promise.all(
        districts.map(async ({ district, state }) => {
          const regionLabel = state ? `${district}, ${state}` : district;
          const geoQuery = state ? `${district}, ${state}, India` : `${district}, India`;

          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(geoQuery)}&count=1&format=json`
          );
          const geoData = await geoRes.json();
          if (!geoData.results || geoData.results.length === 0) {
            return { state: regionLabel, ok: false, reason: "geocode_failed" as const };
          }

          const { latitude, longitude } = geoData.results[0];
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_sum&timezone=auto`
          );
          const weatherData = await weatherRes.json();
          if (!weatherData.daily) {
            return { state: regionLabel, ok: false, reason: "weather_failed" as const };
          }

          const maxTemps = weatherData.daily.temperature_2m_max;
          const precipitations = weatherData.daily.precipitation_sum;
          const maxTemp = Math.max(...maxTemps);
          const totalPrecip = precipitations.reduce((a: number, b: number) => a + b, 0);

          return { state: regionLabel, ok: true, maxTemp, totalPrecip };
        })
      );

      const okForecasts = stateForecasts.filter((s: any) => s.ok) as any[];
      if (okForecasts.length === 0) {
        return res.json({
          alert: {
            title: "Climate Monitoring",
            description: "Unable to fetch forecasts for portfolio states.",
            impact: "Monitoring standard conditions.",
            action: "Continue standard monitoring.",
            type: "info",
            affectedStates: []
          },
          affectedFarmers: [],
          stateForecasts
        });
      }

      // Ask AI for a portfolio-wide alert + which regions (district/state combos) are impacted
      let alert: any = null;
      try {
        alert = await generateMacroClimateAlert(
          okForecasts.map((s: any) => ({
            state: s.state,
            maxTemp: s.maxTemp,
            totalPrecip: s.totalPrecip
          }))
        );
      } catch (aiError) {
        console.error("AI Portfolio Alert Generation Error:", aiError);
      }

      // Fallback impacted regions if AI fails or omits affectedStates
      const fallbackAffectedStates = okForecasts
        .filter((s: any) => s.totalPrecip > 100 || (s.maxTemp > 35 && s.totalPrecip < 10) || s.maxTemp > 38)
        .map((s: any) => s.state);

      if (!alert) {
        alert = {
          title: "Portfolio Climate Monitoring",
          description: "Portfolio-wide climate assessment generated using forecast heuristics (AI unavailable).",
          impact: "Some regions may face near-term weather stress.",
          action: "Prioritize outreach and monitoring for affected regions.",
          type: fallbackAffectedStates.length > 0 ? "warning" : "success",
          affectedStates: fallbackAffectedStates
        };
      }

      const affectedStates: string[] = Array.isArray(alert.affectedStates)
        ? alert.affectedStates.map((s: any) => String(s)).filter(Boolean)
        : fallbackAffectedStates;

      // If nothing is impacted, force a clean "all safe" response
      if (affectedStates.length === 0) {
        alert = {
          title: "Stable Climate Conditions",
          description: "No significant near-term climate risks detected across your portfolio states.",
          impact: "All regions appear stable; no farmer profiles are flagged as impacted.",
          action: "Continue standard monitoring and outreach.",
          type: "success",
          affectedStates: []
        };
      }

      // Fetch affected farmers across all affected states
      let affectedFarmers: any[] = [];
      if (affectedStates.length > 0) {
        // affectedStates here are region labels like "Pune, Maharashtra" or "Pune"
        const affectedDistricts = affectedStates
          .map((label) => String(label).split(",")[0].trim())
          .filter(Boolean);

        if (affectedDistricts.length > 0) {
          const placeholders = affectedDistricts.map(() => "?").join(",");
          affectedFarmers = db
            .prepare(
              `
              SELECT id, name, phone, village, district, state
              FROM farmers
              WHERE district IN (${placeholders})
              ORDER BY created_at DESC
            `
            )
            .all(...affectedDistricts) as any[];
        }
      }

      res.json({
        alert,
        affectedFarmers,
        stateForecasts
      });
    } catch (error) {
      console.error("Weather Portfolio API Error:", error);
      res.status(500).json({ error: "Failed to fetch portfolio weather data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
