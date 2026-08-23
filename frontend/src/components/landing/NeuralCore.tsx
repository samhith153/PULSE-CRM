"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Program, Mesh, Geometry, Vec3, Transform } from "ogl";

type NeuralCoreProps = {
  className?: string;
};

/**
 * Interactive WebGL "AI brain" — a rotating neural particle sphere with
 * synaptic connection lines and travelling activation waves.
 * Drag to rotate · auto-rotates when idle · pauses when tab is hidden.
 */
export function NeuralCore({ className }: NeuralCoreProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
    } catch {
      return; /* WebGL unavailable — CSS fallback layers carry the visual */
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    /* additive glow */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    host.appendChild(canvas);

    const camera = new Camera(gl, { fov: 32 });
    camera.position.set(0, 0, 6.2);

    /* ── Particle sphere (fibonacci lattice) ── */
    const COUNT = 520;
    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const R = 2.05;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const rad = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      positions[i * 3] = Math.cos(theta) * rad * R;
      positions[i * 3 + 1] = y * R;
      positions[i * 3 + 2] = Math.sin(theta) * rad * R;
      scales[i] = Math.random();
    }

    /* ── Synaptic links between nearby particles ── */
    const links: number[] = [];
    const maxDist = 0.62;
    outer: for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < maxDist * maxDist) {
          links.push(i, j);
          if (links.length >= 4000) break outer;
        }
      }
    }

    /* NOTE: ogl auto-declares `position` + matrices in its shader prefix,
       so only custom attributes/uniforms are declared here. */
    const pointsProg = new Program(gl, {
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uPR: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uColorA: { value: new Vec3(0.0, 0.898, 0.6) }, /* mint #00e599 */
        uColorB: { value: new Vec3(0.302, 0.639, 1.0) }, /* blue #4da3ff */
      },
      vertex: /* glsl */ `
        attribute vec3 position;
        attribute float aScale;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uPR;
        varying float vGlow;
        void main() {
          vec3 p = position;
          float w = sin(uTime * 1.5 + p.y * 2.6 + p.x * 1.4);
          p *= 1.0 + 0.035 * w;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (1.7 + aScale * 2.9) * uPR * (3.4 / -mv.z);
          vGlow = 0.5 + 0.5 * w;
        }
      `,
      fragment: /* glsl */ `
        precision highp float;
        varying float vGlow;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float a = smoothstep(0.5, 0.05, d);
          a *= a;
          vec3 col = mix(uColorA, uColorB, vGlow);
          gl_FragColor = vec4(col, a * (0.55 + 0.45 * vGlow));
        }
      `,
    });

    const lineProg = new Program(gl, {
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uAlpha: { value: 0.16 } },
      vertex: /* glsl */ `
        attribute vec3 position;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: /* glsl */ `
        precision highp float;
        uniform float uAlpha;
        void main() {
          gl_FragColor = vec4(0.30, 0.85, 0.72, uAlpha);
        }
      `,
    });

    const pointsGeom = new Geometry(gl, {
      position: { size: 3, data: positions },
      aScale: { size: 1, data: scales },
    });
    const lineGeom = new Geometry(gl, {
      position: { size: 3, data: positions },
      index: { data: new Uint16Array(links) },
    });

    const pointsMesh = new Mesh(gl, { geometry: pointsGeom, program: pointsProg, mode: gl.POINTS });
    const lineMesh = new Mesh(gl, { geometry: lineGeom, program: lineProg, mode: gl.LINES });
    const scene = new Transform();
    lineMesh.setParent(scene);
    pointsMesh.setParent(scene);

    /* ── Interaction: drag to rotate with inertia ── */
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let rotX = -0.28;
    let rotY = 0.6;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velY = dx * 0.0045;
      velX = dy * 0.0045;
      rotY += velY;
      rotX += velX;
    };
    const onUp = () => {
      dragging = false;
      canvas.style.cursor = "grab";
    };
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    /* ── Resize ── */
    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / h });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* ── Loop ── */
    let raf = 0;
    let visible = !document.hidden;
    const onVis = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", onVis);

    const start = performance.now();
    const IDLE_SPIN = 0.0035;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - start) / 1000;

      if (!dragging && !reduceMotion) {
        velX += (0 - velX) * 0.02;
        velY += (IDLE_SPIN - velY) * 0.02;
        rotX += velX;
        rotY += velY;
      }

      pointsMesh.rotation.x = rotX;
      pointsMesh.rotation.y = rotY;
      lineMesh.rotation.x = rotX;
      lineMesh.rotation.y = rotY;

      pointsProg.uniforms.uTime.value = t;
      renderer.render({ scene, camera });
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden style={{ touchAction: "pan-y" }} />;
}
