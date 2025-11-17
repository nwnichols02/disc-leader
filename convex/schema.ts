import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // 1. GAMES - Core game entity
  games: defineTable({
    // Format & Status
    format: v.union(
      v.literal("professional"),
      v.literal("tournament"),
      v.literal("recreational")
    ),
    status: v.union(
      v.literal("upcoming"),
      v.literal("live"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    
    // Teams
    homeTeamId: v.id("teams"),
    awayTeamId: v.id("teams"),
    
    // Scheduling
    scheduledStart: v.number(), // Unix timestamp
    actualStart: v.optional(v.number()),
    endTime: v.optional(v.number()),
    venue: v.string(),
    
    // Field Information
    fieldInfo: v.optional(v.object({
      length: v.number(),
      width: v.number(),
      endZoneDepth: v.number(),
      surface: v.string(),
    })),
    
    // Format-Specific Configuration
    ruleConfig: v.object({
      stallCount: v.union(v.literal(6), v.literal(7), v.literal(10)),
      targetScore: v.optional(v.number()), // Tournament: 11/13/15
      quarterLength: v.optional(v.number()), // Professional: 12 minutes
      halfLength: v.optional(v.number()), // Recreational: 20-35 minutes
      timeoutsPerHalf: v.number(),
      timeoutDuration: v.number(),
      capRules: v.optional(v.object({
        softCapTime: v.number(),
        hardCapTime: v.number(),
      })),
    }),
    
    // Mixed Division Support
    genderRatioRequired: v.optional(v.boolean()),
  })
    .index("status_scheduledStart", ["status", "scheduledStart"])
    .index("homeTeamId", ["homeTeamId"])
    .index("awayTeamId", ["awayTeamId"]),
  
  // 2. GAME STATE - Real-time game data (separate for performance)
  gameState: defineTable({
    gameId: v.id("games"),
    
    // Score
    homeScore: v.number(),
    awayScore: v.number(),
    
    // Time
    period: v.number(), // Quarter/half number
    clockSeconds: v.number(),
    clockRunning: v.boolean(),
    
    // Possession
    possession: v.union(v.literal("home"), v.literal("away")),
    pointStartedWith: v.union(v.literal("home"), v.literal("away")),
    
    // Timeouts
    homeTimeoutsRemaining: v.number(),
    awayTimeoutsRemaining: v.number(),
    timeoutActive: v.optional(v.object({
      team: v.union(v.literal("home"), v.literal("away")),
      startTime: v.number(),
    })),
    
    // Mixed Division Gender Ratio
    homeGenderRatio: v.optional(v.object({
      male: v.number(),
      female: v.number(),
    })),
    awayGenderRatio: v.optional(v.object({
      male: v.number(),
      female: v.number(),
    })),
    
    // Metadata
    lastUpdateTime: v.number(),
    lastUpdatedBy: v.id("users"),
  })
    .index("gameId", ["gameId"]),
  
  // 3. EVENTS - Immutable play-by-play log
  events: defineTable({
    gameId: v.id("games"),
    timestamp: v.number(),
    clockSeconds: v.number(),
    period: v.number(),
    
    type: v.union(
      v.literal("goal"),
      v.literal("turnover"),
      v.literal("timeout"),
      v.literal("substitution"),
      v.literal("penalty"),
      v.literal("periodEnd"),
      v.literal("gameEnd")
    ),
    
    // Goal Details
    scoringTeam: v.optional(v.union(v.literal("home"), v.literal("away"))),
    scoredBy: v.optional(v.id("players")),
    assistedBy: v.optional(v.id("players")),
    hockeyAssistBy: v.optional(v.id("players")),
    
    // Turnover Details
    turnoverType: v.optional(v.union(
      v.literal("drop"),
      v.literal("throwaway"),
      v.literal("block"),
      v.literal("stall"),
      v.literal("out-of-bounds"),
      v.literal("other")
    )),
    turnoverBy: v.optional(v.id("players")),
    forcedBy: v.optional(v.id("players")),
    
    // Substitution
    playerIn: v.optional(v.id("players")),
    playerOut: v.optional(v.id("players")),
    line: v.optional(v.union(v.literal("O"), v.literal("D"))),
    
    // Description
    description: v.string(),
    
    // Audit
    recordedBy: v.id("users"),
  })
    .index("gameId_timestamp", ["gameId", "timestamp"])
    .index("gameId", ["gameId"]),
  
  // 4. TEAMS
  teams: defineTable({
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
  }),
  
  // 5. PLAYERS
  players: defineTable({
    firstName: v.string(),
    lastName: v.string(),
    jerseyNumber: v.number(),
    teamId: v.id("teams"),
    
    position: v.union(v.literal("handler"), v.literal("cutter")),
    primaryLine: v.union(v.literal("O"), v.literal("D"), v.literal("both")),
    gender: v.optional(v.union(v.literal("M"), v.literal("F"))),
    
    isActive: v.boolean(),
  })
    .index("teamId_active", ["teamId", "isActive"])
    .index("teamId", ["teamId"]),
  
  // 6. USERS (for authentication & admin)
  users: defineTable({
    clerkId: v.string(), // Link to Clerk
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("scorekeeper"), v.literal("viewer")),
    
    // Permissions
    canManageGames: v.boolean(),
    canManageTeams: v.boolean(),
    
    // Notifications
    notificationPreferences: v.optional(v.object({
      email: v.boolean(),
      sms: v.boolean(),
      phone: v.optional(v.string()),
    })),
  })
    .index("clerkId", ["clerkId"])
    .index("email", ["email"]),
  
  // 7. SUBSCRIPTIONS (for notifications)
  subscriptions: defineTable({
    userId: v.id("users"),
    gameId: v.optional(v.id("games")),
    teamId: v.optional(v.id("teams")),
    
    notifyOn: v.object({
      goals: v.boolean(),
      periodEnd: v.boolean(),
      gameEnd: v.boolean(),
      scheduleChanges: v.boolean(),
    }),
  })
    .index("userId", ["userId"])
    .index("gameId", ["gameId"])
    .index("teamId", ["teamId"]),
})
