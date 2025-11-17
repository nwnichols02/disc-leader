/**
 * Mutation functions for creating and updating games
 * These functions handle all write operations with proper authentication
 */

import { mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Create a new game
 * Requires: User must have canManageGames permission
 */
export const createGame = mutation({
  args: {
    format: v.union(
      v.literal("professional"),
      v.literal("tournament"),
      v.literal("recreational")
    ),
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    scheduledStart: v.number(),
    venue: v.string(),
    ruleConfig: v.object({
      stallCount: v.union(v.literal(6), v.literal(7), v.literal(10)),
      targetScore: v.optional(v.number()),
      quarterLength: v.optional(v.number()),
      halfLength: v.optional(v.number()),
      timeoutsPerHalf: v.number(),
      timeoutDuration: v.number(),
      capRules: v.optional(v.object({
        softCapTime: v.number(),
        hardCapTime: v.number(),
      })),
    }),
    genderRatioRequired: v.optional(v.boolean()),
    fieldInfo: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      endZoneDepth: v.number(),
      surface: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user?.canManageGames) {
      throw new Error("Not authorized to create games")
    }
    
    // Create game
    const gameId = await ctx.db.insert("games", {
      format: args.format,
      status: "upcoming",
      homeTeamId: args.homeTeamId,
      awayTeamId: args.awayTeamId,
      scheduledStart: args.scheduledStart,
      venue: args.venue,
      fieldInfo: args.fieldInfo,
      ruleConfig: args.ruleConfig,
      genderRatioRequired: args.genderRatioRequired ?? false,
    })
    
    // Initialize game state
    const initialClockSeconds = args.ruleConfig.quarterLength
      ? args.ruleConfig.quarterLength * 60
      : args.ruleConfig.halfLength
      ? args.ruleConfig.halfLength * 60
      : 0
    
    await ctx.db.insert("gameState", {
      gameId,
      homeScore: 0,
      awayScore: 0,
      period: 1,
      clockSeconds: initialClockSeconds,
      clockRunning: false,
      possession: "home",
      pointStartedWith: "home",
      homeTimeoutsRemaining: args.ruleConfig.timeoutsPerHalf,
      awayTimeoutsRemaining: args.ruleConfig.timeoutsPerHalf,
      lastUpdateTime: Date.now(),
      lastUpdatedBy: user._id,
    })
    
    return gameId
  },
})

/**
 * Record a goal
 * Updates score atomically and creates immutable event record
 */
export const recordGoal = mutation({
  args: {
    gameId: v.id("games"),
    scoringTeam: v.union(v.literal("home"), v.literal("away")),
    scoredBy: v.optional(v.id("players")),
    assistedBy: v.optional(v.id("players")),
    hockeyAssistBy: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    // Get current game state
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("gameId", (q) => q.eq("gameId", args.gameId))
      .first()
    
    if (!gameState) {
      throw new Error("Game state not found")
    }
    
    // Update score (atomic operation)
    const newScore = args.scoringTeam === "home" 
      ? gameState.homeScore + 1 
      : gameState.awayScore + 1
    
    await ctx.db.patch(gameState._id, {
      [args.scoringTeam === "home" ? "homeScore" : "awayScore"]: newScore,
      lastUpdateTime: Date.now(),
      lastUpdatedBy: user._id,
    })
    
    // Create immutable event record
    const eventId = await ctx.db.insert("events", {
      gameId: args.gameId,
      timestamp: Date.now(),
      clockSeconds: gameState.clockSeconds,
      period: gameState.period,
      type: "goal",
      scoringTeam: args.scoringTeam,
      scoredBy: args.scoredBy,
      assistedBy: args.assistedBy,
      hockeyAssistBy: args.hockeyAssistBy,
      description: `Goal scored by ${args.scoringTeam} team`,
      recordedBy: user._id,
    })
    
    return { eventId, newScore }
  },
})

/**
 * Update game clock
 * Controls timing for all game formats
 */
export const updateClock = mutation({
  args: {
    gameId: v.id("games"),
    clockSeconds: v.number(),
    clockRunning: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("gameId", (q) => q.eq("gameId", args.gameId))
      .first()
    
    if (!gameState) {
      throw new Error("Game state not found")
    }
    
    await ctx.db.patch(gameState._id, {
      clockSeconds: args.clockSeconds,
      clockRunning: args.clockRunning,
      lastUpdateTime: Date.now(),
      lastUpdatedBy: user._id,
    })
  },
})

/**
 * Update game status (upcoming -> live -> completed)
 */
export const updateGameStatus = mutation({
  args: {
    gameId: v.id("games"),
    status: v.union(
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user?.canManageGames) {
      throw new Error("Not authorized to update game status")
    }
    
    const game = await ctx.db.get(args.gameId)
    if (!game) {
      throw new Error("Game not found")
    }
    
    // Update game status
    await ctx.db.patch(args.gameId, {
      status: args.status,
      ...(args.status === "live" && !game.actualStart 
        ? { actualStart: Date.now() } 
        : {}),
      ...(args.status === "completed" && !game.endTime 
        ? { endTime: Date.now() } 
        : {}),
    })
    
    // Record event
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("gameId", (q) => q.eq("gameId", args.gameId))
      .first()
    
    if (gameState) {
      await ctx.db.insert("events", {
        gameId: args.gameId,
        timestamp: Date.now(),
        clockSeconds: gameState.clockSeconds,
        period: gameState.period,
        type: args.status === "completed" ? "gameEnd" : "periodEnd",
        description: `Game status changed to ${args.status}`,
        recordedBy: user._id,
      })
    }
  },
})

/**
 * Update possession
 */
export const updatePossession = mutation({
  args: {
    gameId: v.id("games"),
    possession: v.union(v.literal("home"), v.literal("away")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("gameId", (q) => q.eq("gameId", args.gameId))
      .first()
    
    if (!gameState) {
      throw new Error("Game state not found")
    }
    
    await ctx.db.patch(gameState._id, {
      possession: args.possession,
      lastUpdateTime: Date.now(),
      lastUpdatedBy: user._id,
    })
  },
})

/**
 * Record a turnover
 */
export const recordTurnover = mutation({
  args: {
    gameId: v.id("games"),
    turnoverType: v.union(
      v.literal("drop"),
      v.literal("throwaway"),
      v.literal("block"),
      v.literal("stall"),
      v.literal("out-of-bounds"),
      v.literal("other")
    ),
    turnoverBy: v.optional(v.id("players")),
    forcedBy: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    const gameState = await ctx.db
      .query("gameState")
      .withIndex("gameId", (q) => q.eq("gameId", args.gameId))
      .first()
    
    if (!gameState) {
      throw new Error("Game state not found")
    }
    
    // Switch possession
    const newPossession = gameState.possession === "home" ? "away" : "home"
    
    await ctx.db.patch(gameState._id, {
      possession: newPossession,
      lastUpdateTime: Date.now(),
      lastUpdatedBy: user._id,
    })
    
    // Record event
    await ctx.db.insert("events", {
      gameId: args.gameId,
      timestamp: Date.now(),
      clockSeconds: gameState.clockSeconds,
      period: gameState.period,
      type: "turnover",
      turnoverType: args.turnoverType,
      turnoverBy: args.turnoverBy,
      forcedBy: args.forcedBy,
      description: `Turnover: ${args.turnoverType}`,
      recordedBy: user._id,
    })
  },
})

/**
 * Create a new team
 */
export const createTeam = mutation({
  args: {
    name: v.string(),
    abbreviation: v.string(),
    colors: v.object({
      primary: v.string(),
      secondary: v.string(),
    }),
    logo: v.optional(v.string()),
    division: v.optional(v.union(
      v.literal("open"),
      v.literal("womens"),
      v.literal("mixed")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user?.canManageTeams) {
      throw new Error("Not authorized to create teams")
    }
    
    return await ctx.db.insert("teams", args)
  },
})

/**
 * Update an existing team
 */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    abbreviation: v.string(),
    colors: v.object({
      primary: v.string(),
      secondary: v.string(),
    }),
    logo: v.optional(v.string()),
    division: v.optional(v.union(
      v.literal("open"),
      v.literal("womens"),
      v.literal("mixed")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", identity.subject))
      .first()
    
    if (!user?.canManageTeams) {
      throw new Error("Not authorized to update teams")
    }
    
    const { teamId, ...updates } = args
    await ctx.db.patch(teamId, updates)
    
    return teamId
  },
})

/**
 * Create a new user (typically called during first sign-in)
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.optional(v.union(
      v.literal("admin"),
      v.literal("scorekeeper"),
      v.literal("viewer")
    )),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first()
    
    if (existing) {
      return existing._id
    }
    
    // Create new user with default permissions
    const role = args.role ?? "viewer"
    
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      role,
      canManageGames: role === "admin",
      canManageTeams: role === "admin",
    })
  },
})

