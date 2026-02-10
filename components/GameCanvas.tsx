
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Ball, Hole, Arrow, Green, LineType, LINE_NAMES } from '../types';
import { audioService } from '../services/audioService';

interface GameCanvasProps {
  onStrokeUpdate: (strokes: number) => void;
  onHoleComplete: (strokes: number) => void;
  onResetTrigger: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

const GIMME_DISTANCE = 55;
const LONG_PUTT_CHASE = 220;
const BALL_FRICTION = 0.984;
const MAX_POWER = 300;

const GameCanvas: React.FC<GameCanvasProps> = ({ onStrokeUpdate, onHoleComplete, onResetTrigger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const pulseRef = useRef<number>(0);
  
  const ballRef = useRef<Ball>({ x: 0, y: 0, vx: 0, vy: 0, r: 10 });
  const holeRef = useRef<Hole>({ x: 0, y: 0, r: 14 });
  const arrowRef = useRef<Arrow>({ ang: 0, len: 70, drag: false });
  const greenRef = useRef<Green>({ rx: 0, ry: 0, cx: 0, cy: 0 });
  const particlesRef = useRef<Particle[]>([]);
  
  const isMovingRef = useRef<boolean>(false);
  const holeCompletedRef = useRef<boolean>(false);
  const startDistanceRef = useRef<number>(0);
  
  const [isUIMoving, setIsUIMoving] = useState(false);
  const [strokes, setStrokes] = useState(0);
  const [msg, setMsg] = useState("");
  const [lineType, setLineType] = useState<LineType>(LineType.STRAIGHT);
  const [outOfGreen, setOutOfGreen] = useState(false);

  const createParticles = (x: number, y: number) => {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#ffffff'];
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0
      });
    }
  };

  const updatePhysics = useCallback(() => {
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.2; 
      p.life -= 0.02;
      return p.life > 0;
    });

    if (!isMovingRef.current) return;
    const ball = ballRef.current;
    const hole = holeRef.current;
    const currentSpeed = Math.hypot(ball.vx, ball.vy);
    const distToHole = Math.hypot(ball.x - hole.x, ball.y - hole.y);
    
    let slopeInfluence = Math.min(1.0, currentSpeed * 2.5); 
    let gravityY = 0.0025 * slopeInfluence;
    let curveX = 0;
    
    if (lineType === LineType.SLICE) curveX = 0.0003 * distToHole * slopeInfluence;
    if (lineType === LineType.HOOK) curveX = -0.0003 * distToHole * slopeInfluence;
    
    ball.vx += curveX;
    ball.vy += gravityY;
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.vx *= BALL_FRICTION;
    ball.vy *= BALL_FRICTION;
    
    const nextSpeed = Math.hypot(ball.vx, ball.vy);
    if (nextSpeed < 0.12) { ball.vx = 0; ball.vy = 0; }

    const { cx, cy, rx, ry } = greenRef.current;
    const dxNormalized = (ball.x - cx) / rx;
    const dyNormalized = (ball.y - cy) / ry;
    if ((dxNormalized * dxNormalized + dyNormalized * dyNormalized) > 1.05) {
      stopMovement(true);
      return;
    }

    if (distToHole < hole.r) {
      if (nextSpeed < 3.2) performCupIn();
    } else if (ball.vx === 0 && ball.vy === 0) {
      checkStopPosition(distToHole);
    }
  }, [lineType]);

  const stopMovement = (isOB: boolean) => {
    isMovingRef.current = false;
    setIsUIMoving(false);
    if (isOB) {
      setStrokes(s => { const n = s + 1; onStrokeUpdate(n); return n; });
      setOutOfGreen(true);
      const { cx, cy, rx, ry } = greenRef.current;
      const ang = Math.atan2(ballRef.current.y - cy, ballRef.current.x - cx);
      ballRef.current.x = cx + Math.cos(ang) * (rx - 20);
      ballRef.current.y = cy + Math.sin(ang) * (ry - 20);
      ballRef.current.vx = 0; ballRef.current.vy = 0;
    }
  };

  const performCupIn = () => {
    isMovingRef.current = false;
    setIsUIMoving(false);
    ballRef.current.vx = 0; ballRef.current.vy = 0;
    ballRef.current.x = holeRef.current.x; ballRef.current.y = holeRef.current.y;
    
    const finalStrokes = strokes + 1;
    setMsg(finalStrokes === 1 ? "Hole in One!" : "Nice In!");
    createParticles(holeRef.current.x, holeRef.current.y);
    
    audioService.playSound('cup');
    if (startDistanceRef.current > LONG_PUTT_CHASE || finalStrokes === 1) {
      setTimeout(() => audioService.playSound('cheer'), 250);
    }

    if (!holeCompletedRef.current) {
      holeCompletedRef.current = true;
      onHoleComplete(finalStrokes);
    }
  };

  const checkStopPosition = (d: number) => {
    isMovingRef.current = false;
    setIsUIMoving(false);
    setOutOfGreen(false);
    
    if (d < GIMME_DISTANCE) {
      const finalStrokes = strokes + 1;
      setStrokes(finalStrokes);
      onStrokeUpdate(finalStrokes);
      ballRef.current.x = holeRef.current.x; ballRef.current.y = holeRef.current.y;
      setMsg("Gimme! (OK)");
      createParticles(holeRef.current.x, holeRef.current.y);
      audioService.playSound('cup');
      holeCompletedRef.current = true;
      onHoleComplete(finalStrokes);
    } else if (d < holeRef.current.r * 3.5) {
      audioService.playSound('sigh');
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height } = canvas;
    const { cx, cy, rx, ry } = greenRef.current;

    ctx.fillStyle = "#0f172a"; 
    ctx.fillRect(0, 0, width, height);

    if (rx > 0) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981"; 
      ctx.fill();
      ctx.strokeStyle = "#059669"; 
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.setLineDash([2, 8]);
      for(let i = cx - rx; i < cx + rx; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, cy - ry); ctx.lineTo(i, cy + ry); ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    
    ctx.beginPath(); 
    ctx.arc(holeRef.current.x, holeRef.current.y, holeRef.current.r, 0, Math.PI * 2);
    ctx.fillStyle = "#000000"; 
    ctx.fill();

    if (!isMovingRef.current && !msg) {
      const { ang, len, drag } = arrowRef.current;
      const tx = ballRef.current.x + Math.cos(ang) * len;
      const ty = ballRef.current.y + Math.sin(ang) * len;
      ctx.beginPath(); ctx.moveTo(ballRef.current.x, ballRef.current.y); ctx.lineTo(tx, ty);
      ctx.strokeStyle = drag ? "#fbbf24" : "rgba(251, 191, 36, 0.5)";
      ctx.setLineDash(drag ? [] : [4, 4]); ctx.stroke(); ctx.setLineDash([]);

      const hs = drag ? 24 : 18;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-hs, -hs * 0.4); ctx.lineTo(-hs * 0.7, 0); ctx.lineTo(-hs, hs * 0.4);
      ctx.fillStyle = drag ? "#f43f5e" : "#f59e0b"; ctx.fill(); ctx.restore();
    }

    // ボールの描画（黄色）
    ctx.beginPath(); 
    ctx.arc(ballRef.current.x, ballRef.current.y, ballRef.current.r, 0, Math.PI * 2);
    ctx.fillStyle = "#facc15"; 
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // ボールに「HIT」マークを表示（静止中のみ）
    if (!isMovingRef.current && !msg) {
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 8px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HIT", ballRef.current.x, ballRef.current.y);
    }

    // パーティクル描画
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    });
    ctx.globalAlpha = 1.0;

  }, [msg]);

  useEffect(() => {
    const loop = () => {
      pulseRef.current = (pulseRef.current + 0.05) % (Math.PI * 2);
      updatePhysics();
      draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [draw, updatePhysics]);

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width; const h = canvas.height;
    greenRef.current = { cx: w / 2, cy: h * 0.5, rx: w * 0.44, ry: h * 0.38 };
    const { cx, cy, rx, ry } = greenRef.current;
    holeRef.current = { x: cx + (Math.random() * (rx * 0.8) - (rx * 0.4)), y: cy - (ry * 0.65), r: 15 };
    ballRef.current = { x: cx, y: cy + (ry * 0.75), vx: 0, vy: 0, r: 10 };
    isMovingRef.current = false; holeCompletedRef.current = false; setIsUIMoving(false);
    setStrokes(0); onStrokeUpdate(0); setMsg(""); setOutOfGreen(false);
    setLineType(Math.floor(Math.random() * 3) as LineType);
    const dx = holeRef.current.x - ballRef.current.x;
    const dy = holeRef.current.y - ballRef.current.y;
    arrowRef.current = { ang: Math.atan2(dy, dx), len: 80, drag: false };
    particlesRef.current = [];
  }, [onStrokeUpdate]);

  useEffect(() => { initGame(); }, [onResetTrigger, initGame]);

  const handleInputStart = (clientX: number, clientY: number) => {
    audioService.init();
    if (isMovingRef.current || msg) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (canvas.width / rect.width);
    const py = (clientY - rect.top) * (canvas.height / rect.height);
    if (Math.hypot(px - ballRef.current.x, py - ballRef.current.y) < ballRef.current.r * 2.8) {
      executeShot();
    } else {
      arrowRef.current.drag = true; updateAim(px, py);
    }
  };

  const updateAim = (px: number, py: number) => {
    const dx = px - ballRef.current.x; const dy = py - ballRef.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 15) arrowRef.current.ang = Math.atan2(dy, dx);
    arrowRef.current.len = Math.max(5, Math.min(MAX_POWER, dist));
  };

  const handleInputMove = (clientX: number, clientY: number) => {
    if (!arrowRef.current.drag) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (clientX - rect.left) * (canvas.width / rect.width);
    const py = (clientY - rect.top) * (canvas.height / rect.height);
    updateAim(px, py);
  };

  const executeShot = () => {
    if (isMovingRef.current || msg) return;
    const { ang, len } = arrowRef.current;
    startDistanceRef.current = Math.hypot(ballRef.current.x - holeRef.current.x, ballRef.current.y - holeRef.current.y);
    setStrokes(s => { const n = s + 1; onStrokeUpdate(n); return n; });
    audioService.playSound('hit');
    ballRef.current.vx = Math.cos(ang) * len * 0.125;
    ballRef.current.vy = Math.sin(ang) * len * 0.125;
    isMovingRef.current = true; setIsUIMoving(true);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          canvasRef.current.width = parent.clientWidth;
          canvasRef.current.height = Math.min(window.innerHeight * 0.65, 600);
          initGame();
        }
      }
    };
    window.addEventListener('resize', handleResize); handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [initGame]);

  return (
    <div className="relative w-full max-w-2xl mx-auto touch-none select-none px-2">
      <div className="absolute top-4 inset-x-0 text-center pointer-events-none z-10">
        <div className="inline-block bg-slate-900/90 backdrop-blur px-5 py-2 rounded-full border border-slate-700 shadow-xl">
           <span className={`${outOfGreen ? 'text-rose-400' : 'text-emerald-400'} font-black text-xs uppercase tracking-widest`}>
            {outOfGreen ? 'Out of Green! +1 Penalty' : LINE_NAMES[lineType]}
           </span>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full rounded-[2.5rem] shadow-2xl cursor-crosshair border-2 border-slate-800 bg-slate-900"
        onMouseDown={(e) => handleInputStart(e.clientX, e.clientY)}
        onTouchStart={(e) => { e.preventDefault(); handleInputStart(e.touches[0].clientX, e.touches[0].clientY); }}
        onMouseMove={(e) => handleInputMove(e.clientX, e.clientY)}
        onTouchMove={(e) => { e.preventDefault(); handleInputMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onMouseUp={() => arrowRef.current.drag = false}
        onTouchEnd={(e) => { e.preventDefault(); arrowRef.current.drag = false; }}
      />
      {msg && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm rounded-[2.5rem] animate-in fade-in zoom-in duration-500 pointer-events-none z-20">
          <div className="text-5xl md:text-7xl font-black text-amber-400 italic uppercase tracking-tighter text-center drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] px-4">
            {msg}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
