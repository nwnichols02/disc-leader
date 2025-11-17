/**
 * Seed data script for development and testing
 * Run this to populate the database with sample data
 * 
 * To run: Use the Convex dashboard or call via a mutation
 */

import { mutation } from "./_generated/server"
import { v } from "convex/values"

/**
 * Seed initial data for testing
 * Creates teams, users, and a sample game
 */
export const seedData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingTeams = await ctx.db.query("teams").collect()
    if (existingTeams.length > 0) {
      return { message: "Data already exists", skipped: true }
    }
    
    // Create teams
    const team1Id = await ctx.db.insert("teams", {
      name: "San Francisco Revolver",
      abbreviation: "SFR",
      colors: {
        primary: "#FF0000",
        secondary: "#000000",
      },
      division: "open",
    })
    
    const team2Id = await ctx.db.insert("teams", {
      name: "Seattle Sockeye",
      abbreviation: "SEA",
      colors: {
        primary: "#0066CC",
        secondary: "#FFFFFF",
      },
      division: "open",
    })
    
    const team3Id = await ctx.db.insert("teams", {
      name: "Boston Brute Squad",
      abbreviation: "BOS",
      colors: {
        primary: "#000080",
        secondary: "#FFD700",
      },
      division: "womens",
    })
    
    const team4Id = await ctx.db.insert("teams", {
      name: "Portland Rhino Slam",
      abbreviation: "PDX",
      colors: {
        primary: "#228B22",
        secondary: "#FFD700",
      },
      division: "mixed",
    })
    
    // Create sample admin user
    const adminUserId = await ctx.db.insert("users", {
      clerkId: "sample_admin_123",
      email: "admin@discleader.com",
      name: "Admin User",
      role: "admin",
      canManageGames: true,
      canManageTeams: true,
    })
    
    // Create sample scorekeeper user
    const scorekeeperUserId = await ctx.db.insert("users", {
      clerkId: "sample_scorekeeper_456",
      email: "scorekeeper@discleader.com",
      name: "Scorekeeper User",
      role: "scorekeeper",
      canManageGames: false,
      canManageTeams: false,
    })
    
    // Create sample players for team 1
    const player1Id = await ctx.db.insert("players", {
      firstName: "Jimmy",
      lastName: "Mickle",
      jerseyNumber: 7,
      teamId: team1Id,
      position: "handler",
      primaryLine: "O",
      isActive: true,
    })
    
    const player2Id = await ctx.db.insert("players", {
      firstName: "Beau",
      lastName: "Kittredge",
      jerseyNumber: 22,
      teamId: team1Id,
      position: "cutter",
      primaryLine: "both",
      isActive: true,
    })
    
    // Create sample players for team 2
    const player3Id = await ctx.db.insert("players", {
      firstName: "Dylan",
      lastName: "Freechild",
      jerseyNumber: 42,
      teamId: team2Id,
      position: "handler",
      primaryLine: "O",
      isActive: true,
    })
    
    const player4Id = await ctx.db.insert("players", {
      firstName: "Mark",
      lastName: "Burton",
      jerseyNumber: 10,
      teamId: team2Id,
      position: "cutter",
      primaryLine: "D",
      isActive: true,
    })
    
    // Create an upcoming game (Professional format)
    const upcomingGameId = await ctx.db.insert("games", {
      format: "professional",
      status: "upcoming",
      homeTeamId: team1Id,
      awayTeamId: team2Id,
      scheduledStart: Date.now() + 3600000, // 1 hour from now
      venue: "Breese Stevens Field, Madison, WI",
      fieldInfo: {
        length: 80,
        width: 53.33,
        endZoneDepth: 20,
        surface: "grass",
      },
      ruleConfig: {
        stallCount: 7,
        quarterLength: 12,
        timeoutsPerHalf: 2,
        timeoutDuration: 90,
      },
      genderRatioRequired: false,
    })
    
    // Initialize game state for upcoming game
    await ctx.db.insert("gameState", {
      gameId: upcomingGameId,
      homeScore: 0,
      awayScore: 0,
      period: 1,
      clockSeconds: 720, // 12 minutes
      clockRunning: false,
      possession: "home",
      pointStartedWith: "home",
      homeTimeoutsRemaining: 2,
      awayTimeoutsRemaining: 2,
      lastUpdateTime: Date.now(),
      lastUpdatedBy: adminUserId,
    })
    
    // Create a live game (Tournament format)
    const liveGameId = await ctx.db.insert("games", {
      format: "tournament",
      status: "live",
      homeTeamId: team3Id,
      awayTeamId: team4Id,
      scheduledStart: Date.now() - 1800000, // Started 30 minutes ago
      actualStart: Date.now() - 1800000,
      venue: "Baxter Arena, Omaha, NE",
      fieldInfo: {
        length: 70,
        width: 40,
        endZoneDepth: 18,
        surface: "turf",
      },
      ruleConfig: {
        stallCount: 10,
        targetScore: 15,
        timeoutsPerHalf: 2,
        timeoutDuration: 120,
        capRules: {
          softCapTime: 100,
          hardCapTime: 120,
        },
      },
      genderRatioRequired: true,
    })
    
    // Initialize live game state
    const liveGameStateId = await ctx.db.insert("gameState", {
      gameId: liveGameId,
      homeScore: 7,
      awayScore: 5,
      period: 1,
      clockSeconds: 4200, // 70 minutes elapsed
      clockRunning: true,
      possession: "home",
      pointStartedWith: "away",
      homeTimeoutsRemaining: 1,
      awayTimeoutsRemaining: 2,
      homeGenderRatio: {
        male: 4,
        female: 3,
      },
      awayGenderRatio: {
        male: 3,
        female: 4,
      },
      lastUpdateTime: Date.now(),
      lastUpdatedBy: scorekeeperUserId,
    })
    
    // Create some sample events for the live game
    await ctx.db.insert("events", {
      gameId: liveGameId,
      timestamp: Date.now() - 600000, // 10 minutes ago
      clockSeconds: 4800,
      period: 1,
      type: "goal",
      scoringTeam: "home",
      description: "Goal scored by home team",
      recordedBy: scorekeeperUserId,
    })
    
    await ctx.db.insert("events", {
      gameId: liveGameId,
      timestamp: Date.now() - 300000, // 5 minutes ago
      clockSeconds: 4500,
      period: 1,
      type: "turnover",
      turnoverType: "block",
      description: "Turnover: block",
      recordedBy: scorekeeperUserId,
    })
    
    await ctx.db.insert("events", {
      gameId: liveGameId,
      timestamp: Date.now() - 120000, // 2 minutes ago
      clockSeconds: 4320,
      period: 1,
      type: "goal",
      scoringTeam: "away",
      description: "Goal scored by away team",
      recordedBy: scorekeeperUserId,
    })
    
    return {
      message: "Seed data created successfully",
      teams: 4,
      users: 2,
      players: 4,
      games: 2,
      events: 3,
      teamIds: { team1Id, team2Id, team3Id, team4Id },
      gameIds: { upcomingGameId, liveGameId },
      userIds: { adminUserId, scorekeeperUserId },
    }
  },
})

/**
 * Clear all data (use with caution!)
 * Useful for resetting the database during development
 */
export const clearAllData = mutation({
  args: { confirm: v.boolean() },
  handler: async (ctx, args) => {
    if (!args.confirm) {
      throw new Error("Must confirm to clear all data")
    }
    
    // Delete all data in reverse order of dependencies
    const events = await ctx.db.query("events").collect()
    for (const event of events) {
      await ctx.db.delete(event._id)
    }
    
    const gameStates = await ctx.db.query("gameState").collect()
    for (const state of gameStates) {
      await ctx.db.delete(state._id)
    }
    
    const subscriptions = await ctx.db.query("subscriptions").collect()
    for (const sub of subscriptions) {
      await ctx.db.delete(sub._id)
    }
    
    const games = await ctx.db.query("games").collect()
    for (const game of games) {
      await ctx.db.delete(game._id)
    }
    
    const players = await ctx.db.query("players").collect()
    for (const player of players) {
      await ctx.db.delete(player._id)
    }
    
    const teams = await ctx.db.query("teams").collect()
    for (const team of teams) {
      await ctx.db.delete(team._id)
    }
    
    const users = await ctx.db.query("users").collect()
    for (const user of users) {
      await ctx.db.delete(user._id)
    }
    
    return {
      message: "All data cleared successfully",
      deleted: {
        events: events.length,
        gameStates: gameStates.length,
        games: games.length,
        players: players.length,
        teams: teams.length,
        users: users.length,
        subscriptions: subscriptions.length,
      },
    }
  },
})

