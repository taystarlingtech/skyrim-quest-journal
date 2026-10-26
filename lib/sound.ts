let audio: AudioContext | null = null

export function playSealSound(): void {
  const Context =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Context) return
  if (!audio) audio = new Context()
  void audio.resume()
  const now = audio.currentTime
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = "sine"
  osc.frequency.setValueAtTime(392, now)
  osc.frequency.exponentialRampToValueAtTime(196, now + 0.18)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.028, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(now)
  osc.stop(now + 0.3)
}
