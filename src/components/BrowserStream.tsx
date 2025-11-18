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
	onCanvasStreamReady?: (stream: MediaStream | null) => void;
	onStreamingStateChange?: (isStreaming: boolean) => void;
	useCanvas?: boolean;
}

export const BrowserStream: FC<BrowserStreamProps> = ({
	webRtcPublishUrl,
	onStreamStart,
	onStreamStop,
	onError,
	onCanvasStreamReady,
	onStreamingStateChange,
	useCanvas = false,
}) => {
	const [isStreaming, setIsStreaming] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isRequestingAccess, setIsRequestingAccess] = useState(false);
	const [hasAccess, setHasAccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [videoEnabled, setVideoEnabled] = useState(true);
	const [audioEnabled, setAudioEnabled] = useState(true);

	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const canvasStreamRef = useRef<MediaStream | null>(null);
	const whipClientRef = useRef<WHIPClient | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	// Store callback in ref to avoid dependency issues
	const onCanvasStreamReadyRef = useRef(onCanvasStreamReady);

	// Update callback ref when it changes
	useEffect(() => {
		onCanvasStreamReadyRef.current = onCanvasStreamReady;
	}, [onCanvasStreamReady]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			stopStream();
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, []);

	// Canvas rendering loop
	useEffect(() => {
		if (
			!useCanvas ||
			!canvasRef.current ||
			!videoRef.current ||
			!hasAccess ||
			!mediaStreamRef.current
		) {
			return;
		}

		const canvas = canvasRef.current;
		const video = videoRef.current;
		const ctx = canvas.getContext("2d");

		if (!ctx) {
			return;
		}

		// Set canvas size to match video
		const updateCanvasSize = () => {
			if (video.videoWidth && video.videoHeight) {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
			}
		};

		updateCanvasSize();

		// Create canvas stream if supported
		let canvasStream: MediaStream | null = null;
		if (canvas.captureStream && mediaStreamRef.current) {
			try {
				canvasStream = canvas.captureStream(30); // 30 FPS

				// Add audio tracks from the original media stream to canvas stream
				// Canvas only captures video, so we need to add audio separately
				if (canvasStream) {
					const audioTracks = mediaStreamRef.current.getAudioTracks();
					audioTracks.forEach((track) => {
						canvasStream!.addTrack(track);
					});

					canvasStreamRef.current = canvasStream;
					onCanvasStreamReadyRef.current?.(canvasStream);
				}
			} catch (err) {
				console.error("Failed to create canvas stream:", err);
			}
		}

		// Render loop - continuously draw video frames to canvas
		const drawFrame = () => {
			if (
				video.readyState >= video.HAVE_CURRENT_DATA &&
				video.videoWidth > 0 &&
				video.videoHeight > 0
			) {
				updateCanvasSize();
				// Clear canvas before drawing to avoid artifacts
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			}
			animationFrameRef.current = requestAnimationFrame(drawFrame);
		};

		// Start rendering when video is ready
		const handleLoadedMetadata = () => {
			updateCanvasSize();
			// Start the render loop immediately
			drawFrame();
		};

		const handleCanPlay = () => {
			// Ensure canvas is rendering when video can play
			if (animationFrameRef.current === null) {
				drawFrame();
			}
		};

		video.addEventListener("loadedmetadata", handleLoadedMetadata);
		video.addEventListener("canplay", handleCanPlay);

		// Start immediately if video is already ready
		if (video.readyState >= video.HAVE_METADATA) {
			handleLoadedMetadata();
		}

		// Also start if video can play
		if (video.readyState >= video.HAVE_CURRENT_DATA) {
			handleCanPlay();
		}

		return () => {
			video.removeEventListener("loadedmetadata", handleLoadedMetadata);
			video.removeEventListener("canplay", handleCanPlay);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			if (canvasStream) {
				canvasStream.getTracks().forEach((track) => track.stop());
				canvasStreamRef.current = null;
				onCanvasStreamReadyRef.current?.(null);
			}
		};
	}, [useCanvas, hasAccess]);

	// Request camera and microphone access
	const requestMediaAccess = async (): Promise<MediaStream | null> => {
		setIsRequestingAccess(true);
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

			// Store the stream reference
			mediaStreamRef.current = stream;

			// Show preview
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
			}

			setHasAccess(true);
			setIsRequestingAccess(false);
			return stream;
		} catch (err) {
			setIsRequestingAccess(false);
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

	// Setup camera - requests camera access
	const setupCamera = async () => {
		if (isRequestingAccess || hasAccess) return;

		setIsRequestingAccess(true);
		setError(null);

		const stream = await requestMediaAccess();
		if (!stream) {
			setIsRequestingAccess(false);
			return;
		}

		// Wait for video to load and canvas to be ready (if using canvas)
		if (useCanvas) {
			// Wait for video to load metadata
			if (videoRef.current) {
				await new Promise<void>((resolve) => {
					if (videoRef.current) {
						if (videoRef.current.readyState >= videoRef.current.HAVE_METADATA) {
							resolve();
						} else {
							const onLoadedMetadata = () => {
								if (videoRef.current) {
									videoRef.current.removeEventListener(
										"loadedmetadata",
										onLoadedMetadata,
									);
								}
								resolve();
							};
							videoRef.current.addEventListener(
								"loadedmetadata",
								onLoadedMetadata,
							);
							// Timeout after 2 seconds
							setTimeout(resolve, 2000);
						}
					} else {
						resolve();
					}
				});
			}
			// Additional wait for canvas stream to be created
			await new Promise((resolve) => setTimeout(resolve, 300));
		}

		setIsRequestingAccess(false);
	};

	// Start streaming - requires camera to be set up first
	const startStream = async () => {
		if (isStreaming || isLoading) return;

		if (!webRtcPublishUrl) {
			setError("WebRTC publish URL not configured");
			onError?.("WebRTC publish URL not configured");
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			// Ensure camera is set up - re-request if needed
			if (!mediaStreamRef.current || !hasAccess) {
				// Re-request camera access if it was lost
				const stream = await requestMediaAccess();
				if (!stream) {
					setError("Please set up camera first");
					setIsLoading(false);
					return;
				}
			}

			// Verify media stream is still active
			if (mediaStreamRef.current) {
				const activeTracks = mediaStreamRef.current
					.getTracks()
					.filter((track) => track.readyState === "live");
				if (activeTracks.length === 0) {
					// Stream was stopped, re-request access
					const stream = await requestMediaAccess();
					if (!stream) {
						setError("Camera access lost. Please set up camera again.");
						setIsLoading(false);
						return;
					}
				}
			}

			// Use Promise.all to prepare stream and verify states in parallel
			const streamToPublish = await (async () => {
				if (useCanvas) {
					// Wait for canvas stream to be ready with timeout
					let attempts = 0;
					const maxAttempts = 20; // 2 seconds total
					while (!canvasStreamRef.current && attempts < maxAttempts) {
						await new Promise((resolve) => setTimeout(resolve, 100));
						attempts++;
					}

					if (!canvasStreamRef.current) {
						throw new Error(
							"Canvas stream not ready. Please wait a moment and try again.",
						);
					}

					// Verify canvas stream has video tracks
					const videoTracks = canvasStreamRef.current.getVideoTracks();
					if (videoTracks.length === 0) {
						throw new Error("Canvas stream has no video tracks");
					}

					// Check if canvas is actually rendering (has dimensions)
					if (canvasRef.current) {
						const canvas = canvasRef.current;
						if (canvas.width === 0 || canvas.height === 0) {
							throw new Error(
								"Canvas has no dimensions. Video may not be loaded yet.",
							);
						}
					}

					return canvasStreamRef.current;
				} else {
					if (!mediaStreamRef.current) {
						throw new Error("Media stream not available");
					}
					return mediaStreamRef.current;
				}
			})();

			// Create WHIP client - don't pass video element when using canvas
			const whipClient = new WHIPClient(
				webRtcPublishUrl,
				useCanvas ? undefined : videoRef.current || undefined,
			);
			whipClientRef.current = whipClient;

			// Start publishing stream via WHIP
			await whipClient.publish(streamToPublish);

			// Update state and notify parent - do this AFTER successful publish
			setIsStreaming(true);
			setIsLoading(false);

			// Notify parent of streaming state change FIRST
			onStreamingStateChange?.(true);

			// Then call onStreamStart to update database
			onStreamStart?.();
		} catch (err) {
			console.error("Error starting stream:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to start streaming";
			setError(errorMessage);
			onError?.(errorMessage);
			setIsLoading(false);
			// Don't call stopStream here as it might interfere with the error state
		}
	};

	// Stop streaming
	const stopStream = async () => {
		if (!isStreaming && !mediaStreamRef.current && !whipClientRef.current) {
			return;
		}

		// Use Promise.all to stop all resources in parallel
		const stopOperations: Promise<unknown>[] = [];

		// Stop WHIP client
		if (whipClientRef.current) {
			stopOperations.push(
				whipClientRef.current.stop().catch((err) => {
					console.error("Error stopping WHIP client:", err);
				}),
			);
		}

		// Stop canvas stream tracks
		if (canvasStreamRef.current) {
			canvasStreamRef.current.getTracks().forEach((track) => {
				track.stop();
			});
			canvasStreamRef.current = null;
			onCanvasStreamReadyRef.current?.(null);
		}

		// Stop all media tracks (but don't clear the stream ref yet - we'll do that after)
		if (mediaStreamRef.current) {
			mediaStreamRef.current.getTracks().forEach((track) => {
				track.stop();
			});
		}

		// Wait for all stop operations to complete
		await Promise.all(stopOperations);

		// Clean up references after stopping
		whipClientRef.current = null;

		// Clear media stream reference and update access state
		// This ensures permissions are properly reset for next time
		if (mediaStreamRef.current) {
			mediaStreamRef.current = null;
			setHasAccess(false); // Reset access state so camera will be re-requested
		}

		// Clear video preview
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}

		// Update state and notify parent
		setIsStreaming(false);

		// Notify parent of streaming state change FIRST
		onStreamingStateChange?.(false);

		// Then call onStreamStop to update database
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
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
			<div className="space-y-3">
				{/* Header - Compact */}
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold text-gray-900">Live Stream</h3>
					{error && (
						<button
							onClick={() => setError(null)}
							className="text-gray-400 hover:text-gray-600"
						>
							<X className="w-3 h-3" />
						</button>
					)}
				</div>

				{/* Error Message */}
				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-3">
						<p className="text-sm text-red-600">{error}</p>
					</div>
				)}

				{/* Video Preview - Compact */}
				<div
					className="relative bg-black rounded-lg overflow-hidden"
					style={{ aspectRatio: "16/9", maxHeight: "200px" }}
				>
					<video
						ref={videoRef}
						autoPlay
						playsInline
						muted
						className="w-full h-full object-cover"
					/>
					{useCanvas && (
						<canvas
							ref={canvasRef}
							className="hidden"
							style={{ display: "none" }}
						/>
					)}
					{!videoEnabled && hasAccess && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-900">
							<VideoOff className="w-16 h-16 text-gray-400" />
						</div>
					)}
					{!hasAccess && !isRequestingAccess && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-900">
							<div className="text-center text-white px-4">
								<Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
								<p className="text-xs mb-2">
									Click "Setup Camera" to enable camera
								</p>
							</div>
						</div>
					)}
					{isRequestingAccess && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-900">
							<div className="text-center text-white">
								<Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
								<p className="text-xs">Requesting camera access...</p>
							</div>
						</div>
					)}
				</div>

				{/* Controls - Compact */}
				<div className="flex items-center gap-2 flex-wrap">
					{/* Video Toggle - Compact */}
					<button
						onClick={toggleVideo}
						disabled={!isStreaming}
						className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors text-xs ${
							videoEnabled
								? "bg-blue-100 text-blue-700 hover:bg-blue-200"
								: "bg-gray-100 text-gray-600 hover:bg-gray-200"
						} disabled:opacity-50 disabled:cursor-not-allowed`}
						title={videoEnabled ? "Disable video" : "Enable video"}
					>
						{videoEnabled ? (
							<Video className="w-3 h-3" />
						) : (
							<VideoOff className="w-3 h-3" />
						)}
					</button>

					{/* Audio Toggle - Compact */}
					<button
						onClick={toggleAudio}
						disabled={!isStreaming}
						className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors text-xs ${
							audioEnabled
								? "bg-blue-100 text-blue-700 hover:bg-blue-200"
								: "bg-gray-100 text-gray-600 hover:bg-gray-200"
						} disabled:opacity-50 disabled:cursor-not-allowed`}
						title={audioEnabled ? "Disable audio" : "Enable audio"}
					>
						{audioEnabled ? (
							<Mic className="w-3 h-3" />
						) : (
							<MicOff className="w-3 h-3" />
						)}
					</button>

					{/* Setup Camera / Start Stream Buttons */}
					<div className="flex-1 flex justify-end gap-2">
						{!hasAccess ? (
							<button
								onClick={setupCamera}
								disabled={isRequestingAccess}
								className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
							>
								{isRequestingAccess ? (
									<Loader2 className="w-3 h-3 animate-spin" />
								) : (
									<Video className="w-3 h-3" />
								)}
								<span className="font-medium text-xs">
									{isRequestingAccess ? "Setting up..." : "Setup Camera"}
								</span>
							</button>
						) : !isStreaming ? (
							<>
								<button
									onClick={revokeAccess}
									className="px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
									title="Revoke camera access"
								>
									Revoke
								</button>
								<button
									onClick={startStream}
									disabled={isLoading}
									className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 relative"
								>
									{isLoading ? (
										<Loader2 className="w-3 h-3 animate-spin" />
									) : (
										<Video className="w-3 h-3" />
									)}
									<span className="font-medium text-xs">
										{isLoading ? "Starting..." : "Start Stream"}
									</span>
								</button>
							</>
						) : (
							<button
								onClick={stopStream}
								className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
							>
								<VideoOff className="w-3 h-3" />
								<span className="font-medium text-xs">Stop</span>
							</button>
						)}
					</div>
				</div>

				{/* Info - Compact */}
				{isStreaming && (
					<div className="bg-green-50 border border-green-200 rounded-lg p-2">
						<div className="flex items-center gap-2">
							<div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
							<p className="text-xs text-green-800 font-medium">
								Streaming to Cloudflare
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
