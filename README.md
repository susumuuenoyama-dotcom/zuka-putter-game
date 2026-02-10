
# Zuka Putter Sim Pro 🏌️‍♂️

本格的な物理エンジンと、Web Audio APIによるリアルタイム音声合成を搭載した、ブラウザで遊べる高精度パターゴルフシミュレーター。

## 🚀 Live Demo
[こちらでプレイ可能（GitHub Pagesの設定後にリンクを貼ってください）](https://susumuuenoyama-dotcom.github.io/zuka-putter-sim-pro/)

## Features / 特徴

- **Real-time Audio Synthesis**: サンプリング音源を使用せず、Web Audio APIで「カランカラン」というカップイン音や観衆の歓声をリアルタイムに合成。
- **Celebration Effect**: ホールインワンやカップイン時に、Canvas APIによるパーティクル演出を追加。
- **High-Fidelity Physics**: 芝の抵抗、重力、芝目（スライス・フック）を計算する精密な物理ロジック。
- **Pro UI/UX**: Tailwind CSSを使用した洗練されたダークモードデザイン。
- **Responsive**: PC、タブレット、スマートフォンのすべてに対応。

## Tech Stack / 技術スタック

- **Framework**: React 19
- **Styling**: Tailwind CSS
- **Audio Engine**: Web Audio API (Custom Oscillator/Noise Synthesis)
- **Language**: TypeScript

## How to Play / 操作方法

1. **Aim (照準)**: グリーンの任意の場所をドラッグして、方向とパワーを決めます。
2. **Shoot (ショット)**: ボール上の「HIT」マークをタップすると、ショットが実行されます。
3. **Challenge**: 芝目（Straight/Slice/Hook）を読み、最小パット数を目指しましょう。

---
Developed by [susumuuenoyama-dotcom](https://github.com/susumuuenoyama-dotcom) & Gemini.
