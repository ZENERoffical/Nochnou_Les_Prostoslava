import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Dices, Palette, RotateCw, UserRound, X } from 'lucide-react';
import { animateRobloxCharacter, createCustomRobloxRig } from '../game/characters';
import { makeHeroPreset, sanitizeNickname } from '../game/customization';
import { getUiText } from '../game/localization';
import {
  CharacterCustomization,
  GameLanguage,
  HeroPartOwner,
} from '../types/game';

interface CharacterCustomizerModalProps {
  open: boolean;
  language: GameLanguage;
  nickname: string;
  customization: CharacterCustomization;
  onSave: (nickname: string, customization: CharacterCustomization) => void;
  onClose: () => void;
}

export const CharacterCustomizerModal: React.FC<CharacterCustomizerModalProps> = ({
  open,
  language,
  nickname,
  customization,
  onSave,
  onClose,
}) => {
  const [draftName, setDraftName] = useState(nickname);
  const [draftCustom, setDraftCustom] = useState<CharacterCustomization>(customization);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const manualYawRef = useRef(0.35);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);

  useEffect(() => {
    if (open) {
      setDraftName(nickname);
      setDraftCustom(customization);
    }
  }, [open, nickname, customization]);

  useEffect(() => {
    if (!open) return;
    const container = previewContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 220;
    const height = container.clientHeight || 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1620);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 40);
    camera.position.set(0, 1.45, 4.15);
    camera.lookAt(0, 1.15, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 1.35);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(2.5, 4, 3.2);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(-2.5, 2, -2.5);
    scene.add(rimLight);

    const floorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.22, 0.12, 24),
      new THREE.MeshStandardMaterial({
        color: 0x132634,
        roughness: 0.6,
        metalness: 0.25,
      })
    );
    floorMesh.position.y = -0.06;
    scene.add(floorMesh);

    const rig = createCustomRobloxRig(
      4,
      sanitizeNickname(draftName),
      draftCustom,
      '#86efac'
    );
    scene.add(rig.root);

    let raf = 0;
    let lastTime = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      if (!draggingRef.current) {
        manualYawRef.current += dt * 0.65;
      }
      rig.root.rotation.y = manualYawRef.current;
      animateRobloxCharacter(rig, 0.35, dt, elapsed, false, false, false);
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      scene.remove(rig.root);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [open, draftCustom, draftName]);

  if (!open) return null;

  const t = getUiText(language);

  const heroOptions: Array<{ id: HeroPartOwner; label: string; color: string }> = [
    { id: 'nikita', label: t.heroNikita, color: 'border-emerald-400 bg-emerald-500/25 text-emerald-200' },
    { id: 'roner', label: t.heroRoner, color: 'border-amber-400 bg-amber-500/25 text-amber-200' },
    { id: 'sasha', label: t.heroSasha, color: 'border-sky-400 bg-sky-500/25 text-sky-200' },
  ];

  const slots: Array<{
    key: keyof CharacterCustomization;
    label: string;
    allowNone?: boolean;
  }> = [
    { key: 'head', label: t.slotHead },
    { key: 'hat', label: t.slotHat, allowNone: true },
    { key: 'torso', label: t.slotTorso },
    { key: 'wings', label: t.slotWings },
    { key: 'legs', label: t.slotLegs },
  ];

  const handleRandomMix = () => {
    const owners: HeroPartOwner[] = ['nikita', 'roner', 'sasha'];
    const hatPool: Array<HeroPartOwner | 'none'> = ['nikita', 'roner', 'sasha', 'none'];
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    setDraftCustom({
      head: pick(owners),
      hat: pick(hatPool),
      torso: pick(owners),
      wings: pick(owners),
      legs: pick(owners),
    });
  };

  const handleApplyPreset = (hero: HeroPartOwner) => {
    setDraftCustom(makeHeroPreset(hero));
  };

  const handleSave = () => {
    onSave(sanitizeNickname(draftName), draftCustom);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-3 sm:p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        } else {
          e.stopPropagation();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border-2 border-emerald-400/50 bg-[#0a1319] p-4 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Palette className="h-5 w-5 text-emerald-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-white">
                {t.customizerTitle}
              </h2>
              <p className="text-[11px] font-medium text-slate-300">
                {t.customizerSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeSettings}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid flex-1 grid-cols-1 sm:grid-cols-12 gap-4 overflow-y-auto pr-1">
          {/* Live 3D Rotating Preview */}
          <div className="sm:col-span-5 flex flex-col gap-2.5">
            <div className="relative overflow-hidden rounded-xl border border-emerald-400/35 bg-[#0b1620]">
              <div
                ref={previewContainerRef}
                onPointerDown={(e) => {
                  draggingRef.current = true;
                  lastXRef.current = e.clientX;
                }}
                onPointerMove={(e) => {
                  if (!draggingRef.current) return;
                  const dx = e.clientX - lastXRef.current;
                  lastXRef.current = e.clientX;
                  manualYawRef.current += dx * 0.015;
                }}
                onPointerUp={() => {
                  draggingRef.current = false;
                }}
                onPointerLeave={() => {
                  draggingRef.current = false;
                }}
                className="h-56 sm:h-64 w-full cursor-grab active:cursor-grabbing"
              />
              <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                <RotateCw className="h-3 w-3 text-emerald-300" />
                3D
              </div>
            </div>

            {/* Quick Hero Presets + Randomize */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('nikita')}
                className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-2 py-1.5 text-xs font-black text-emerald-200 cursor-pointer"
              >
                {t.heroNikita}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('roner')}
                className="rounded-lg border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 px-2 py-1.5 text-xs font-black text-amber-200 cursor-pointer"
              >
                {t.heroRoner}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('sasha')}
                className="rounded-lg border border-sky-400/40 bg-sky-500/15 hover:bg-sky-500/25 px-2 py-1.5 text-xs font-black text-sky-200 cursor-pointer"
              >
                {t.heroSasha}
              </button>
              <button
                type="button"
                onClick={handleRandomMix}
                className="flex items-center justify-center gap-1 rounded-lg border border-fuchsia-400/45 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 px-2 py-1.5 text-xs font-black text-fuchsia-200 cursor-pointer"
              >
                <Dices className="h-3.5 w-3.5" />
                {t.randomMixBtn}
              </button>
            </div>
          </div>

          {/* Nickname & 5 Mix-and-Match Slots */}
          <div className="sm:col-span-7 flex flex-col gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-300">
                <UserRound className="h-3.5 w-3.5" />
                {t.nicknameLabel}
              </label>
              <input
                type="text"
                maxLength={18}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm font-black text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {slots.map((slot) => (
              <div
                key={slot.key}
                className="rounded-xl border border-white/10 bg-white/5 p-2.5"
              >
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  {slot.label}
                </div>
                <div
                  className={`grid gap-1.5 ${
                    slot.allowNone ? 'grid-cols-4' : 'grid-cols-3'
                  }`}
                >
                  {heroOptions.map((opt) => {
                    const active = draftCustom[slot.key] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setDraftCustom((prev) => ({ ...prev, [slot.key]: opt.id }))
                        }
                        className={`rounded-lg border px-2 py-1.5 text-xs font-black transition-all cursor-pointer ${
                          active
                            ? opt.color
                            : 'border-white/10 bg-black/35 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                  {slot.allowNone && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraftCustom((prev) => ({ ...prev, [slot.key]: 'none' }))
                      }
                      className={`rounded-lg border px-2 py-1.5 text-xs font-black transition-all cursor-pointer ${
                        draftCustom[slot.key] === 'none'
                          ? 'border-slate-300 bg-slate-500/30 text-white'
                          : 'border-white/10 bg-black/35 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {t.heroNone}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="mt-4 w-full shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3 text-sm font-black text-slate-950 transition-colors cursor-pointer"
        >
          {t.saveCustomBtn}
        </button>
      </div>
    </div>
  );
};
