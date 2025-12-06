# Ringtone Audio Files

This directory contains audio files for call notifications.

## Required Files

1. **outgoing-ringtone.mp3** - Played when making an outgoing call
2. **incoming-ringtone.mp3** - Played when receiving an incoming call

## File Format
- Format: MP3
- Duration: 2-5 seconds (will loop automatically)
- Sample Rate: 44100 Hz recommended
- Bitrate: 128 kbps minimum

## Where to Get Ringtones

### Free Sources:
1. **Zapsplat** (https://www.zapsplat.com/sound-effect-categories/telephone-and-phone-rings/)
   - Free for personal/commercial use with attribution
   - Search for "phone ring" or "call tone"

2. **Freesound** (https://freesound.org/)
   - Search for "ringtone" or "phone ring"
   - Check license before use (CC0 preferred)

3. **Default Browser Beep** (Fallback)
   - If no files are present, the app will fail gracefully
   - Consider using Web Audio API to generate simple tones

## Fallback Behavior

If audio files are missing:
- Console error will be logged
- No audio will play
- Visual indicators (animations) will still work
- Call functionality remains intact

## Creating Custom Ringtones

You can use online tools or audio software:
- Audacity (Free, Open Source)
- Online converters for format conversion
- Keep files small (<100KB) for fast loading
