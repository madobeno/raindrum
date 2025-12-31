import { AmbienceType, SoundType } from "../types";

class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private birdGain: GainNode | null = null;
  private isBirdsActive: boolean = false;
  private thunderGain: GainNode | null = null;
  private thunderTimeout: number | null = null;
  private isThunderActive: boolean = false;

  private oceanSource: AudioBufferSourceNode | null = null;
  private oceanGain: GainNode | null = null;
  private fireSource: AudioBufferSourceNode | null = null;
  private fireGain: GainNode | null = null;

  private cricketsGain: GainNode | null = null;
  private isCricketsActive: boolean = false;

  public init() {
    if (this.context) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.context = new AudioContextClass();
    
    this.compressor = this.context.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
    this.compressor.knee.setValueAtTime(40, this.context.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.context.currentTime);
    this.compressor.attack.setValueAtTime(0, this.context.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.context.currentTime);
    this.compressor.connect(this.context.destination);

    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.compressor);

    this.setupReverb();
    this.createNoiseBuffer();
    this.setupAmbienceGains();
  }

  public resume(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      return this.context.resume();
    }
    return Promise.resolve();
  }

  private createNoiseBuffer() {
    if (!this.context) return;
    const bufferSize = 5 * this.context.sampleRate;
    this.noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168981;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }
  }

  private setupReverb() {
    if (!this.context || !this.masterGain) return;

    const duration = 7.0;
    const decay = 4.0;
    const rate = this.context.sampleRate;
    const length = rate * duration;
    const impulse = this.context.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const gain = Math.pow(1 - n, decay); 
      left[i] = (Math.random() * 2 - 1) * gain;
      right[i] = (Math.random() * 2 - 1) * gain;
    }

    this.reverbNode = this.context.createConvolver();
    this.reverbNode.buffer = impulse;
    
    const reverbGain = this.context.createGain();
    reverbGain.gain.value = 0.8;

    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);
  }

  private setupAmbienceGains() {
    if (!this.context || !this.masterGain) return;

    this.rainGain = this.context.createGain();
    this.rainGain.gain.value = 0;
    this.rainGain.connect(this.masterGain);

    this.windGain = this.context.createGain();
    this.windGain.gain.value = 0;
    this.windGain.connect(this.masterGain);

    this.birdGain = this.context.createGain();
    this.birdGain.gain.value = 0;
    this.birdGain.connect(this.masterGain);
    if (this.reverbNode) this.birdGain.connect(this.reverbNode);

    this.thunderGain = this.context.createGain();
    this.thunderGain.gain.value = 0;
    this.thunderGain.connect(this.masterGain);
    if (this.reverbNode) this.thunderGain.connect(this.reverbNode);

    this.oceanGain = this.context.createGain();
    this.oceanGain.gain.value = 0;
    this.oceanGain.connect(this.masterGain);

    this.fireGain = this.context.createGain();
    this.fireGain.gain.value = 0;
    this.fireGain.connect(this.masterGain);

    this.cricketsGain = this.context.createGain();
    this.cricketsGain.gain.value = 0;
    this.cricketsGain.connect(this.masterGain);
  }

  public setAmbience(type: AmbienceType, active: boolean, volume: number) {
    if (!this.context) return;
    this.resume();
    
    const targetVal = active ? volume : 0;

    switch (type) {
      case 'rain':
        if (this.rainGain) this.rainGain.gain.setTargetAtTime(targetVal * 0.8, this.context.currentTime, 0.5);
        if (active && !this.rainSource && this.noiseBuffer) {
          this.rainSource = this.context.createBufferSource();
          this.rainSource.buffer = this.noiseBuffer;
          this.rainSource.loop = true;
          const filter = this.context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 1000;
          this.rainSource.connect(filter);
          filter.connect(this.rainGain!);
          this.rainSource.start();
        }
        break;
      case 'wind':
        if (this.windGain) this.windGain.gain.setTargetAtTime(targetVal * 1.2, this.context.currentTime, 1.0);
        if (active && !this.windSource && this.noiseBuffer) {
          this.windSource = this.context.createBufferSource();
          this.windSource.buffer = this.noiseBuffer;
          this.windSource.loop = true;
          const filter = this.context.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 500;
          filter.Q.value = 0.5;
          const lfo = this.context.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.08;
          const lfoGain = this.context.createGain();
          lfoGain.gain.value = 300;
          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          this.windSource.connect(filter);
          filter.connect(this.windGain!);
          this.windSource.start();
          lfo.start();
        }
        break;
      case 'birds':
        if (this.birdGain) this.birdGain.gain.setTargetAtTime(targetVal, this.context.currentTime, 0.5);
        if (active && !this.isBirdsActive) {
          this.isBirdsActive = true;
          this.playBirdChirp();
        } else if (!active) this.isBirdsActive = false;
        break;
      case 'thunder':
        if (this.thunderGain) this.thunderGain.gain.setTargetAtTime(targetVal, this.context.currentTime, 0.5);
        if (active && !this.isThunderActive) {
          this.isThunderActive = true;
          this.playThunderClap();
        } else if (!active) {
          this.isThunderActive = false;
          if (this.thunderTimeout) clearTimeout(this.thunderTimeout);
        }
        break;
      case 'ocean':
        if (this.oceanGain) this.oceanGain.gain.setTargetAtTime(targetVal * 1.5, this.context.currentTime, 0.5);
        if (active && !this.oceanSource && this.noiseBuffer) {
          this.oceanSource = this.context.createBufferSource();
          this.oceanSource.buffer = this.noiseBuffer;
          this.oceanSource.loop = true;
          const filter = this.context.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 400;
          const lfo = this.context.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.12; // Wave frequency
          const lfoGain = this.context.createGain();
          lfoGain.gain.value = 0.4;
          lfo.connect(lfoGain);
          lfoGain.connect(this.oceanGain!.gain);
          this.oceanSource.connect(filter);
          filter.connect(this.oceanGain!);
          this.oceanSource.start();
          lfo.start();
        }
        break;
      case 'fire':
        if (this.fireGain) this.fireGain.gain.setTargetAtTime(targetVal * 0.8, this.context.currentTime, 0.5);
        if (active && !this.fireSource && this.noiseBuffer) {
          this.fireSource = this.context.createBufferSource();
          this.fireSource.buffer = this.noiseBuffer;
          this.fireSource.loop = true;
          const filter = this.context.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 1200;
          this.fireSource.connect(filter);
          filter.connect(this.fireGain!);
          this.fireSource.start();
          this.playFireCrackle();
        }
        break;
      case 'crickets':
        if (this.cricketsGain) this.cricketsGain.gain.setTargetAtTime(targetVal, this.context.currentTime, 0.5);
        if (active && !this.isCricketsActive) {
          this.isCricketsActive = true;
          this.playCricketChirp();
        } else if (!active) this.isCricketsActive = false;
        break;
    }
  }

  private playCricketChirp() {
    if (!this.context || !this.cricketsGain || !this.isCricketsActive) return;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    const freq = 4000 + Math.random() * 500;
    osc.frequency.setValueAtTime(freq, t);
    const mod = this.context.createOscillator();
    mod.type = 'square';
    mod.frequency.setValueAtTime(50, t); // Chirp frequency
    const modGain = this.context.createGain();
    modGain.gain.value = freq * 0.1;
    mod.connect(modGain);
    modGain.connect(osc.frequency);
    const g = this.context.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.02, t + 0.01);
    g.gain.linearRampToValueAtTime(0, t + 0.2);
    osc.connect(g);
    g.connect(this.cricketsGain);
    mod.start(t);
    osc.start(t);
    mod.stop(t + 0.25);
    osc.stop(t + 0.25);
    setTimeout(() => this.playCricketChirp(), 1000 + Math.random() * 4000);
  }

  private playFireCrackle() {
    if (!this.context || !this.fireGain || !this.noiseBuffer) return;
    const t = this.context.currentTime;
    const burst = this.context.createBufferSource();
    burst.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000 + Math.random() * 2000;
    const g = this.context.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    burst.connect(filter);
    filter.connect(g);
    g.connect(this.fireGain);
    burst.start(t);
    burst.stop(t + 0.1);
    setTimeout(() => this.playFireCrackle(), 100 + Math.random() * 800);
  }

  private playBirdChirp() {
    if (!this.context || !this.birdGain || !this.isBirdsActive) return;
    const t = this.context.currentTime;
    const osc = this.context.createOscillator();
    osc.type = 'sine';
    const freq = 1800 + Math.random() * 1200;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq + 500, t + 0.1);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.birdGain);
    osc.start(t);
    osc.stop(t + 0.4);
    setTimeout(() => this.playBirdChirp(), 3000 + Math.random() * 7000);
  }

  private playThunderClap() {
    if (!this.context || !this.thunderGain || !this.noiseBuffer || !this.isThunderActive) return;
    const t = this.context.currentTime;
    const src = this.context.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1.0, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 5.0);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.thunderGain);
    src.start(t);
    src.stop(t + 6.0);
    this.thunderTimeout = window.setTimeout(() => this.playThunderClap(), 15000 + Math.random() * 25000);
  }

  public playTone(frequency: number, soundType: SoundType = 'Crystal') {
    if (!this.context || !this.masterGain || !this.reverbNode) return;
    this.resume();
    const t = this.context.currentTime;

    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, t);
    
    // Low frequency compensation
    const baseGain = frequency < 200 ? 0.7 : 0.5;

    switch (soundType) {
      case 'Crystal':
        const oscC1 = this.context.createOscillator();
        oscC1.type = 'sine';
        oscC1.frequency.setValueAtTime(frequency, t);
        oscC1.connect(gain);
        gain.gain.linearRampToValueAtTime(baseGain, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0);
        oscC1.start(t);
        oscC1.stop(t + 4.5);
        break;

      case 'Metallic':
        const oscM1 = this.context.createOscillator();
        oscM1.type = 'sine';
        oscM1.frequency.setValueAtTime(frequency, t);
        
        const oscM2 = this.context.createOscillator();
        oscM2.type = 'triangle';
        oscM2.frequency.setValueAtTime(frequency * 2.01, t);
        
        const mGain2 = this.context.createGain();
        mGain2.gain.value = 0.3;
        
        oscM1.connect(gain);
        oscM2.connect(mGain2);
        mGain2.connect(gain);
        
        gain.gain.linearRampToValueAtTime(baseGain * 0.8, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 5.0);
        
        oscM1.start(t);
        oscM2.start(t);
        oscM1.stop(t + 5.5);
        oscM2.stop(t + 5.5);
        break;

      case 'Wood':
        const oscW1 = this.context.createOscillator();
        oscW1.type = 'triangle';
        oscW1.frequency.setValueAtTime(frequency, t);
        oscW1.connect(gain);
        gain.gain.linearRampToValueAtTime(baseGain * 1.2, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        oscW1.start(t);
        oscW1.stop(t + 1.5);
        break;

      case 'Ether':
        const oscE1 = this.context.createOscillator();
        oscE1.type = 'sine';
        oscE1.frequency.setValueAtTime(frequency, t);
        oscE1.connect(gain);
        gain.gain.linearRampToValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(baseGain * 0.5, t + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 8.0);
        oscE1.start(t);
        oscE1.stop(t + 8.5);
        break;
    }
    
    gain.connect(this.masterGain);
    gain.connect(this.reverbNode);
  }
}

export const audioEngine = new AudioEngine();