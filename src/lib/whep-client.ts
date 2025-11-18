/**
 * WHEP Client for WebRTC Playback
 *
 * Implements the WHEP (WebRTC-HTTP Egress Protocol) to play
 * live streams from Cloudflare Stream with sub-second latency.
 *
 * Based on: https://developers.cloudflare.com/stream/webrtc-beta/
 */

export class WHEPClient {
	private peerConnection: RTCPeerConnection | null = null;
	private whepUrl: string;
	private videoElement: HTMLVideoElement;
	private isConnected = false;

	constructor(whepUrl: string, videoElement: HTMLVideoElement) {
		this.whepUrl = whepUrl;
		this.videoElement = videoElement;
	}

	/**
	 * Start playing the stream
	 */
	async play(): Promise<void> {
		if (this.isConnected) {
			throw new Error("Already playing");
		}

		// Create RTCPeerConnection
		this.peerConnection = new RTCPeerConnection({
			iceServers: [
				// Cloudflare will provide ICE servers via SDP
			],
			iceTransportPolicy: "all",
		});

		// Handle incoming stream
		this.peerConnection.ontrack = (event) => {
			if (this.videoElement && event.streams[0]) {
				this.videoElement.srcObject = event.streams[0];
			}
		};

		// Handle ICE candidates
		this.peerConnection.onicecandidate = (event) => {
			if (event.candidate) {
				// ICE candidates are handled automatically by the WHEP protocol
			}
		};

		// Handle connection state changes
		this.peerConnection.onconnectionstatechange = () => {
			if (this.peerConnection) {
				console.log(
					"WHEP connection state:",
					this.peerConnection.connectionState,
				);
				if (this.peerConnection.connectionState === "failed") {
					this.cleanup();
				}
			}
		};

		// Create offer (we want to receive audio and video)
		const offer = await this.peerConnection.createOffer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: true,
		});

		await this.peerConnection.setLocalDescription(offer);

		// Send offer to Cloudflare via WHEP
		try {
			const response = await fetch(this.whepUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/sdp",
				},
				body: offer.sdp,
			});

			if (!response.ok) {
				throw new Error(
					`WHEP request failed: ${response.status} ${response.statusText}`,
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
				console.log("WHEP resource location:", location);
			}

			this.isConnected = true;
		} catch (error) {
			console.error("WHEP play error:", error);
			this.cleanup();
			throw error;
		}
	}

	/**
	 * Stop playing
	 */
	async stop(): Promise<void> {
		if (!this.isConnected && !this.peerConnection) {
			return;
		}

		// Send DELETE request to WHEP endpoint
		try {
			await fetch(this.whepUrl, {
				method: "DELETE",
			});
		} catch (error) {
			console.error("Error stopping WHEP stream:", error);
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
	 * Check if currently playing
	 */
	isPlaying(): boolean {
		return this.isConnected;
	}
}
