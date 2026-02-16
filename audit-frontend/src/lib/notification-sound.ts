import notificationSoundFile from "@/assets/audio/notifaction sound.mp3";

class NotificationSoundService {
  private soundUrl: string;
  private isUnlocked: boolean = false;

  constructor() {
    this.soundUrl = notificationSoundFile;
    this.setupAutoUnlock();
  }

  private setupAutoUnlock() {
    const unlock = () => {
      if (this.isUnlocked) return;

      // Create a temporary audio element to unlock audio context
      const tempAudio = new Audio(this.soundUrl);
      tempAudio.volume = 0.01; // Very low volume for unlock
      const playPromise = tempAudio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            tempAudio.pause();
            tempAudio.currentTime = 0;
            this.isUnlocked = true;
            // Remove event listeners once unlocked
            document.removeEventListener("click", unlock);
            document.removeEventListener("touchstart", unlock);
            document.removeEventListener("keydown", unlock);
          })
          .catch(() => {});
      }
    };

    document.addEventListener("click", unlock, { once: false });
    document.addEventListener("touchstart", unlock, { once: false });
    document.addEventListener("keydown", unlock, { once: false });
  }

  public play() {
    // Create a new audio element each time to bypass browser restrictions
    // This allows audio to play even when tab is not active
    const audio = new Audio(this.soundUrl);
    audio.volume = 1;

    // Set attributes to allow playback in background
    audio.preload = "auto";

    // Force immediate play - this helps in background tabs
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("[NotificationSound] Played successfully");
        })
        .catch((error) => {
          console.warn("[NotificationSound] Could not play:", error.message);

          // Try alternative approach for background tabs
          setTimeout(() => {
            audio.play().catch(() => {
              console.warn("[NotificationSound] Retry failed");
            });
          }, 100);
        });
    }
  }
}

export const notificationSound = new NotificationSoundService();
