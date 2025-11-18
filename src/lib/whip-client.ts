/**
 * WHIP Client for WebRTC Streaming
 *
 * Implements the WHIP (WebRTC-HTTP Ingestion Protocol) to stream
 * video/audio directly from the browser to Cloudflare Stream.
 *
 * Based on: https://developers.cloudflare.com/stream/webrtc-beta/
 */

export class WHIPClient {
	private peerConnection: RTCPeerConnection | null = null;
	private stream: MediaStream | null = null;
	private whipUrl: string;
	private videoElement: HTMLVideoElement | null = null;
	private isConnected = false;

	constructor(whipUrl: string, videoElement?: HTMLVideoElement) {
		this.whipUrl = whipUrl;
		this.videoElement = videoElement || null;
	}

	/**
	 * Start streaming media to Cloudflare
	 */
	async publish(stream: MediaStream): Promise<void> {
		if (this.isConnected) {
			throw new Error("Already streaming");
		}

		this.stream = stream;

		// Create RTCPeerConnection with appropriate configuration
		this.peerConnection = new RTCPeerConnection({
			iceServers: [
				// Cloudflare will provide ICE servers via SDP
			],
			iceTransportPolicy: "all",
		});

		// Add all tracks from the media stream
		stream.getTracks().forEach((track) => {
			if (this.peerConnection) {
				this.peerConnection.addTrack(track, stream);
			}
		});

		// Handle ICE candidates
		this.peerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				// ICE candidates are handled automatically by the WHIP protocol
				// No need to manually send them
			}
		};

		// Handle connection state changes
		this.peerConnection.onconnectionstatechange = () => {
			if (this.peerConnection) {
				console.log(
					"WHIP connection state:",
					this.peerConnection.connectionState,
				);
				if (this.peerConnection.connectionState === "failed") {
					this.cleanup();
				}
			}
		};

		// Create offer
		const offer = await this.peerConnection.createOffer({
			offerToReceiveAudio: false,
			offerToReceiveVideo: false,
		});

		await this.peerConnection.setLocalDescription(offer);

		// Send offer to Cloudflare via WHIP
		try {
			const response = await fetch(this.whipUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/sdp",
				},
				body: offer.sdp,
			});

			if (!response.ok) {
				throw new Error(
					`WHIP request failed: ${response.status} ${response.statusText}`,
				);
			}

			// Get answer SDP from response
			const answerSdp = await response.text();
			await this.peerConnection.setRemoteDescription({
				type: "answer",
				sdp: answerSdp,
			});

			// Get location header for future updates (if needed)
			const location = response.headers.get("Location");
			if (location) {
				// Store location for potential future use (e.g., updating stream)
				console.log("WHIP resource location:", location);
			}

			this.isConnected = true;

			// Show preview if video element provided
			if (this.videoElement) {
				this.videoElement.srcObject = stream;
			}
		} catch (error) {
			console.error("WHIP publish error:", error);
			this.cleanup();
			throw error;
		}
	}

	/**
	 * Stop streaming
	 */
	async stop(): Promise<void> {
		if (!this.isConnected && !this.peerConnection) {
			return;
		}

		// Send DELETE request to WHIP endpoint to properly end the stream
		try {
			await fetch(this.whipUrl, {
				method: "DELETE",
			});
		} catch (error) {
			console.error("Error stopping WHIP stream:", error);
		}

		this.cleanup();
	}

	/**
	 * Cleanup resources
	 */
	private cleanup(): void {
		if (this.peerConnection) {
			this.peerConnection.close();
			this.peerConnection = null;
		}

		if (this.stream) {
			this.stream.getTracks().forEach((track) => {
				track.stop();
			});
			this.stream = null;
		}

		if (this.videoElement) {
			this.videoElement.srcObject = null;
		}

		this.isConnected = false;
	}

	/**
	 * Get connection state
	 */
	getConnectionState(): RTCPeerConnectionState | null {
		return this.peerConnection?.connectionState || null;
	}

	/**
	 * Check if currently streaming
	 */
	isStreaming(): boolean {
		return this.isConnected;
	}
}
