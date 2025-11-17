/**
 * Query functions for games, game state, and events
 * These functions provide read access to game data with real-time subscriptions
 */

import { query } from "./_generated/server"
import { v } from "convex/values"

/**
 * Get a single game by ID with full details including teams and current state
 */
export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game) return null
    
    // Fetch related data in parallel
    const [homeTeam, awayTeam, gameState] = await Promise.all([
      ctx.db.get(game.homeTeamId),
      ctx.db.get(game.awayTeamId),
      ctx.db
        .query("gameState")
        .withIndex("gameId", (q) => q.eq("gameId", args.gameId))
        .first(),
    ])
    
    return {
      ...game,
      homeTeam,
      awayTeam,
      state: gameState,
    }
  },
})

/**
 * Get real-time game state for live updates
 * This is the primary subscription for live scoreboard updates
 */
export const getGameState = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameState")
      .withIndex("gameId", (q) => q.eq("gameId", args.gameId))
      .first()
  },
})

/**
 * Get game events (play-by-play log)
 * Returns events in reverse chronological order (most recent first)
 */
export const getGameEvents = query({
  args: { 
    gameId: v.id("games"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use default limit of 100 to avoid conditional query building
    const events = await ctx.db
      .query("events")
      .withIndex("gameId_timestamp", (q) => q.eq("gameId", args.gameId))
      .order("desc")
      .take(args.limit ?? 100)
    
    // Fetch player details for events that reference players
    const eventsWithPlayers = await Promise.all(
      events.map(async (event) => {
        const [scoredBy, assistedBy, recordedBy] = await Promise.all([
          event.scoredBy ? ctx.db.get(event.scoredBy) : null,
          event.assistedBy ? ctx.db.get(event.assistedBy) : null,
          ctx.db.get(event.recordedBy),
        ])
        
        return {
          ...event,
          scoredByPlayer: scoredBy,
          assistedByPlayer: assistedBy,
          recordedByUser: recordedBy,
        }
      })
    )
    
    return eventsWithPlayers
  },
})

/**
 * List games filtered by status
 * Used for dashboard views (live games, upcoming games, etc.)
 */
export const listGames = query({
  args: { 
    status: v.optional(v.union(
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const defaultLimit = args.limit ?? 50
    
    // Use separate query paths to avoid type issues with conditional query building
    const games = args.status
      ? await ctx.db
          .query("games")
          .withIndex("status_scheduledStart", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(defaultLimit)
      : await ctx.db
          .query("games")
          .order("desc")
          .take(defaultLimit)
    
    // Fetch team details for each game
    const gamesWithTeams = await Promise.all(
      games.map(async (game) => {
        const [homeTeam, awayTeam, gameState] = await Promise.all([
          ctx.db.get(game.homeTeamId),
          ctx.db.get(game.awayTeamId),
          ctx.db
            .query("gameState")
            .withIndex("gameId", (q) => q.eq("gameId", game._id))
            .first(),
        ])
        
        return {
          ...game,
          homeTeam,
          awayTeam,
          state: gameState,
        }
      })
    )
    
    return gamesWithTeams
  },
})

/**
 * Get all live games with their current state
 * Optimized query for live game dashboard
 */
export const getLiveGames = query({
  args: {},
  handler: async (ctx) => {
    const liveGames = await ctx.db
      .query("games")
      .withIndex("status_scheduledStart", (q) => q.eq("status", "live"))
      .collect()
    
    const gamesWithDetails = await Promise.all(
      liveGames.map(async (game) => {
        const [homeTeam, awayTeam, gameState] = await Promise.all([
          ctx.db.get(game.homeTeamId),
          ctx.db.get(game.awayTeamId),
          ctx.db
            .query("gameState")
            .withIndex("gameId", (q) => q.eq("gameId", game._id))
            .first(),
        ])
        
        return {
          ...game,
          homeTeam,
          awayTeam,
          state: gameState,
        }
      })
    )
    
    return gamesWithDetails
  },
})

/**
 * Get team by ID with basic information
 */
export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.teamId)
  },
})

/**
 * List all teams
 */
export const listTeams = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("teams").collect()
  },
})

/**
 * Get players for a specific team
 */
export const getTeamPlayers = query({
  args: { 
    teamId: v.id("teams"),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("players")
        .withIndex("teamId_active", (q) => 
          q.eq("teamId", args.teamId).eq("isActive", true)
        )
        .collect()
    }
    
    return await ctx.db
      .query("players")
      .withIndex("teamId", (q) => q.eq("teamId", args.teamId))
      .collect()
  },
})

/**
 * Get user by Clerk ID
 * Used for authentication and authorization checks
 */
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first()
  },
})

