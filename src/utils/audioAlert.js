// Utilidad de Alerta Sonora y Notificación en Tiempo Real P2P
// Generador de audio sintetizado con Web Audio API (compatible con cualquier navegador y móvil)

export const playP2PAlertChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Tonos tipo campana/alarma P2P: 587.33 Hz (D5) seguido de 880 Hz (A5)
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  } catch (error) {
    console.debug('P2P chime audio trigger:', error);
  }
};

// Efecto de sonido festivo para Dopamina P2P y Liberación de ValensCoin (Fanfarria y monedas de oro)
export const playCelebrationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Arpegio festivo ascendente: C5, E5, G5, C6 y brillo agudo E6 (monedas de oro cayendo)
    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.18, vol: 0.25 }, // C5
      { freq: 659.25, time: 0.12, dur: 0.18, vol: 0.28 }, // E5
      { freq: 783.99, time: 0.24, dur: 0.22, vol: 0.32 }, // G5
      { freq: 1046.50, time: 0.36, dur: 0.45, vol: 0.35 }, // C6
      { freq: 1318.51, time: 0.48, dur: 0.65, vol: 0.28 }, // E6 (tintineo de moneda)
      { freq: 1567.98, time: 0.60, dur: 0.80, vol: 0.22 }  // G6 (resplandor final)
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // Tono cálido con armónicos tipo campana/moneda
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(vol, now + time);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  } catch (error) {
    console.debug('Celebration audio trigger:', error);
  }
};
