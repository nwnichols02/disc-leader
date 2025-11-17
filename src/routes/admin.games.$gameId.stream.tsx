/**
 * Admin Stream Management Page
 *
 * Allows admins to manage Cloudflare Stream for a specific game.
 * Features:
 * - Create live input and get stream credentials
 * - Display stream key and RTMP endpoint
 * - Monitor stream status
 * - Start/stop stream recording
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Copy, Check, Play, Square, Loader2 } from "lucide-react";
import { useAction } from "convex/react";

export const Route = createFileRoute("/admin/games/$gameId/stream")({
	component: StreamManagementPage,
});

function StreamManagementPage() {
	const { gameId } = Route.useParams();
	const [copiedField, setCopiedField] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);

	// Fetch game data
	const game = useQuery(api.games.getGame, {
		gameId: gameId as Id<"games">,
	});

	// Fetch stream info
	const streamInfo = useQuery(api.streams.getGameStream, {
		gameId: gameId as Id<"games">,
	});

	// Mutations and Actions
	const updateStream = useMutation(api.streams.updateGameStream);
	const createLiveInputAction = useAction(api.streams.createLiveInput);

	// Copy to clipboard
	const copyToClipboard = async (text: string, field: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			setTimeout(() => setCopiedField(null), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	// Create live input
	const handleCreateLiveInput = async () => {
		setIsCreating(true);
		try {
			// Call Convex action to create live input
			const data = await createLiveInputAction({});

			// Update game with stream info
			await updateStream({
				gameId: gameId as Id<"games">,
				streamKey: data.streamKey,
				streamStatus: "upcoming",
				streamStartTime: Date.now(),
			});

			// Store RTMP URL in a way that can be displayed
			// Note: In production, you might want to store this in the database
			alert(
				`Live input created!\n\nRTMP URL: ${data.rtmpUrl}\n\nStream Key: ${data.streamKey}\n\nPlease save these credentials.`,
			);
		} catch (error) {
			console.error("Error creating live input:", error);
			alert(
				error instanceof Error ? error.message : "Failed to create live input",
			);
		} finally {
			setIsCreating(false);
		}
	};

	// Update stream status
	const handleUpdateStatus = async (
		status: "upcoming" | "live" | "completed" | "failed",
	) => {
		try {
			await updateStream({
				gameId: gameId as Id<"games">,
				streamStatus: status,
				...(status === "live" && { streamStartTime: Date.now() }),
				...(status === "completed" && { streamEndTime: Date.now() }),
			});
		} catch (error) {
			console.error("Error updating stream status:", error);
			alert("Failed to update stream status");
		}
	};

	if (!game) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 px-4 py-4">
				<div className="max-w-4xl mx-auto">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Stream Management
							</h1>
							<p className="text-sm text-gray-600 mt-1">
								{game.homeTeam?.name} vs {game.awayTeam?.name}
							</p>
						</div>
						<Link
							to="/admin/games"
							className="text-sm text-gray-600 hover:text-gray-900"
						>
							← Back to Games
						</Link>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="max-w-4xl mx-auto px-4 py-6">
				{/* Stream Status Card */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						Stream Status
					</h2>

					{!streamInfo?.streamKey ? (
						<div className="text-center py-8">
							<p className="text-gray-600 mb-4">
								No stream configured for this game
							</p>
							<button
								onClick={handleCreateLiveInput}
								disabled={isCreating}
								className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isCreating ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Play className="w-4 h-4 mr-2" />
										Create Live Input
									</>
								)}
							</button>
						</div>
					) : (
						<div className="space-y-4">
							{/* Current Status */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Status
								</label>
								<div className="flex items-center gap-3">
									<span
										className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
											streamInfo.streamStatus === "live"
												? "bg-red-100 text-red-800"
												: streamInfo.streamStatus === "upcoming"
													? "bg-blue-100 text-blue-800"
													: streamInfo.streamStatus === "completed"
														? "bg-green-100 text-green-800"
														: "bg-gray-100 text-gray-800"
										}`}
									>
										{streamInfo.streamStatus || "Not started"}
									</span>
									{streamInfo.streamStatus === "upcoming" && (
										<button
											onClick={() => handleUpdateStatus("live")}
											className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
										>
											<Play className="w-3 h-3 mr-1" />
											Start Stream
										</button>
									)}
									{streamInfo.streamStatus === "live" && (
										<button
											onClick={() => handleUpdateStatus("completed")}
											className="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
										>
											<Square className="w-3 h-3 mr-1" />
											End Stream
										</button>
									)}
								</div>
							</div>

							{/* Stream Key */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Stream Key
								</label>
								<div className="flex items-center gap-2">
									<input
										type="text"
										readOnly
										value={game.streamKey || ""}
										className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
									/>
									<button
										onClick={() => copyToClipboard(game.streamKey || "", "key")}
										className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
										title="Copy stream key"
									>
										{copiedField === "key" ? (
											<Check className="w-4 h-4 text-green-600" />
										) : (
											<Copy className="w-4 h-4" />
										)}
									</button>
								</div>
								<p className="text-xs text-gray-500 mt-1">
									Use this key with your streaming software (OBS, etc.)
								</p>
							</div>

							{/* RTMP Endpoint */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									RTMP Endpoint
								</label>
								<div className="flex items-center gap-2">
									<input
										type="text"
										readOnly
										value="rtmps://live.cloudflare.com:443/live/"
										className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
									/>
									<button
										onClick={() =>
											copyToClipboard(
												"rtmps://live.cloudflare.com:443/live/",
												"rtmp",
											)
										}
										className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
										title="Copy RTMP endpoint"
									>
										{copiedField === "rtmp" ? (
											<Check className="w-4 h-4 text-green-600" />
										) : (
											<Copy className="w-4 h-4" />
										)}
									</button>
								</div>
								<p className="text-xs text-gray-500 mt-1">
									Stream URL for your broadcasting software
								</p>
							</div>

							{/* Stream URL (for playback) */}
							{streamInfo.streamUrl && (
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Playback URL
									</label>
									<div className="flex items-center gap-2">
										<input
											type="text"
											readOnly
											value={streamInfo.streamUrl}
											className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
										/>
										<button
											onClick={() =>
												copyToClipboard(streamInfo.streamUrl || "", "url")
											}
											className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
											title="Copy playback URL"
										>
											{copiedField === "url" ? (
												<Check className="w-4 h-4 text-green-600" />
											) : (
												<Copy className="w-4 h-4" />
											)}
										</button>
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Instructions Card */}
				<div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
					<h3 className="text-lg font-semibold text-blue-900 mb-3">
						How to Stream
					</h3>
					<ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
						<li>Click "Create Live Input" to generate stream credentials</li>
						<li>Copy the Stream Key and RTMP Endpoint</li>
						<li>
							Configure your streaming software (OBS Studio, etc.) with:
							<ul className="list-disc list-inside ml-6 mt-1">
								<li>
									<strong>Server:</strong> rtmps://live.cloudflare.com:443/live/
								</li>
								<li>
									<strong>Stream Key:</strong> (use the key shown above)
								</li>
							</ul>
						</li>
						<li>Start streaming from your software</li>
						<li>Click "Start Stream" above when ready to go live</li>
						<li>
							The stream will appear on the public game page automatically
						</li>
					</ol>
				</div>
			</main>
		</div>
	);
}
