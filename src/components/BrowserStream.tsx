/**
 * BrowserStream Component
 *
 * Captures video/audio from the user's browser using MediaDevices API
 * and streams it to Cloudflare Stream.
 *
 * Features:
 * - Camera and microphone capture
 * - Live preview
 * - Start/stop streaming controls
 * - Error handling and permissions
 */

import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { Video, VideoOff, Mic, MicOff, Loader2, X } from "lucide-react";
import { env } from "@/env";

export interface BrowserStreamProps {
	streamKey: string;
	rtmpUrl?: string;
	onStreamStart?: () => void;
	onStreamStop?: () => void;
	onError?: (error: string) => void;
}

export const BrowserStream: FC<BrowserStreamProps> = ({
	streamKey,
	rtmpUrl,
	onStreamStart,
	onStreamStop,
	onError,
}) => {
	const [isStreaming, setIsStreaming] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [videoEnabled, setVideoEnabled] = useState(true);
	const [audioEnabled, setAudioEnabled] = useState(true);

	const videoRef = useRef<HTMLVideoElement>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const websocketRef = useRef<WebSocket | null>(null);

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

			return stream;
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to access camera/microphone";
			setError(errorMessage);
			onError?.(errorMessage);

			// Handle specific permission errors
			if (err instanceof DOMException) {
				if (err.name === "NotAllowedError") {
					setError("Camera/microphone permission denied");
				} else if (err.name === "NotFoundError") {
					setError("No camera/microphone found");
				} else if (err.name === "NotReadableError") {
					setError("Camera/microphone is already in use");
				}
			}

			return null;
		}
	};

	// Start streaming
	const startStream = async () => {
		if (isStreaming) return;

		setIsLoading(true);
		setError(null);

		try {
			// Request media access
			const stream = await requestMediaAccess();
			if (!stream) {
				setIsLoading(false);
				return;
			}

			mediaStreamRef.current = stream;

			// For browser-based streaming to Cloudflare, we have a few options:
			// 1. Use MediaRecorder + WebSocket to send chunks
			// 2. Use WebRTC (if Cloudflare supports it)
			// 3. Use a library like HLS.js or similar

			// Use MediaRecorder to capture video chunks
			// Then send via WebSocket to backend server that forwards to Cloudflare RTMP
			const options: MediaRecorderOptions = {
				mimeType: "video/webm;codecs=vp8,opus",
				videoBitsPerSecond: 2500000, // 2.5 Mbps
			};

			// Check if the mime type is supported
			if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
				// Try alternative codecs
				if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
					options.mimeType = "video/webm;codecs=vp9,opus";
				} else if (MediaRecorder.isTypeSupported("video/webm")) {
					options.mimeType = "video/webm";
				} else {
					// Fallback to default
					delete options.mimeType;
				}
			}

			const mediaRecorder = new MediaRecorder(stream, options);
			mediaRecorderRef.current = mediaRecorder;

			// Connect to WebSocket server for streaming
			// Note: You'll need to set up a WebSocket server that:
			// 1. Receives WebM chunks from browser
			// 2. Converts to RTMP format (using ffmpeg or similar)
			// 3. Sends to Cloudflare RTMP endpoint: rtmps://live.cloudflare.com:443/live/{streamKey}
			const wsUrl =
				env.VITE_WEBSOCKET_STREAM_URL || "ws://localhost:8080/stream";

			try {
				const ws = new WebSocket(
					`${wsUrl}?streamKey=${encodeURIComponent(streamKey)}`,
				);
				websocketRef.current = ws;

				ws.onopen = () => {
					console.log("WebSocket connected for streaming");
				};

				ws.onerror = (error) => {
					console.error("WebSocket error:", error);
					setError("Failed to connect to streaming server");
					stopStream();
				};

				ws.onclose = () => {
					console.log("WebSocket closed");
				};

				// Handle data chunks - send to WebSocket server
				mediaRecorder.ondataavailable = (event) => {
					if (
						event.data &&
						event.data.size > 0 &&
						ws.readyState === WebSocket.OPEN
					) {
						// Send chunk as ArrayBuffer for efficient transfer
						event.data.arrayBuffer().then((buffer) => {
							ws.send(buffer);
						});
					}
				};

				mediaRecorder.onerror = (event) => {
					console.error("MediaRecorder error:", event);
					setError("Recording error occurred");
					stopStream();
				};

				mediaRecorder.onstop = () => {
					if (ws.readyState === WebSocket.OPEN) {
						ws.close();
					}
				};

				// Start recording - send chunks every 500ms for low latency
				mediaRecorder.start(500);
			} catch (err) {
				console.error("Error setting up WebSocket:", err);
				setError("Failed to set up streaming connection");
				stopStream();
				return;
			}

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
	const stopStream = () => {
		if (!isStreaming && !mediaStreamRef.current) return;

		// Stop MediaRecorder
		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state !== "inactive"
		) {
			mediaRecorderRef.current.stop();
		}

		// Stop all tracks
		if (mediaStreamRef.current) {
			mediaStreamRef.current.getTracks().forEach((track) => {
				track.stop();
			});
			mediaStreamRef.current = null;
		}

		// Close WebSocket if open
		if (websocketRef.current) {
			websocketRef.current.close();
			websocketRef.current = null;
		}

		// Clear video preview
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}

		setIsStreaming(false);
		onStreamStop?.();
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
					{!videoEnabled && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-900">
							<VideoOff className="w-16 h-16 text-gray-400" />
						</div>
					)}
					{!mediaStreamRef.current && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-900">
							<div className="text-center text-white">
								<Video className="w-16 h-16 mx-auto mb-2 text-gray-400" />
								<p className="text-sm">Camera preview will appear here</p>
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

					{/* Start/Stop Button */}
					<div className="flex-1 flex justify-end">
						{!isStreaming ? (
							<button
								onClick={startStream}
								disabled={isLoading}
								className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							>
								{isLoading ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Video className="w-4 h-4" />
								)}
								<span className="font-medium">
									{isLoading ? "Starting..." : "Start Streaming"}
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
							Video and audio are being captured and sent to Cloudflare Stream.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};
