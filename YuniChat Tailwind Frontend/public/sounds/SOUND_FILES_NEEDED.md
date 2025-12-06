# YuniChat Call Sounds

This folder contains audio files for call-related events:

- **incoming-ringtone.mp3** - Plays when receiving an incoming call (loops)
- **outgoing-ringtone.mp3** - Plays when making an outgoing call (loops)
- **call-connected.mp3** - Plays once when call is connected

## Adding Sound Files

To add actual sound files:

1. Find or create short audio clips (MP3 format recommended)
2. For ringtones: Use loopable sounds (2-5 seconds)
3. For connected sound: Use a short notification sound (< 1 second)
4. Place the files in this directory with the exact names above

## Temporary Solution

Until actual sound files are added, the app will fail gracefully and log warnings in the console. The call functionality will still work, just without audio feedback.

## Free Sound Resources

- **Freesound.org** - Creative Commons sounds
- **Zapsplat.com** - Free sound effects
- **Notification Sounds** - Simple beep sounds from notification generators
