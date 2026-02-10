
# Zuka Putter Sim Pro 🏌️‍♂️

本格的な物理エンジンと、Web Audio APIによるリアルタイム音声合成を搭載した、ブラウザで遊べる高精度パターゴルフシミュレーター。


import { SoundType } from '../types';

/**
 * AudioService: ゲーム内の全サウンドをリアルタイムで波形合成するクラス
 * 外部音源ファイルが不要なため、ロード時間がゼロで動作します。
 */
class AudioService {
  private audioCtx: AudioContext | null = null;

  /**
   * ブラウザの制約により、ユーザー操作（タップ等）のタイミングで初期化を行う
   */
  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * 各種エフェクト音の再生
   */
  playSound(type: SoundType) {
    if (!this.audioCtx || this.audioCtx.state !== 'running') return;
    const now = this.audioCtx.currentTime;

    if (type === 'hit') {
      // ショット音: 短い三角形波で「コツッ」という打球音を再現
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } 
    else if (type === 'cup') {
      // カップイン音: 複数の高周波サイン波による「カランカラン」という金属音
      const freqs = [1200, 1800, 2400];
      freqs.forEach((f, i) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        const delay = i * 0.05; // 微小な遅延で連続ヒット感を出す
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.frequency.setValueAtTime(f, now + delay);
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
        osc.start(now + delay);
        osc.stop(now + delay + 0.4);
      });
    } 
    else if (type === 'cheer') {
      // 歓声: ホワイトノイズ + バンドパスフィルタによるスタジアムの熱狂
      const bufferSize = this.audioCtx.sampleRate * 2;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 1.0);
      filter.Q.value = 1.5;

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start(now);
    } 
    else if (type === 'sigh') {
      // ため息: ホワイトノイズ + ローパスフィルタの周波数スイープで「あぁ〜…」を再現
      const bufferSize = this.audioCtx.sampleRate * 1.5;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.linearRampToValueAtTime(200, now + 1.2);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      noise.start(now);
    }
  }
}

export const audioService = new AudioService();
