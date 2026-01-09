import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering and disable Vercel Data Cache
// This prevents stale cached responses from causing client errors
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// FRED API integration for macroeconomic data
// Documentation: https://fred.stlouisfed.org/docs/api/fred/

// Key FRED series IDs for ALM
const FRED_SERIES = {
  // Interest Rates
  FEDFUNDS: 'FEDFUNDS',           // Federal Funds Effective Rate
  DGS10: 'DGS10',                 // 10-Year Treasury Constant Maturity Rate
  DGS2: 'DGS2',                   // 2-Year Treasury Constant Maturity Rate
  DGS30: 'DGS30',                 // 30-Year Treasury Constant Maturity Rate
  DGS5: 'DGS5',                   // 5-Year Treasury Constant Maturity Rate
  DGS1: 'DGS1',                   // 1-Year Treasury Constant Maturity Rate
  DGS3MO: 'DGS3MO',               // 3-Month Treasury Constant Maturity Rate
  T10Y2Y: 'T10Y2Y',               // 10-Year Treasury Minus 2-Year Treasury
  T10Y3M: 'T10Y3M',               // 10-Year Treasury Minus 3-Month Treasury

  // Economic Indicators
  UNRATE: 'UNRATE',               // Unemployment Rate
  CPIAUCSL: 'CPIAUCSL',           // Consumer Price Index
  PCEPI: 'PCEPI',                 // PCE Price Index
  GDP: 'GDP',                     // Gross Domestic Product
  GDPC1: 'GDPC1',                 // Real GDP

  // Banking/Credit
  TOTLL: 'TOTLL',                 // Total Loans and Leases
  DPSACBW027SBOG: 'DPSACBW027SBOG', // Deposits at Commercial Banks
  MPRIME: 'MPRIME',               // Prime Rate

  // Housing/Mortgage
  MORTGAGE30US: 'MORTGAGE30US',   // 30-Year Fixed Mortgage Rate
  MORTGAGE15US: 'MORTGAGE15US',   // 15-Year Fixed Mortgage Rate
};

interface FredObservation {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredObservation[];
}

async function fetchFredSeries(
  seriesId: string,
  apiKey: string,
  observationCount: number = 12
): Promise<{ date: string; value: number }[]> {
  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('sort_order', 'desc');
  url.searchParams.set('limit', observationCount.toString());

  const response = await fetch(url.toString(), { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`FRED API error for ${seriesId}: ${response.statusText}`);
  }

  const data: FredResponse = await response.json();

  return data.observations
    .filter(obs => obs.value !== '.')
    .map(obs => ({
      date: obs.date,
      value: parseFloat(obs.value),
    }));
}

export async function GET(request: NextRequest) {
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!FRED_API_KEY) {
    const demo = generateMockMacroData();
    return NextResponse.json({
      success: true,
      mode: 'demo',
      latest: demo.latest,
      series: demo.series,
      availableSeries: demo.availableSeries,
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const seriesParam = searchParams.get('series');
    const countParam = searchParams.get('count');
    const observationCount = countParam ? parseInt(countParam) : 12;

    // If specific series requested
    if (seriesParam) {
      const seriesIds = seriesParam.split(',');
      const results: Record<string, { date: string; value: number }[]> = {};

      await Promise.all(
        seriesIds.map(async (seriesId) => {
          try {
            results[seriesId] = await fetchFredSeries(seriesId, FRED_API_KEY, observationCount);
          } catch (error) {
            console.error(`Error fetching ${seriesId}:`, error);
            results[seriesId] = [];
          }
        })
      );

      return NextResponse.json({
        success: true,
        mode: 'live',
        data: results,
      }, {
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      });
    }

    // Default: fetch key ALM-relevant series
    const keySeriesIds = [
      'FEDFUNDS', 'DGS10', 'DGS2', 'DGS5', 'DGS30',
      'T10Y2Y', 'UNRATE', 'MORTGAGE30US', 'MPRIME'
    ];

    const results: Record<string, { date: string; value: number }[]> = {};

    await Promise.all(
      keySeriesIds.map(async (seriesId) => {
        try {
          results[seriesId] = await fetchFredSeries(seriesId, FRED_API_KEY, observationCount);
        } catch (error) {
          console.error(`Error fetching ${seriesId}:`, error);
          results[seriesId] = [];
        }
      })
    );

    // Calculate derived metrics
    const latestData = {
      fedFundsRate: results.FEDFUNDS?.[0]?.value,
      treasury10Y: results.DGS10?.[0]?.value,
      treasury2Y: results.DGS2?.[0]?.value,
      treasury5Y: results.DGS5?.[0]?.value,
      treasury30Y: results.DGS30?.[0]?.value,
      yieldCurveSpread: results.T10Y2Y?.[0]?.value,
      unemploymentRate: results.UNRATE?.[0]?.value,
      mortgage30Y: results.MORTGAGE30US?.[0]?.value,
      primeRate: results.MPRIME?.[0]?.value,
      asOfDate: results.FEDFUNDS?.[0]?.date || new Date().toISOString().split('T')[0],
    };

    return NextResponse.json({
      success: true,
      mode: 'live',
      latest: latestData,
      series: results,
      availableSeries: Object.keys(FRED_SERIES),
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });

  } catch (error) {
    console.error('FRED API error:', error);
    // Return demo data with consistent shape (top-level latest/series)
    const demo = generateMockMacroData();
    return NextResponse.json({
      success: true,
      mode: 'demo',
      latest: demo.latest,
      series: demo.series,
      availableSeries: demo.availableSeries,
      error: 'Failed to fetch FRED data - using demo data',
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  }
}

// POST endpoint to fetch specific series with date range
export async function POST(request: NextRequest) {
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!FRED_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'FRED API key not configured',
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  }

  try {
    const body = await request.json();
    const { seriesIds, startDate, endDate, frequency } = body;

    if (!seriesIds || !Array.isArray(seriesIds)) {
      return NextResponse.json({
        success: false,
        error: 'seriesIds array is required',
      }, {
        status: 400,
        headers: { 'Cache-Control': 'no-store, must-revalidate' },
      });
    }

    const results: Record<string, { date: string; value: number }[]> = {};

    await Promise.all(
      seriesIds.map(async (seriesId: string) => {
        try {
          const url = new URL('https://api.stlouisfed.org/fred/series/observations');
          url.searchParams.set('series_id', seriesId);
          url.searchParams.set('api_key', FRED_API_KEY);
          url.searchParams.set('file_type', 'json');

          if (startDate) url.searchParams.set('observation_start', startDate);
          if (endDate) url.searchParams.set('observation_end', endDate);
          if (frequency) url.searchParams.set('frequency', frequency);

          const response = await fetch(url.toString(), { cache: 'no-store' });
          const data: FredResponse = await response.json();

          results[seriesId] = data.observations
            .filter(obs => obs.value !== '.')
            .map(obs => ({
              date: obs.date,
              value: parseFloat(obs.value),
            }));
        } catch (error) {
          console.error(`Error fetching ${seriesId}:`, error);
          results[seriesId] = [];
        }
      })
    );

    return NextResponse.json({
      success: true,
      mode: 'live',
      data: results,
    }, {
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });

  } catch (error) {
    console.error('FRED API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch FRED data',
    }, {
      status: 500,
      headers: { 'Cache-Control': 'no-store, must-revalidate' },
    });
  }
}

function generateMockMacroData() {
  const today = new Date();

  return {
    latest: {
      fedFundsRate: 5.33,
      treasury10Y: 4.25,
      treasury2Y: 4.65,
      treasury5Y: 4.15,
      treasury30Y: 4.45,
      yieldCurveSpread: -0.40,
      unemploymentRate: 3.7,
      mortgage30Y: 6.95,
      primeRate: 8.50,
      asOfDate: today.toISOString().split('T')[0],
    },
    series: {
      FEDFUNDS: generateMockTimeSeries(5.33, 12, 0.25),
      DGS10: generateMockTimeSeries(4.25, 12, 0.15),
      DGS2: generateMockTimeSeries(4.65, 12, 0.20),
      T10Y2Y: generateMockTimeSeries(-0.40, 12, 0.10),
      UNRATE: generateMockTimeSeries(3.7, 12, 0.1),
    },
    availableSeries: Object.keys(FRED_SERIES),
  };
}

function generateMockTimeSeries(
  latestValue: number,
  months: number,
  volatility: number
): { date: string; value: number }[] {
  const series: { date: string; value: number }[] = [];
  const today = new Date();

  let value = latestValue;

  for (let i = 0; i < months; i++) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);

    series.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
    });

    // Random walk backwards
    value += (Math.random() - 0.5) * volatility * 2;
  }

  return series;
}
