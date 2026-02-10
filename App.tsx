
import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { audioService } from './services/audioService';

const STORAGE_KEY = 'zuka_putter_pro_best';

/**
 * App: ゴルフゲーム全体の親コンポーネント
 */
const App: React.FC = () => {
  const [strokes, setStrokes] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? parseInt(saved, 10) : null;
  });
  const [resetKey, setResetKey] = useState(0);

  /**
   * 次のホールへ進む（リセット）
   */
  const handleNextHole = () => {
    audioService.init(); // ユーザーアクションに合わせてオーディオ初期化
    setResetKey(prev => prev + 1);
  };

  /**
   * カップイン時のスコア記録
   */
  const handleHoleComplete = (finalStrokes: number) => {
    if (bestScore === null || finalStrokes < bestScore) {
      setBestScore(finalStrokes);
      localStorage.setItem(STORAGE_KEY, finalStrokes.toString());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-slate-950 text-slate-100">
      {/* 画面上部: タイトルとスコアボード */}
      <header className="w-full max-w-2xl flex items-end justify-between py-2 border-b border-slate-800/50 mb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter italic text-emerald-500 uppercase leading-none">
            Zuka Putter <span className="text-slate-100">Sim Pro</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em] mt-2">HIGH-FIDELITY PHYSICS ENGINE</p>
        </div>
        
        <div className="flex gap-10">
          {bestScore !== null && (
            <div className="flex flex-col items-end">
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Personal Best</div>
              <div className="text-4xl font-black text-emerald-400 leading-none">
                {bestScore}
              </div>
            </div>
          )}
          <div className="flex flex-col items-end">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Current Strokes</div>
            <div className="text-4xl font-black text-amber-400 leading-none">
              {strokes}
            </div>
          </div>
        </div>
      </header>

      {/* 画面中部: ゲームキャンバス */}
      <main className="flex-1 w-full flex flex-col items-center justify-center gap-8">
        <GameCanvas 
          onStrokeUpdate={setStrokes} 
          onHoleComplete={handleHoleComplete}
          onResetTrigger={resetKey} 
        />
        
        {/* 操作説明カード */}
        <div className="w-full max-w-md bg-slate-900/40 p-5 rounded-2xl border border-white/5 backdrop-blur-sm text-xs text-slate-400 shadow-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="flex items-center gap-2 font-bold text-slate-300 uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                1. 照準を設定
              </p>
              <p className="pl-4 leading-relaxed">グリーンの好きな場所をドラッグして方向と強さを決めます。</p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2 font-bold text-slate-300 uppercase">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                2. ショット実行
              </p>
              <p className="pl-4 leading-relaxed">ボール（HITマーク）をタップすると、決めた強さで打ちます。</p>
            </div>
          </div>
        </div>
      </main>

      {/* 画面下部: リセットボタン */}
      <footer className="w-full max-w-2xl py-6">
        <button
          onClick={handleNextHole}
          className="w-full py-5 px-8 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] text-white font-black rounded-3xl shadow-2xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-4 group uppercase tracking-widest text-sm"
        >
          <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset / Next Hole
        </button>
      </footer>
    </div>
  );
};

export default App;
