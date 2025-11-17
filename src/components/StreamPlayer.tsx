/**
 * StreamPlayer Component
 *
 * Displays Cloudflare Stream video player for live game broadcasts.
 * Supports both live streams and recorded videos.
 *
 * Features:
 * - Responsive design (mobile-first)
 * - Loading and error states
 * - Auto-play for live streams (with user permission)
 * - HLS adaptive bitrate streaming
 */

import type { FC } from "react";
import { useEffect, useState } from "react";
import { Stream } from "@cloudflare/stream-react";
// import { env } from "@/env";

export interface StreamPlayerProps {
	streamId?: string | null;
	streamUrl?: string | null;
	streamStatus?: "upcoming" | "live" | "completed" | "failed" | null;
	className?: string;
	autoPlay?: boolean;
}

export const StreamPlayer: FC<StreamPlayerProps> = ({
	streamId,
	streamUrl,
	streamStatus,
	className = "",
	autoPlay = false,
}) => {
	const [error, setError] = useState<string | null>(null);

	// Validate configuration
	useEffect(() => {
		if (!streamId && !streamUrl) {
			return;
		}

		const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
		if (!accountId) {
			setError("Cloudflare account not configured");
		}
	}, [streamId, streamUrl]);

	// No stream configured
	if (!streamId && !streamUrl) {
		return (
			<div
				className={`bg-gray-100 rounded-lg flex items-center justify-center aspect-video ${className}`}
			>
				<div className="text-center text-gray-500 p-6">
					<svg
						className="w-12 h-12 mx-auto mb-2 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
					<p className="text-sm">No stream available</p>
				</div>
			</div>
		);
	}

	// Stream starting soon
	if (streamStatus === "upcoming") {
		return (
			<div
				className={`bg-gray-900 rounded-lg flex items-center justify-center aspect-video ${className}`}
			>
				<div className="text-center text-white p-6">
					<svg
						className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-pulse"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p className="text-lg font-medium mb-2">Stream Starting Soon</p>
					<p className="text-sm text-gray-400">
						The live broadcast will begin shortly
					</p>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div
				className={`bg-red-50 rounded-lg flex items-center justify-center aspect-video border border-red-200 ${className}`}
			>
				<div className="text-center p-6">
					<svg
						className="w-12 h-12 mx-auto mb-2 text-red-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p className="text-sm text-red-600 font-medium mb-1">Stream Error</p>
					<p className="text-xs text-red-500">{error}</p>
				</div>
			</div>
		);
	}

	// Build stream source URL
	const accountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
	let streamSrc: string | undefined;

	if (streamId && accountId) {
		streamSrc = `https://customer-${accountId}.cloudflarestream.com/${streamId}/manifest/video.m3u8`;
	} else if (streamUrl) {
		streamSrc = streamUrl;
	}

	// Player container
	if (!streamSrc) {
		return null;
	}

	return (
		<div
			className={`bg-black rounded-lg overflow-hidden aspect-video ${className}`}
		>
			<Stream
				src={streamSrc}
				autoplay={autoPlay && streamStatus === "live"}
				controls
				preload="auto"
				responsive
				primaryColor="#3b82f6"
				onError={(err) => {
					console.error("Stream player error:", err);
					setError("Failed to load video stream");
				}}
			/>
			<div style={{ position: "relative", paddingTop: "56.25%" }}>
				<iframe
					title="Stream Player"
					src="https://customer-zcky1xy945hsqbb7.cloudflarestream.com/0f7191c6b50e083db64e869f96fbf4cb/iframe"
					style={{
						border: "none",
						position: "absolute",
						top: 0,
						left: 0,
						height: "100%",
						width: "100%",
					}}
					allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
					allowFullScreen={true}
				></iframe>
			</div>
		</div>
	);
};
