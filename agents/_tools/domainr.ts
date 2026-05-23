import * as dotenv from 'dotenv';
dotenv.config();

export interface DomainCheckResult {
  name: string;
  domain: string;
  available: boolean;
  alternative_tld?: string;
}

export async function checkDomain(name: string): Promise<DomainCheckResult> {
  const apiKey = process.env.DOMAINR_API_KEY;
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targetDomain = `${cleanName}.com`;
  const alternativeTld = `${cleanName}.co`;

  if (!apiKey) {
    console.warn("[Domainr] API key missing, returning simulated result.");
    return {
      name,
      domain: targetDomain,
      available: true,
      alternative_tld: alternativeTld
    };
  }

  const url = `https://domainr.p.rapidapi.com/v2/status?domain=${encodeURIComponent(targetDomain)}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000); // 8-second timeout

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": "domainr.p.rapidapi.com"
      },
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Domainr HTTP error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const statusEntry = data.status?.[0];
    
    // Status types like "inactive" or "undelegated" mean domain is available
    const statusString = statusEntry?.status || "";
    const isAvailable = statusString.includes("inactive") || statusString.includes("undelegated");

    return {
      name,
      domain: targetDomain,
      available: isAvailable,
      alternative_tld: alternativeTld
    };
  } catch (err) {
    console.warn(`[Domainr] live check failed for ${targetDomain}:`, err);
    return {
      name,
      domain: targetDomain,
      available: true, // Default to true so founders aren't blocked
      alternative_tld: alternativeTld
    };
  }
}
