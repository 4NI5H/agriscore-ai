import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type ClimateForecastInput = { state: string; maxTemp: number; totalPrecip: number };

export async function generateMacroClimateAlert(state: string, maxTemp: number, totalPrecip: number): Promise<any>;
export async function generateMacroClimateAlert(inputs: ClimateForecastInput[]): Promise<any>;
export async function generateMacroClimateAlert(
  arg1: string | ClimateForecastInput[],
  arg2?: number,
  arg3?: number
) {
  const isMulti = Array.isArray(arg1);

  const prompt = isMulti
    ? `
    You are an AI Climate Risk Analyst for an agricultural lending platform.
    Analyze the following 7-day weather forecasts for multiple Indian regions (district/state combos), and produce a portfolio-wide macro climate alert.

    Forecasts (per region):
    ${arg1
      .map(
        (s) =>
          `- ${s.state}: Max Temp ${Number(s.maxTemp).toFixed(1)}°C, Total Precip ${Number(s.totalPrecip).toFixed(1)}mm`
      )
      .join("\n")}

    Use Google Search to find the latest real-time news about weather alerts, disturbances (like Western Disturbances), or climate events currently affecting any of these regions.

    Goals:
    - Identify which regions are likely impacted by near-term climate risk.
    - Summarize the dominant pattern(s) (heatwave, heavy rainfall, dry spell, WD, cyclone, etc).

    Provide the response in JSON format matching this schema:
    {
      "title": "Short, punchy title (e.g., Portfolio Climate Watch: Heat Stress)",
      "description": "Brief description of the macro pattern, incorporating real-time news.",
      "impact": "Potential impact on crops and farmers across impacted regions.",
      "action": "Recommended action for the lending platform or farmers.",
      "type": "success" | "warning" | "danger" | "info",
      "affectedStates": ["Region A", "Region B"]
    }

    Rules:
    - Set "affectedStates" to only the regions meaningfully impacted (avoid listing all).
    - Use "success" for stable/good weather across most regions, "warning" for moderate risks, and "danger" for severe risks.

    IMPORTANT: Return ONLY the raw JSON object. Do NOT wrap the response in \`\`\`json code blocks. Do not include any other text.
  `
    : `
    You are an AI Climate Risk Analyst for an agricultural lending platform.
    Analyze the following 7-day weather forecast for the state of ${arg1}:
    - Maximum Temperature: ${Number(arg2).toFixed(1)}°C
    - Total Precipitation: ${Number(arg3).toFixed(1)}mm

    Also, use Google Search to find the latest real-time news about weather alerts, disturbances (like Western Disturbances), or climate events currently affecting ${arg1}.

    Generate a macro-climate alert or any other factor which can affect the agricultural portfolio in this region based on both the forecast and the real-time news.
    Provide the response in JSON format matching this schema:
    {
      "title": "Short, punchy title (e.g., Heavy Rainfall Alert: Kerala)",
      "description": "Brief description of the weather pattern, incorporating any real-time news alerts.",
      "impact": "Potential impact on crops and farmers.",
      "action": "Recommended action for the lending platform or farmers.",
      "type": "success" | "warning" | "danger" | "info"
    }
    
    Use "success" for stable/good weather, "warning" for moderate risks (e.g., high rain, high heat), and "danger" for severe risks (e.g., extreme heatwave, flooding, or active Western Disturbance alerts).
    
    IMPORTANT: Return ONLY the raw JSON object. Do NOT wrap the response in \`\`\`json code blocks. Do not include any other text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });
    
    let text = response.text;
    if (text) {
      // Find the first '{' and last '}' to extract just the JSON object
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        text = text.substring(start, end + 1);
        return JSON.parse(text);
      }
    }
  } catch (error) {
    console.error("Error generating climate alert:", error);
  }
  
  return null;
}

export async function generateAgriScoreExplanation(input: any, score: number, riskCategory: string) {
  const prompt = `
    You are an AI Credit Analyst for AgriScore, a fintech platform for farmers.
    Based on the following farmer data, explain why they received an AgriScore of ${score}/100 (${riskCategory}).
    
    Farmer Data:
    - Land Size: ${input.land.land_size_acres} acres
    - Soil Type: ${input.land.soil_type}
    - Ownership: ${input.land.ownership_status}
    - Historical Rainfall: ${input.weather.historical_rainfall} mm
    - Drought Probability: ${input.weather.drought_probability}
    - Flood Risk: ${input.weather.flood_risk}
    - Irrigation Type: ${input.crop.irrigation_type}
    - Avg Yield: ${input.crop.avg_yield_last_3_seasons} units/acre
    - Price Volatility: ${input.market.price_volatility}
    - Annual Income: ₹${input.financial.annual_income}
    - Existing Loans: ₹${input.financial.existing_loans}
    - Repayment History: ${input.financial.repayment_history}
    - CIBIL Score: ${input.credit.cibil_score}

    Provide a structured report in Markdown format including:
    1. Summary of why the score was given.
    2. Key strengths.
    3. Key risks.
    4. Suggested improvements for the farmer to improve their creditworthiness.
    
    IMPORTANT: Return ONLY the raw markdown text. Do NOT wrap the response in \`\`\`markdown code blocks.
    Keep it professional, concise, and empathetic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text?.replace(/```markdown\n/gi, '').replace(/```\n?/g, '').trim() || "No explanation generated.";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "Unable to generate AI explanation at this time.";
  }
}
