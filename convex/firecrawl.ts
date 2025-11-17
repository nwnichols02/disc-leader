"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { extractedTeamsValidator, type ExtractedTeam } from "./firecrawl.schema";

/**
 * Normalize URL - add https:// if missing, validate format
 */
function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProto);
  return url.toString();
}

/**
 * Default colors to use if extraction doesn't find team colors
 */
const DEFAULT_COLORS = {
  primary: "#3b82f6",
  secondary: "#1e40af",
};

/**
 * Extract teams from a website using Firecrawl
 * 
 * This action scrapes a website and uses AI to extract ultimate frisbee team
 * information including name, abbreviation, colors, logo, and division.
 */
export const extractTeamsFromWebsite = internalAction({
  args: { url: v.string() },
  returns: extractedTeamsValidator,
  handler: async (ctx, args) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    let targetUrl = args.url || "invalid-url";

    if (!apiKey || !apiKey.trim()) {
      throw new Error(
        "Missing FIRECRAWL_API_KEY. Please configure it in your Convex dashboard."
      );
    }

    try {
      targetUrl = normalizeUrl(args.url);

      const { default: Firecrawl } = await import("@mendable/firecrawl-js");
      const app = new Firecrawl({ apiKey });

      // Define extraction schema for teams - limit to 4 teams to avoid timeouts
      const EXTRACTION_SCHEMA = {
        type: "object",
        properties: {
          teams: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Full team name",
                },
                abbreviation: {
                  type: "string",
                  description: "Team abbreviation (max 5 characters)",
                  maxLength: 5,
                },
                colors: {
                  type: "object",
                  properties: {
                    primary: {
                      type: "string",
                      description: "Primary team color in hex format (e.g., #FF0000)",
                    },
                    secondary: {
                      type: "string",
                      description: "Secondary team color in hex format (e.g., #000000)",
                    },
                  },
                  required: ["primary", "secondary"],
                },
                logo: {
                  type: "string",
                  description: "URL to team logo image (optional)",
                },
                division: {
                  type: "string",
                  enum: ["open", "womens", "mixed"],
                  description: "Team division: open, womens, or mixed (optional)",
                },
              },
              required: ["name", "abbreviation", "colors"],
            },
            minItems: 0,
            maxItems: 4,
            description: "Array of exactly 4 teams (or fewer if less than 4 teams are found on the page)",
          },
        },
        required: ["teams"],
      } as const;

      const EXTRACTION_PROMPT = `You are extracting ultimate frisbee team information from a website.

IMPORTANT: Extract ONLY the first 4 teams you find on this website. Do not extract more than 4 teams.

Look for:
- Team cards, team listings, team sections, or any organized list of teams
- Teams may be organized by categories like "Men's", "Women's", "Mixed", "Pro Flight", "Elite Flight", etc.
- Each team entry typically has: team name, location (city/state), and possibly additional info

For each of the first 4 teams you find, extract:
1. Team name (full name as it appears, e.g., "San Francisco Revolver", "Chicago Machine")
2. Abbreviation (generate from team name if not provided - use first letters of words, max 5 chars, uppercase)
3. Primary color (if visible in logos/images, use hex format like #FF0000; otherwise use default #3b82f6)
4. Secondary color (if visible in logos/images, use hex format; otherwise use default #1e40af)
5. Logo URL (if you see a logo image URL, include it; otherwise leave empty)
6. Division (infer from section/category: "Men's" or "Men" = "open", "Women's" or "Women" = "womens", "Mixed" = "mixed")

CRITICAL INSTRUCTIONS:
- Extract EXACTLY 4 teams (or fewer if less than 4 teams are found on the page)
- Start from the top of the page and work down
- If the page has sections like "Men's Pro Flight", "Women's Elite Flight", "Mixed Pro Flight", extract teams from the first section you encounter
- For abbreviation: if not provided, create one from the team name (e.g., "San Francisco Revolver" → "SFR", "Chicago Machine" → "CHI")
- For division: look at the section header or category the team is listed under
- For colors: only extract if clearly visible in logos/images; otherwise use defaults
- Team name is REQUIRED - if you can't find a team name, skip that entry
- Stop after extracting 4 teams - do not continue extracting more

EXAMPLES:
- "San Francisco Revolver" in "Men's Pro Flight" → name: "San Francisco Revolver", abbreviation: "SFR", division: "open"
- "Seattle Riot" in "Women's Pro Flight" → name: "Seattle Riot", abbreviation: "SEA", division: "womens"
- "Ann Arbor Hybrid" in "Mixed Pro Flight" → name: "Ann Arbor Hybrid", abbreviation: "AAH", division: "mixed"

Return exactly 4 teams (or fewer if the page has less than 4 teams). Only skip entries if you cannot identify a team name.`;

      // Use scrape with JSON extraction format - this is the most efficient approach
      // It combines scraping and extraction in one optimized call
      let response: any;
      
      try {
        console.log("Scraping and extracting teams from page...");
        const scrapeResponse = await Promise.race([
          app.scrape(targetUrl, {
            formats: [
              {
                type: "json",
                schema: EXTRACTION_SCHEMA as any,
                prompt: EXTRACTION_PROMPT,
              },
            ],
            timeout: 55000, // 55 seconds - leave 5s buffer for Convex's 60s limit
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Scrape with extraction timeout")), 55000)
          ),
        ]) as any;

        // Extract the JSON data from scrape response
        // The response structure can vary: scrapeResponse.json or scrapeResponse.data.json
        const jsonData = scrapeResponse?.json || scrapeResponse?.data?.json;
        
        if (!jsonData) {
          console.log("No JSON data in response. Full response:", JSON.stringify(scrapeResponse, null, 2));
          throw new Error("No JSON extraction data returned from scrape");
        }

        // Wrap the JSON data in the expected response format
        response = { data: jsonData };
        console.log(`Successfully extracted data with ${jsonData?.teams?.length || 0} teams`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        
        // Provide helpful error message with suggestions
        throw new Error(
          `Failed to extract teams from website (timeout after 55 seconds). ` +
          `The page at ${targetUrl} may be too large or complex. ` +
          `Suggestions: ` +
          `1. Try a more specific URL (e.g., a single division page) ` +
          `2. The page may need to be split into multiple imports ` +
          `3. Check if the website has an API or data export option. ` +
          `Error details: ${errorMsg}`
        );
      }

      // Handle different response structures from Firecrawl
      let data: any;
      if (response?.data) {
        data = response.data;
      } else if (Array.isArray(response)) {
        data = response[0];
      } else {
        data = response;
      }

      // Handle nested data structures
      const item = Array.isArray(data) ? data[0] : data;
      
      // Check for teams in various possible locations
      let teamsArray: any[] = [];
      if (item?.teams && Array.isArray(item.teams)) {
        teamsArray = item.teams;
      } else if (Array.isArray(item) && item.length > 0 && item[0]?.name) {
        // If the response is directly an array of teams
        teamsArray = item;
      } else if (item && typeof item === 'object' && !item.teams) {
        // If item is a single team object, wrap it
        if (item.name) {
          teamsArray = [item];
        }
      }

      if (teamsArray.length === 0) {
        // Log for debugging
        console.log("No teams found in response. Response structure:", JSON.stringify(response, null, 2));
        return [];
      }

      // Limit to 4 teams maximum to avoid timeouts
      const limitedTeamsArray = teamsArray.slice(0, 4);
      if (teamsArray.length > 4) {
        console.log(`Found ${teamsArray.length} teams, limiting to first 4 to avoid timeout`);
      }

      // Validate and normalize extracted teams
      const teams: ExtractedTeam[] = limitedTeamsArray.map((team: any) => {
        // Validate name
        const name =
          typeof team?.name === "string" && team.name.trim().length > 0
            ? team.name.trim()
            : null;

        if (!name) {
          return null; // Skip invalid teams
        }

        // Validate abbreviation
        const abbreviation =
          typeof team?.abbreviation === "string" &&
          team.abbreviation.trim().length > 0
            ? team.abbreviation.trim().toUpperCase().slice(0, 5)
            : name
                .split(" ")
                .map((word: string) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 5);

        // Validate colors
        const primaryColor =
          typeof team?.colors?.primary === "string" &&
          /^#[0-9A-Fa-f]{6}$/.test(team.colors.primary)
            ? team.colors.primary.toUpperCase()
            : DEFAULT_COLORS.primary;

        const secondaryColor =
          typeof team?.colors?.secondary === "string" &&
          /^#[0-9A-Fa-f]{6}$/.test(team.colors.secondary)
            ? team.colors.secondary.toUpperCase()
            : DEFAULT_COLORS.secondary;

        // Validate logo
        const logo =
          typeof team?.logo === "string" && team.logo.trim().length > 0
            ? team.logo.trim()
            : undefined;

        // Validate division
        const validDivisions = ["open", "womens", "mixed"];
        const division = validDivisions.includes(team?.division)
          ? team.division
          : undefined;

        return {
          name,
          abbreviation,
          colors: {
            primary: primaryColor,
            secondary: secondaryColor,
          },
          ...(logo && { logo }),
          ...(division && { division }),
        };
      });

      // Filter out null entries and return
      return teams.filter((team): team is ExtractedTeam => team !== null);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to extract teams from website: ${errorMessage}`);
    }
  },
});

