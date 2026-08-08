let audioContext: AudioContext | null = null

function contextOf() {
  if (audioContext) return audioContext
  const AudioContextCtor = window.AudioContext
    || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null
  audioContext = new AudioContextCtor()
  return audioContext
}

export function unlockOrderNotificationSound() {
  const context = contextOf()
  if (context?.state === 'suspended') void context.resume().catch(() => undefined)
}

export function playOrderNotificationSound() {
  const context = contextOf()
  if (!context) return
  void context.resume().then(() => {
    const start = context.currentTime
    ;[660, 880].forEach((frequency, index) => {
      const noteStart = start + index * 0.18
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, noteStart)
      gain.gain.setValueAtTime(0.0001, noteStart)
      gain.gain.exponentialRampToValueAtTime(0.18, noteStart + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(noteStart)
      oscillator.stop(noteStart + 0.17)
    })
  }).catch(() => undefined)
}

export function releaseOrderNotificationSound() {
  if (audioContext) void audioContext.close().catch(() => undefined)
  audioContext = null
}
