import { useEffect, useRef, useState } from 'react';
import normalBgm from '../assets/sounds/normal.mp3';
import sanlowBgm from '../assets/sounds/sanlow.mp3';

/**
 * useAudio
 * 管理双轨 BGM：normal（SAN ≥ 40）/ sanlow（SAN < 40）
 * 切换时交叉淡入淡出（1s）
 */
export function useAudio(san) {
  const [muted, setMuted] = useState(false);
  const normalRef = useRef(null);
  const sanlowRef = useRef(null);
  const currentRef = useRef('normal'); // 'normal' | 'sanlow'
  const fadingRef = useRef(false);

  // 初始化两个 Audio 实例
  useEffect(() => {
    const normal = new Audio(normalBgm);
    normal.loop = true;
    normal.volume = 0;
    normalRef.current = normal;

    const sanlow = new Audio(sanlowBgm);
    sanlow.loop = true;
    sanlow.volume = 0;
    sanlowRef.current = sanlow;

    // 尝试自动播放 normal（需用户交互后才能真正播放）
    const startPlayback = () => {
      normal.play().catch(() => {});
      fadeTo(normal, 0.55, 1000);
      document.removeEventListener('click', startPlayback);
      document.removeEventListener('keydown', startPlayback);
    };
    document.addEventListener('click', startPlayback);
    document.addEventListener('keydown', startPlayback);

    return () => {
      normal.pause();
      sanlow.pause();
      document.removeEventListener('click', startPlayback);
      document.removeEventListener('keydown', startPlayback);
    };
  }, []);

  // SAN 变化时切换曲目
  useEffect(() => {
    const normal = normalRef.current;
    const sanlow = sanlowRef.current;
    if (!normal || !sanlow) return;

    const shouldBeSanlow = san < 40;
    const isSanlow = currentRef.current === 'sanlow';

    if (shouldBeSanlow && !isSanlow) {
      currentRef.current = 'sanlow';
      if (!muted) {
        sanlow.play().catch(() => {});
        crossFade(normal, sanlow, 1200);
      }
    } else if (!shouldBeSanlow && isSanlow) {
      currentRef.current = 'normal';
      if (!muted) {
        normal.play().catch(() => {});
        crossFade(sanlow, normal, 1200);
      }
    }
  }, [san, muted]);

  // 静音切换
  useEffect(() => {
    const normal = normalRef.current;
    const sanlow = sanlowRef.current;
    if (!normal || !sanlow) return;

    const targetVol = 0.55;
    if (muted) {
      fadeTo(normal, 0, 500);
      fadeTo(sanlow, 0, 500);
    } else {
      const active = currentRef.current === 'sanlow' ? sanlow : normal;
      active.play().catch(() => {});
      fadeTo(active, targetVol, 500);
    }
  }, [muted]);

  const toggleMute = () => setMuted(v => !v);

  return { muted, toggleMute };
}

// 渐变某个 Audio 到目标音量
function fadeTo(audio, targetVol, durationMs) {
  const steps = 30;
  const interval = durationMs / steps;
  const delta = (targetVol - audio.volume) / steps;
  let step = 0;
  const timer = setInterval(() => {
    step++;
    audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
    if (step >= steps) {
      audio.volume = targetVol;
      clearInterval(timer);
    }
  }, interval);
}

// 交叉淡入淡出
function crossFade(fadeOut, fadeIn, durationMs) {
  fadeTo(fadeOut, 0, durationMs);
  fadeTo(fadeIn, 0.55, durationMs);
  setTimeout(() => { fadeOut.pause(); fadeOut.currentTime = 0; }, durationMs + 100);
}
