/**
 * Cloudflare Stream Management Functions
 * 
 * Handles integration with Cloudflare Stream API for live game broadcasts.
 * Functions use actions to securely call Cloudflare API from Convex.
 */

import { action, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

/**
 * Get Cloudflare API base URL
 */
function getCloudflareApiUrl(accountId: string): string {
	return `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;
}

/**
 * Get Cloudflare API headers
 */
function getCloudflareHeaders(apiToken: string): HeadersInit {
	return {
		Authorization: `Bearer ${apiToken}`,
		"Content-Type": "application/json",
	};
}

/**
 * Create a Cloudflare Stream live input
 * Returns the stream key and RTMP endpoint
 */
export const createLiveInput = action({
	args: {},
	handler: async (ctx) => {
		const accountId = process.env.CLOUDFLARE_READ_ONLY_ACCOUNT_ID;
		const apiToken = process.env.CLOUDFLARE_API_TOKEN;

		if (!accountId || !apiToken) {
			throw new Error("Cloudflare credentials not configured");
		}

		try {
			const url = `${getCloudflareApiUrl(accountId)}/live_inputs`;
			const response = await fetch(url, {
				method: "POST",
				headers: getCloudflareHeaders(apiToken),
				body: JSON.stringify({
					meta: {
						name: `Game Stream - ${new Date().toISOString()}`,
					},
					recording: {
						mode: "automatic",
						requireSignedURLs: false,
					},
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Cloudflare API error: ${error}`);
			}

			const data = await response.json();
			const liveInput = data.result;

			// Extract stream key from rtmps object (as per Cloudflare API response)
			const streamKey = liveInput.rtmps?.streamKey || liveInput.streamKey;
			const rtmpUrl = liveInput.rtmps?.url || liveInput.rtmp?.url;
			const uid = liveInput.uid;

			// Extract WebRTC URLs from API response
			// The API returns webRTC.url and webRTCPlayback.url directly
			let webRtcPublishUrl = liveInput.webRTC?.url;
			let webRtcPlaybackUrl = liveInput.webRTCPlayback?.url;

			// Fallback: Construct URLs if not provided in response
			// Format: https://customer-{accountId}.cloudflarestream.com/{uid}/webRTC/publish
			if (!webRtcPublishUrl) {
				webRtcPublishUrl = `https://customer-${accountId}.cloudflarestream.com/${uid}/webRTC/publish`;
			}
			if (!webRtcPlaybackUrl) {
				webRtcPlaybackUrl = `https://customer-${accountId}.cloudflarestream.com/${uid}/webRTC/play`;
			}

			return {
				success: true,
				streamKey,
				rtmpUrl,
				uid,
				webRtcPublishUrl,
				webRtcPlaybackUrl,
			};
		} catch (error) {
			console.error("Error creating live input:", error);
			throw error instanceof Error
				? error
				: new Error("Unknown error creating live input");
		}
	},
});

/**
 * Get live input details from Cloudflare
 * Useful for fetching stream information if webRtcPublishUrl is missing
 */
export const getLiveInput = action({
	args: { uid: v.string() },
	handler: async (ctx, args) => {
		const accountId = process.env.CLOUDFLARE_READ_ONLY_ACCOUNT_ID;
		const apiToken = process.env.CLOUDFLARE_API_TOKEN;

		if (!accountId || !apiToken) {
			throw new Error("Cloudflare credentials not configured");
		}

		try {
			const url = `${getCloudflareApiUrl(accountId)}/live_inputs/${args.uid}`;
			const response = await fetch(url, {
				method: "GET",
				headers: getCloudflareHeaders(apiToken),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Cloudflare API error: ${error}`);
			}

			const data = await response.json();
			const liveInput = data.result;

			// Extract stream key from rtmps object
			const streamKey = liveInput.rtmps?.streamKey || liveInput.streamKey;
			const rtmpUrl = liveInput.rtmps?.url || liveInput.rtmp?.url;
			const uid = liveInput.uid;

			// Extract WebRTC URLs from API response
			// The API returns webRTC.url and webRTCPlayback.url directly
			let webRtcPublishUrl = liveInput.webRTC?.url;
			let webRtcPlaybackUrl = liveInput.webRTCPlayback?.url;

			// Fallback: Construct URLs if not provided in response
			// Format: https://customer-{accountId}.cloudflarestream.com/{uid}/webRTC/publish
			if (!webRtcPublishUrl) {
				webRtcPublishUrl = `https://customer-${accountId}.cloudflarestream.com/${uid}/webRTC/publish`;
			}
			if (!webRtcPlaybackUrl) {
				webRtcPlaybackUrl = `https://customer-${accountId}.cloudflarestream.com/${uid}/webRTC/play`;
			}

			return {
				success: true,
				streamKey,
				rtmpUrl,
				uid,
				webRtcPublishUrl,
				webRtcPlaybackUrl,
			};
		} catch (error) {
			console.error("Error getting live input:", error);
			throw error instanceof Error
				? error
				: new Error("Unknown error getting live input");
		}
	},
});

/**
 * Get stream status from Cloudflare
 */
export const getStreamStatus = action({
	args: { streamId: v.string() },
	handler: async (ctx, args) => {
		const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
		const apiToken = process.env.CLOUDFLARE_API_TOKEN;

		if (!accountId || !apiToken) {
			throw new Error("Cloudflare credentials not configured");
		}

		try {
			const url = `${getCloudflareApiUrl(accountId)}/${args.streamId}`;
			const response = await fetch(url, {
				method: "GET",
				headers: getCloudflareHeaders(apiToken),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(`Cloudflare API error: ${error}`);
			}

			const data = await response.json();
			const stream = data.result;

			return {
				success: true,
				status: stream.status?.state || "unknown",
				playback: stream.playback,
				meta: stream.meta,
			};
		} catch (error) {
			console.error("Error getting stream status:", error);
			throw error instanceof Error
				? error
				: new Error("Unknown error getting stream status");
		}
	},
});

/**
 * Fetch live input details and update game with WebRTC URLs
 * Useful when a game has a streamId but missing webRtcPublishUrl
 * 
 * @param gameId - The game ID (required)
 * @param streamId - Optional streamId. If not provided, will be fetched from the game
 */
export const fetchAndUpdateLiveInput = action({
	args: { 
		gameId: v.id("games"),
		streamId: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<{
		success: boolean;
		webRtcPublishUrl: string;
		webRtcPlaybackUrl: string;
		rtmpUrl: string | undefined;
	}> => {
		let streamId: string | undefined = args.streamId;

		// If streamId not provided, get it from the game
		if (!streamId) {
			const game = await ctx.runQuery(api.games.getGame, {
				gameId: args.gameId,
			}) as { streamId?: string } | null;

			if (!game) {
				throw new Error("Game not found");
			}

			streamId = game.streamId ?? undefined;

			if (!streamId) {
				throw new Error("Game does not have a streamId. Create a live input first.");
			}
		}

		// Fetch live input details from Cloudflare
		const liveInputData = await ctx.runAction(api.streams.getLiveInput, {
			uid: streamId,
		}) as {
			success: boolean;
			streamKey: string;
			rtmpUrl: string | undefined;
			uid: string;
			webRtcPublishUrl: string;
			webRtcPlaybackUrl: string;
		};

		// Update the game with the fetched WebRTC URLs
		await ctx.runMutation(api.streams.updateGameStream, {
			gameId: args.gameId,
			streamKey: liveInputData.streamKey,
			streamUrl: liveInputData.rtmpUrl,
			webRtcPublishUrl: liveInputData.webRtcPublishUrl,
			webRtcPlaybackUrl: liveInputData.webRtcPlaybackUrl,
		});

		return {
			success: true,
			webRtcPublishUrl: liveInputData.webRtcPublishUrl,
			webRtcPlaybackUrl: liveInputData.webRtcPlaybackUrl,
			rtmpUrl: liveInputData.rtmpUrl,
		};
	},
});

/**
 * Update game with stream metadata
 */
export const updateGameStream = mutation({
	args: {
		gameId: v.id("games"),
		streamId: v.optional(v.string()),
		streamKey: v.optional(v.string()),
		streamStatus: v.optional(
			v.union(
				v.literal("upcoming"),
				v.literal("live"),
				v.literal("completed"),
				v.literal("failed"),
			),
		),
		streamUrl: v.optional(v.string()),
		webRtcPublishUrl: v.optional(v.string()),
		webRtcPlaybackUrl: v.optional(v.string()),
		streamStartTime: v.optional(v.number()),
		streamEndTime: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// TODO: Add authentication check (admin only)
		const updateData: Record<string, unknown> = {};

		if (args.streamId !== undefined) updateData.streamId = args.streamId;
		if (args.streamKey !== undefined) updateData.streamKey = args.streamKey;
		if (args.streamStatus !== undefined)
			updateData.streamStatus = args.streamStatus;
		if (args.streamUrl !== undefined) updateData.streamUrl = args.streamUrl;
		if (args.webRtcPublishUrl !== undefined)
			updateData.webRtcPublishUrl = args.webRtcPublishUrl;
		if (args.webRtcPlaybackUrl !== undefined)
			updateData.webRtcPlaybackUrl = args.webRtcPlaybackUrl;
		if (args.streamStartTime !== undefined)
			updateData.streamStartTime = args.streamStartTime;
		if (args.streamEndTime !== undefined)
			updateData.streamEndTime = args.streamEndTime;

		await ctx.db.patch(args.gameId, updateData);

		return { success: true };
	},
});

/**
 * Get stream information for a game
 * If webRtcPublishUrl is missing but streamId exists, construct it from the streamId
 */
export const getGameStream = query({
	args: {
		gameId: v.id("games"),
	},
	handler: async (ctx, args) => {
		const game = await ctx.db.get(args.gameId);
		if (!game) {
			throw new Error("Game not found");
		}

		// If webRtcPublishUrl is missing but we have streamId, construct it
		// Note: This is a computed value, not stored in DB. The URL should be
		// stored when the live input is created via createLiveInput action.
		let webRtcPublishUrl = game.webRtcPublishUrl;
		let webRtcPlaybackUrl = game.webRtcPlaybackUrl;

		if (!webRtcPublishUrl && game.streamId) {
			const accountId = process.env.CLOUDFLARE_READ_ONLY_ACCOUNT_ID;
			if (accountId) {
				// Construct URLs from streamId (uid) - these can be computed
				webRtcPublishUrl = `https://customer-${accountId}.cloudflarestream.com/${game.streamId}/whip`;
				webRtcPlaybackUrl = `https://customer-${accountId}.cloudflarestream.com/${game.streamId}/whep`;
			}
		}

		return {
			streamId: game.streamId,
			streamStatus: game.streamStatus,
			streamUrl: game.streamUrl,
			webRtcPublishUrl,
			webRtcPlaybackUrl,
			streamStartTime: game.streamStartTime,
			streamEndTime: game.streamEndTime,
			// Don't return streamKey to client (security)
		};
	},
});

/**
 * Check if any game currently has a live stream
 * Returns the game ID if one exists, null otherwise
 */
export const getActiveStream = query({
	args: {},
	handler: async (ctx) => {
		const gamesWithLiveStream = await ctx.db
			.query("games")
			.withIndex("streamStatus", (q) => q.eq("streamStatus", "live"))
			.first();

		return gamesWithLiveStream?._id || null;
	},
});


