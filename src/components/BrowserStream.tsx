/**
 * BrowserStream Component
 *
 * Captures video/audio from the user's browser using MediaDevices API
 * and streams it to Cloudflare Stream using WHIP (WebRTC-HTTP Ingestion Protocol).
 *
 * Features:
 * - Camera and microphone capture
 * - Live preview
 * - Start/stop streaming controls
 * - Error handling and permissions
 * - Direct browser-to-Cloudflare streaming via WebRTC
 */

import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, Loader2, X } from "lucide-react";
import { WHIPClient } from "@/lib/whip-client";

export interface BrowserStreamProps {
	webRtcPublishUrl: string;
	onStreamStart?: () => void;
	onStreamStop?: () => void;
	onError?: (error: string) => void;
}

export const BrowserStream: FC<BrowserStreamProps> = ({
	webRtcPublishUrl,
	onStreamStart,
	onStreamStop,
	onError,
}) => {
	const [isStreaming, setIsStreaming] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isRequestingAccess, setIsRequestingAccess] = useState(false);
	const [hasAccess, setHasAccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [videoEnabled, setVideoEnabled] = useState(true);
	const [audioEnabled, setAudioEnabled] = useState(true);

	const videoRef = useRef<HTMLVideoElement>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const whipClientRef = useRef<WHIPClient | null>(null);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopStream();
		};
	}, []);

	// Request camera and microphone access
	const requestMediaAccess = async (): Promise<MediaStream | null> => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: videoEnabled
					? {
							width: { ideal: 1280 },
							height: { ideal: 720 },
							facingMode: "user",
						}
					: false,
				audio: audioEnabled,
			});

			// Show preview
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}

			setHasAccess(true);
			return stream;
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to access camera/microphone";
			setError(errorMessage);
			onError?.(errorMessage);
			setHasAccess(false);

			// Handle specific permission errors
			if (err instanceof DOMException) {
				if (err.name === "NotAllowedError") {
					setError(
						"Camera/microphone permission denied. Please allow access in your browser settings.",
					);
				} else if (err.name === "NotFoundError") {
					setError("No camera/microphone found on this device");
				} else if (err.name === "NotReadableError") {
					setError(
						"Camera/microphone is already in use by another application",
					);
				} else if (err.name === "OverconstrainedError") {
					setError("Camera doesn't support the requested settings");
				}
			}

			return null;
		}
	};

	// Request camera/mic access for preview
	const requestAccess = async () => {
		setIsRequestingAccess(true);
		setError(null);

		const stream = await requestMediaAccess();
		if (!stream) {
			setIsRequestingAccess(false);
			return;
		}

		mediaStreamRef.current = stream;
		setIsRequestingAccess(false);
	};

	// Start streaming
	const startStream = async () => {
		if (isStreaming) return;

		if (!webRtcPublishUrl) {
			setError("WebRTC publish URL not configured");
			onError?.("WebRTC publish URL not configured");
			return;
		}

		// Ensure we have media access
		if (!mediaStreamRef.current || !hasAccess) {
			setError("Please enable camera access first");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Create WHIP client
			const whipClient = new WHIPClient(
				webRtcPublishUrl,
				videoRef.current || undefined,
			);
			whipClientRef.current = whipClient;

			// Start publishing stream via WHIP
			await whipClient.publish(mediaStreamRef.current);

			setIsStreaming(true);
			setIsLoading(false);
			onStreamStart?.();
		} catch (err) {
			console.error("Error starting stream:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to start streaming";
			setError(errorMessage);
			onError?.(errorMessage);
			setIsLoading(false);
			stopStream();
		}
	};

	// Stop streaming
	const stopStream = async () => {
		if (!isStreaming && !mediaStreamRef.current && !whipClientRef.current) {
			return;
		}

		// Stop WHIP client
		if (whipClientRef.current) {
			try {
				await whipClientRef.current.stop();
			} catch (err) {
				console.error("Error stopping WHIP client:", err);
			}
			whipClientRef.current = null;
		}

		// Stop all tracks
		if (mediaStreamRef.current) {
			mediaStreamRef.current.getTracks().forEach((track) => {
				track.stop();
			});
			mediaStreamRef.current = null;
		}

		// Clear video preview only if stopping stream (not just revoking access)
		if (videoRef.current && isStreaming) {
			videoRef.current.srcObject = null;
		}

		setIsStreaming(false);
		onStreamStop?.();
	};

	// Revoke camera access (stop preview but don't stop stream if active)
	const revokeAccess = async () => {
		if (isStreaming) {
			setError("Cannot revoke access while streaming. Stop the stream first.");
			return;
		}

		if (mediaStreamRef.current) {
			mediaStreamRef.current.getTracks().forEach((track) => {
				track.stop();
			});
			mediaStreamRef.current = null;
		}

		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}

		setHasAccess(false);
	};

	// Toggle video
	const toggleVideo = () => {
		if (mediaStreamRef.current) {
			const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !videoEnabled;
				setVideoEnabled(!videoEnabled);
			}
		}
	};

	// Toggle audio
	const toggleAudio = () => {
		if (mediaStreamRef.current) {
			const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !audioEnabled;
				setAudioEnabled(!audioEnabled);
			}
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div className="space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">
						Browser Stream
					</h3>
					{error && (
						<button
							onClick={() => setError(null)}
							className="text-gray-400 hover:text-gray-600"
						>
							<X className="w-4 h-4" />
						</button>
					)}
				</div>

				{/* Error Message */}
				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-3">
						<p className="text-sm text-red-600">{error}</p>
					</div>
				)}

				{/* Video Preview */}
				<div className="relative bg-black rounded-lg overflow-hidden aspect-video">
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="w-full h-full object-cover"
					/>
					{!videoEnabled && hasAccess && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-900">
							<VideoOff className="w-16 h-16 text-gray-400" />
						</div>
					)}
					{!hasAccess && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-900">
							<div className="text-center text-white">
								<Video className="w-16 h-16 mx-auto mb-2 text-gray-400" />
								<p className="text-sm mb-4">Camera preview will appear here</p>
								<button
									onClick={requestAccess}
									disabled={isRequestingAccess}
									className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
								>
									{isRequestingAccess ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin" />
											Requesting access...
										</>
									) : (
										<>
											<Video className="w-4 h-4" />
											Enable Camera & Microphone
										</>
									)}
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Controls */}
				<div className="flex items-center gap-2">
					{/* Video Toggle */}
					<button
						onClick={toggleVideo}
						disabled={!isStreaming}
						className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
							videoEnabled
								? "bg-blue-100 text-blue-700 hover:bg-blue-200"
								: "bg-gray-100 text-gray-600 hover:bg-gray-200"
						} disabled:opacity-50 disabled:cursor-not-allowed`}
					>
						{videoEnabled ? (
							<Video className="w-4 h-4" />
						) : (
							<VideoOff className="w-4 h-4" />
						)}
						<span className="text-sm font-medium">Video</span>
					</button>

					{/* Audio Toggle */}
					<button
						onClick={toggleAudio}
						disabled={!isStreaming}
						className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
							audioEnabled
								? "bg-blue-100 text-blue-700 hover:bg-blue-200"
								: "bg-gray-100 text-gray-600 hover:bg-gray-200"
						} disabled:opacity-50 disabled:cursor-not-allowed`}
					>
						{audioEnabled ? (
							<Mic className="w-4 h-4" />
						) : (
							<MicOff className="w-4 h-4" />
						)}
						<span className="text-sm font-medium">Audio</span>
					</button>

					{/* Access Control */}
					{hasAccess && !isStreaming && (
						<button
							onClick={revokeAccess}
							className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
						>
							Revoke Access
						</button>
					)}

					{/* Start/Stop Button */}
					<div className="flex-1 flex justify-end">
						{!isStreaming ? (
							<button
								onClick={startStream}
								disabled={isLoading || !hasAccess}
								className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{isLoading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Video className="w-4 h-4" />
								)}
								<span className="font-medium">
									{isLoading
										? "Starting..."
										: !hasAccess
											? "Enable Camera First"
											: "Start Streaming"}
								</span>
							</button>
						) : (
							<button
								onClick={stopStream}
								className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
							>
								<VideoOff className="w-4 h-4" />
								<span className="font-medium">Stop Streaming</span>
							</button>
						)}
					</div>
				</div>

				{/* Info */}
				{isStreaming && (
					<div className="bg-green-50 border border-green-200 rounded-lg p-3">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
							<p className="text-sm text-green-800 font-medium">
								Streaming active
							</p>
						</div>
						<p className="text-xs text-green-600 mt-1">
							Video and audio are being streamed directly to Cloudflare Stream
							via WebRTC.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
