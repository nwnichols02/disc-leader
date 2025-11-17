import { action, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { extractedTeamValidator, type ExtractedTeam } from "./firecrawl.schema";
import type { Id } from "./_generated/dataModel";

/**
 * Public action wrapper for extracting teams from a website
 * This checks authentication before calling the internal action
 */
export const extractTeamsFromWebsite = action({
  args: { url: v.string() },
  returns: v.array(extractedTeamValidator),
  handler: async (ctx, args): Promise<ExtractedTeam[]> => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check user permissions
    const user = await ctx.runQuery(internal.teamImports.getUserPermissions, {
      clerkId: identity.subject,
    });

    if (!user?.canManageTeams) {
      throw new Error("Not authorized to import teams");
    }

    // Call internal action to do the actual extraction
    return await ctx.runAction(internal.firecrawl.extractTeamsFromWebsite, {
      url: args.url,
    });
  },
});

/**
 * Internal query to get user permissions (used by action)
 */
export const getUserPermissions = internalQuery({
  args: { clerkId: v.string() },
  returns: v.union(
    v.object({
      canManageTeams: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return null;
    }

    return {
      canManageTeams: user.canManageTeams,
    };
  },
});

/**
 * Check for duplicate teams before import
 */
export const checkDuplicates = query({
  args: {
    teams: v.array(extractedTeamValidator),
  },
  returns: v.object({
    duplicates: v.array(
      v.object({
        index: v.number(),
        team: extractedTeamValidator,
        reason: v.string(), // "name" or "abbreviation"
        existingTeamId: v.id("teams"),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const allTeams = await ctx.db.query("teams").collect();
    const duplicates: Array<{
      index: number;
      team: typeof args.teams[0];
      reason: string;
      existingTeamId: Id<"teams">;
    }> = [];

    args.teams.forEach((team, index) => {
      // Check for duplicate name (case-insensitive)
      const nameMatch = allTeams.find(
        (existing) =>
          existing.name.toLowerCase() === team.name.toLowerCase()
      );

      if (nameMatch) {
        duplicates.push({
          index,
          team,
          reason: "name",
          existingTeamId: nameMatch._id,
        });
        return;
      }

      // Check for duplicate abbreviation (case-insensitive)
      const abbrevMatch = allTeams.find(
        (existing) =>
          existing.abbreviation.toLowerCase() ===
          team.abbreviation.toLowerCase()
      );

      if (abbrevMatch) {
        duplicates.push({
          index,
          team,
          reason: "abbreviation",
          existingTeamId: abbrevMatch._id,
        });
      }
    });

    return { duplicates };
  },
});

/**
 * Import teams from extracted data
 * Creates teams in the database after validation
 */
export const importTeams = mutation({
  args: {
    teams: v.array(extractedTeamValidator),
    skipDuplicates: v.optional(v.boolean()),
  },
  returns: v.object({
    created: v.array(v.id("teams")),
    skipped: v.array(
      v.object({
        team: extractedTeamValidator,
        reason: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    // Check authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check user permissions
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.canManageTeams) {
      throw new Error("Not authorized to import teams");
    }

    // Get all existing teams for duplicate checking
    const allTeams = await ctx.db.query("teams").collect();

    const created: Id<"teams">[] = [];
    const skipped: Array<{ team: typeof args.teams[0]; reason: string }> = [];

    for (const team of args.teams) {
      // Check for duplicates
      const nameMatch = allTeams.find(
        (existing) =>
          existing.name.toLowerCase() === team.name.toLowerCase()
      );

      if (nameMatch) {
        if (args.skipDuplicates) {
          skipped.push({
            team,
            reason: `Team with name "${team.name}" already exists`,
          });
          continue;
        } else {
          throw new Error(
            `Team with name "${team.name}" already exists. Please remove it from the import list or enable "Skip Duplicates".`
          );
        }
      }

      const abbrevMatch = allTeams.find(
        (existing) =>
          existing.abbreviation.toLowerCase() ===
          team.abbreviation.toLowerCase()
      );

      if (abbrevMatch) {
        if (args.skipDuplicates) {
          skipped.push({
            team,
            reason: `Team with abbreviation "${team.abbreviation}" already exists`,
          });
          continue;
        } else {
          throw new Error(
            `Team with abbreviation "${team.abbreviation}" already exists. Please remove it from the import list or enable "Skip Duplicates".`
          );
        }
      }

      // Create the team
      const teamId = await ctx.db.insert("teams", team);
      created.push(teamId);
      allTeams.push({ ...team, _id: teamId } as any); // Add to list for subsequent checks
    }

    return { created, skipped };
  },
});

