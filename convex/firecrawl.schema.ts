import { v } from "convex/values";

/**
 * Validator for a single extracted team from Firecrawl
 */
export const extractedTeamValidator = v.object({
  name: v.string(),
  abbreviation: v.string(),
  colors: v.object({
    primary: v.string(),
    secondary: v.string(),
  }),
  logo: v.optional(v.string()),
  division: v.optional(
    v.union(v.literal("open"), v.literal("womens"), v.literal("mixed"))
  ),
});

/**
 * Validator for the array of extracted teams
 */
export const extractedTeamsValidator = v.array(extractedTeamValidator);

/**
 * TypeScript type for extracted team data
 */
export type ExtractedTeam = {
  name: string;
  abbreviation: string;
  colors: {
    primary: string;
    secondary: string;
  };
  logo?: string;
  division?: "open" | "womens" | "mixed";
};

