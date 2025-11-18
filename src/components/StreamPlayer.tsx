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
 * - WebRTC (WHEP) low-latency playback for live streams
 */

import type { FC } from "react";
import { useEffect, useState, useRef } from "react";
import { WHEPClient } from "@/lib/whep-client";
import { Stream } from "@cloudflare/stream-react";
// import { env } from "@/env";

export interface StreamPlayerProps {
	streamId?: string | null;
	streamUrl?: string | null;
	webRtcPlaybackUrl?: string | null;
	streamStatus?: "upcoming" | "live" | "completed" | "failed" | null;
	className?: string;
	autoPlay?: boolean;
}

export const StreamPlayer: FC<StreamPlayerProps> = ({
	streamId,
	streamUrl,
	webRtcPlaybackUrl,
	streamStatus,
	className = "",
	autoPlay = false,
}) => {
	const [error, setError] = useState<string | null>(null);
	const [useWebRtc, setUseWebRtc] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);
	const whepClientRef = useRef<WHEPClient | null>(null);

	// Helper function to extract account ID from Cloudflare URLs
	const extractAccountId = (url: string | null | undefined): string | null => {
		if (!url) return null;
		const match = url.match(/customer-([^/]+)\.cloudflarestream\.com/);
		return match ? match[1] : null;
	};

	// Get account ID from env var or extract from URLs
	const getAccountId = (): string | null => {
		const envAccountId = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
		if (envAccountId) return envAccountId;

		// Try to extract from webRtcPlaybackUrl or streamUrl
		return extractAccountId(webRtcPlaybackUrl) || extractAccountId(streamUrl);
	};

	// Validate configuration
	useEffect(() => {
		if (!streamId && !streamUrl && !webRtcPlaybackUrl) {
			return;
		}

		const accountId = getAccountId();
		if (!accountId && !webRtcPlaybackUrl) {
			setError("Cloudflare account not configured");
		} else {
			setError(null); // Clear error if we have account ID or webRtcPlaybackUrl
		}
	}, [streamId, streamUrl, webRtcPlaybackUrl]);

	// Use WebRTC for live streams if available
	useEffect(() => {
		if (
			webRtcPlaybackUrl &&
			streamStatus === "live" &&
			videoRef.current &&
			!whepClientRef.current
		) {
			setUseWebRtc(true);
			const whepClient = new WHEPClient(webRtcPlaybackUrl, videoRef.current);
			whepClientRef.current = whepClient;

			whepClient.play().catch((err) => {
				console.error("WHEP playback error:", err);
				setError("Failed to start WebRTC playback");
				setUseWebRtc(false);
				whepClientRef.current = null;
			});
		}

		return () => {
			if (whepClientRef.current) {
				whepClientRef.current.stop().catch(console.error);
				whepClientRef.current = null;
			}
		};
	}, [webRtcPlaybackUrl, streamStatus]);

	// No stream configured
	if (!streamId && !streamUrl && !webRtcPlaybackUrl) {
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

	// WebRTC playback (WHEP) for live streams
	if (useWebRtc && webRtcPlaybackUrl && videoRef.current) {
		return (
			<div
				className={`bg-black rounded-lg overflow-hidden aspect-video ${className}`}
			>
				<video
					ref={videoRef}
					autoPlay
					playsInline
					controls
					className="w-full h-full"
					onError={(e) => {
						console.error("Video playback error:", e);
						setError("Failed to play video stream");
					}}
				/>
			</div>
		);
	}

	// Build iframe URL for Cloudflare Stream player
	const accountId = getAccountId();
	let iframeSrc: string | undefined;

	// Try to build iframe URL from webRtcPlaybackUrl first
	if (webRtcPlaybackUrl) {
		const match = webRtcPlaybackUrl.match(
			/customer-([^/]+)\.cloudflarestream\.com\/([^/]+)\//,
		);
		if (match && match[1] && match[2]) {
			const extractedAccountId = match[1];
			const extractedStreamId = match[2];
			const params = new URLSearchParams();
			if (autoPlay && streamStatus === "live") {
				params.set("autoplay", "true");
			}
			params.set("preload", "true");

			// Get poster/thumbnail URL if we have streamId
			if (streamId || extractedStreamId) {
				const posterStreamId = streamId || extractedStreamId;
				const posterUrl = `https://customer-${extractedAccountId}.cloudflarestream.com/${posterStreamId}/thumbnails/thumbnail.jpg?time=&height=600`;
				params.set("poster", posterUrl);
			}

			iframeSrc = `https://customer-${extractedAccountId}.cloudflarestream.com/${extractedStreamId}/iframe?${params.toString()}`;
		}
	} else if (streamUrl) {
		// If we have a streamUrl (HLS manifest), try to extract stream ID and account ID
		// Format: https://customer-<CODE>.cloudflarestream.com/<STREAM_ID>/manifest/video.m3u8
		const match = streamUrl.match(
			/customer-([^/]+)\.cloudflarestream\.com\/([^/]+)\//,
		);
		if (match && match[1] && match[2]) {
			const extractedAccountId = match[1];
			const extractedStreamId = match[2];
			const params = new URLSearchParams();
			if (autoPlay && streamStatus === "live") {
				params.set("autoplay", "true");
			}
			params.set("preload", "true");
			iframeSrc = `https://customer-${extractedAccountId}.cloudflarestream.com/${extractedStreamId}/iframe?${params.toString()}`;
		}
	} else if (streamId && accountId) {
		// Fallback: use streamId and accountId if available
		const params = new URLSearchParams();
		if (autoPlay && streamStatus === "live") {
			params.set("autoplay", "true");
		}
		params.set("preload", "true");
		const posterUrl = `https://customer-${accountId}.cloudflarestream.com/${streamId}/thumbnails/thumbnail.jpg?time=&height=600`;
		params.set("poster", posterUrl);
		iframeSrc = `https://customer-${accountId}.cloudflarestream.com/${streamId}/iframe?${params.toString()}`;
	}

	// Player container - use iframe embed
	if (!iframeSrc) {
		// If we have stream data but can't build iframe, show a message
		if (streamId || streamUrl || webRtcPlaybackUrl) {
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
						<p className="text-sm">Stream configuration incomplete</p>
						<p className="text-xs text-gray-400 mt-1">
							{!accountId &&
								!webRtcPlaybackUrl &&
								!streamUrl &&
								"Cloudflare account not configured"}
							{(accountId || webRtcPlaybackUrl || streamUrl) &&
								"Unable to build stream URL"}
						</p>
					</div>
				</div>
			);
		}
		return null;
	}

	return (
		<div
			className={`bg-black rounded-lg overflow-hidden aspect-video ${className}`}
			style={{ position: "relative", paddingTop: "56.25%" }}
		>
			<iframe
				src={iframeSrc}
				loading="lazy"
				style={{
					border: "none",
					position: "absolute",
					top: 0,
					left: 0,
					height: "100%",
					width: "100%",
					objectFit: "fill",
					objectPosition: "center",
				}}
				allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
				allowFullScreen={true}
				title="Stream Player"
				onError={() => {
					console.error("Iframe load error");
					setError("Failed to load video stream");
				}}
			/>
		</div>
	);
};
