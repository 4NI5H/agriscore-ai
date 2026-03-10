import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(process.env.DB_PATH || 'agriscore.db');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS farmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      aadhaar_number TEXT,
      phone TEXT,
      village TEXT,
      district TEXT,
      state TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS land_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER REFERENCES farmers(id),
      latitude REAL,
      longitude REAL,
      land_size_acres REAL,
      soil_type TEXT,
      ownership_status TEXT
    );

    CREATE TABLE IF NOT EXISTS crop_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER REFERENCES farmers(id),
      crop_type TEXT,
      farming_season TEXT,
      irrigation_type TEXT,
      avg_yield_last_3_seasons REAL
    );

    CREATE TABLE IF NOT EXISTS weather_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER REFERENCES farmers(id),
      historical_rainfall REAL,
      drought_probability REAL,
      flood_risk REAL,
      seasonal_rainfall_pattern TEXT
    );

    CREATE TABLE IF NOT EXISTS market_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER REFERENCES farmers(id),
      avg_crop_price REAL,
      price_volatility REAL
    );

    CREATE TABLE IF NOT EXISTS financial_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER REFERENCES farmers(id),
      annual_income REAL,
      existing_loans REAL,
      repayment_history TEXT,
      assets_owned TEXT
    );

    CREATE TABLE IF NOT EXISTS credit_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER REFERENCES farmers(id),
      cibil_score INTEGER,
      cooperative_bank_loans REAL,
      microfinance_loans REAL
    );

    CREATE TABLE IF NOT EXISTS agri_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER REFERENCES farmers(id),
      score REAL,
      risk_category TEXT,
      explanation TEXT,
      breakdown TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS loan_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farmer_id INTEGER REFERENCES farmers(id),
      recommended_amount REAL,
      interest_rate REAL,
      tenure_months INTEGER
    );
  `);
}

export default db;
