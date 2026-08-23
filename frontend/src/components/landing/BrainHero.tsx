"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Program, Mesh, Geometry, Vec3, Transform } from "ogl";

type BrainHeroProps = {
  className?: string;
};

/**
 * "Neural engine" hero stage — a glowing wireframe brain hovering over a
 * circuit CPU platform, with signal particles streaming up into the mind.
 * Drag to rotate · auto-rotates · pauses when the tab is hidden.
 */
export function BrainHero({ className }: BrainHeroProps) {
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
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    host.appendChild(canvas);

    const camera = new Camera(gl, { fov: 34 });
    camera.position.set(0, 0.55, 6.6);
    camera.lookAt([0, -0.05, 0]);

    /* ───────────────────────── palette ───────────────────────── */
    const CYAN = new Vec3(0.21, 0.88, 1.0);
    const BLUE = new Vec3(0.3, 0.64, 1.0);
    const ORANGE = new Vec3(1.0, 0.6, 0.3);

    /* ─────────────── shared point shaders ─────────────── */
    const makePointProg = () =>
      new Program(gl, {
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uPR: { value: Math.min(window.devicePixelRatio || 1, 2) },
        },
        vertex: /* glsl */ `
          attribute vec3 position;
          attribute vec3 aColor;
          attribute float aSize;
          attribute float aSeed;
          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;
          uniform float uTime;
          uniform float uPR;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            /* rising signal stream: particles climb from the chip into the brain */
            if (aSize < 0.0) {
              float t = fract(aSeed + uTime * 0.085 * (0.6 + fract(aSeed * 7.31)));
              float ang = aSeed * 43.0;
              float rad = 0.05 + t * (0.26 + 0.55 * fract(aSeed * 3.77));
              p = vec3(
                cos(ang) * rad + sin(t * 9.0 + aSeed * 21.0) * 0.04,
                mix(-1.04, -0.34, t),
                sin(ang) * rad
              );
              vAlpha = smoothstep(0.0, 0.14, t) * smoothstep(1.0, 0.8, t);
            } else {
              vAlpha = 0.68 + 0.32 * sin(uTime * (0.6 + fract(aSeed) * 1.8) + aSeed * 50.0);
            }
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float size = abs(aSize);
            gl_PointSize = size * uPR * (4.6 / -mv.z);
            vColor = aColor;
          }
        `,
        fragment: /* glsl */ `
          precision highp float;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            float a = smoothstep(0.5, 0.06, d);
            a *= a * 0.9 + 0.1;
            gl_FragColor = vec4(vColor, a * max(vAlpha, 0.0));
          }
        `,
      });

    const makeLineProg = (alpha: number, color: Vec3) =>
      new Program(gl, {
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: { uAlpha: { value: alpha }, uColor: { value: color } },
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
        uniform vec3 uColor;
          void main() {
            gl_FragColor = vec4(uColor, uAlpha);
          }
        `,
      });

    /* ───────────────────── scene graph ───────────────────── */
    const scene = new Transform();
    const root = new Transform(); // drag-controlled
    root.setParent(scene);

    /* ── 1. CPU platform ── */
    const Y_CHIP = -1.16;
    const chipLines: number[] = [];
    const chipDots: { p: [number, number, number]; c: Vec3; s: number }[] = [];

    const square = (half: number) => {
      const c: [number, number][] = [
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ];
      for (let i = 0; i < 4; i++) {
        const a = c[i];
        const b = c[(i + 1) % 4];
        chipLines.push(a[0], Y_CHIP, a[1], b[0], Y_CHIP, b[1]);
      }
    };
    square(1.58);
    square(1.06);
    square(0.52);

    /* circuit traces radiating outward with an orthogonal bend */
    for (let i = 0; i < 26; i++) {
      const side = i % 4;
      let x = 0;
      let z = 0;
      let dx = 0;
      let dz = 0;
      const start = 0.56 + Math.random() * 0.1;
      const len1 = 0.25 + Math.random() * 0.5;
      const len2 = 0.2 + Math.random() * 0.55;
      if (side === 0) { x = start * 2 * 0.52; z = 0.52; dx = 0; dz = 1; }
      if (side === 1) { x = -0.52; z = start * 2 * 0.52; dx = -1; dz = 0; }
      if (side === 2) { x = start * 2 * 0.52; z = -0.52; dx = 0; dz = -1; }
      if (side === 3) { x = 0.52; z = start * 2 * 0.52; dx = 1; dz = 0; }
      const ax = x + dx * len1;
      const az = z + dz * len1;
      chipLines.push(x, Y_CHIP, z, ax, Y_CHIP, az);
      // perpendicular jog
      const px = ax + dz * len2 * (i % 2 ? 1 : -1);
      const pz = az + dx * len2 * (i % 2 ? 1 : -1);
      chipLines.push(ax, Y_CHIP, az, px, Y_CHIP, pz);
      chipDots.push({
        p: [px, Y_CHIP, pz],
        c: i % 5 === 0 ? ORANGE : CYAN,
        s: 2.6 + Math.random() * 1.8,
      });
    }

    const chipLineMesh = new Mesh(
      gl,
      {
        geometry: new Geometry(gl, {
          position: { size: 3, data: new Float32Array(chipLines) },
        }),
        program: makeLineProg(0.55, CYAN),
        mode: gl.LINES,
      },
    );

    /* chip core glow sprites */
    const chipGlow: { p: [number, number, number]; c: Vec3; s: number }[] = [
      { p: [0, Y_CHIP + 0.04, 0], c: new Vec3(1.0, 0.82, 0.55), s: 22 },
      { p: [0, Y_CHIP + 0.06, 0], c: CYAN, s: 26 },
    ];

    /* ── 2. Brain point cloud ── */
    const brainPts: number[] = [];
    const brainCols: number[] = [];
    const brainSizes: number[] = [];
    const brainSeeds: number[] = [];

    const addBrainPoint = (x: number, y: number, z: number, bright = 1, size = 3.4) => {
      brainPts.push(x, y, z);
      const c = Math.random() > 0.94 ? BLUE : CYAN;
      brainCols.push(c.x, c.y, c.z);
      brainSizes.push(size * (0.85 + Math.random() * 0.6));
      brainSeeds.push(Math.random());
      void bright;
    };

    /* wrinkled ellipsoid hemispheres */
    const N = 980;
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const yy = 1 - (i / (N - 1)) * 2;
      const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
      const x = Math.cos(golden * i) * rr;
      const z = Math.sin(golden * i) * rr;
      const y = yy;

      /* wrinkle field */
      const w =
        Math.sin(x * 6.5 + z * 3.1) * 0.5 +
        Math.sin(y * 7.3 - x * 4.2) * 0.35 +
        Math.sin(z * 8.1 + y * 2.7) * 0.3;

      /* ellipsoid scale */
      let px = x * 0.86;
      let py = y * 0.74;
      let pz = z * 1.06;

      /* hemisphere groove along the midline */
      const groove = Math.max(0, 1 - Math.abs(px) / 0.16);
      px *= 1 - groove * 0.45;
      py -= groove * 0.16;

      /* flatten the underside a touch */
      if (py < -0.5) py = -0.5 + (py + 0.5) * 0.55;

      const bump = 1 + w * 0.075;
      addBrainPoint(px * bump, py * bump, pz * bump);
    }

    /* cerebellum */
    for (let i = 0; i < 190; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 0.34 * (1 + 0.05 * Math.sin(th * 14));
      const cx = 0;
      const cy = -0.52;
      const cz = -0.72;
      addBrainPoint(
        cx + r * Math.sin(ph) * Math.cos(th),
        cy + r * Math.cos(ph) * 0.8,
        cz + r * Math.sin(ph) * Math.sin(th),
        1,
        2.9,
      );
    }

    /* brain stem */
    for (let i = 0; i < 70; i++) {
      const t = i / 69;
      addBrainPoint(
        Math.sin(t * 12) * 0.03,
        -0.62 - t * 0.34,
        -0.55 + t * 0.28,
        1,
        2.8,
      );
    }

    /* synapse links */
    const bp = brainPts;
    const count = bp.length / 3;
    const brainLinks: number[] = [];
    const maxD = 0.42;
    outer: for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = bp[i * 3] - bp[j * 3];
        const dy = bp[i * 3 + 1] - bp[j * 3 + 1];
        const dz = bp[i * 3 + 2] - bp[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < maxD * maxD) {
          brainLinks.push(i, j);
          if (brainLinks.length >= 6000) break outer;
        }
      }
    }

    const brainRoot = new Transform();
    brainRoot.position.set(0, 0.58, 0);
    brainRoot.scale.set(1.16, 1.16, 1.16);
    brainRoot.setParent(root);

    const brainLineMesh = new Mesh(
      gl,
      {
        geometry: new Geometry(gl, {
          position: { size: 3, data: new Float32Array(bp) },
          index: { data: new Uint16Array(brainLinks) },
        }),
        program: makeLineProg(0.22, CYAN),
        mode: gl.LINES,
      },
    );
    brainLineMesh.setParent(brainRoot);

    /* ── Creative surroundings ── */
    /* PCB floor grid */
    const gridLines: number[] = [];
    for (let v = -1.4; v <= 1.41; v += 0.35) {
      const vv = Math.round(v * 100) / 100;
      gridLines.push(-1.4, Y_CHIP, vv, 1.4, Y_CHIP, vv);
      gridLines.push(vv, Y_CHIP, -1.4, vv, Y_CHIP, 1.4);
    }
    const gridMesh = new Mesh(
      gl,
      {
        geometry: new Geometry(gl, { position: { size: 3, data: new Float32Array(gridLines) } }),
        program: makeLineProg(0.16, CYAN),
        mode: gl.LINES,
      },
    );
    gridMesh.setParent(root);

    /* golden pins ringing the die */
    for (let i = -7; i <= 7; i++) {
      const pxPin = i * 0.21;
      if (Math.abs(pxPin) > 1.5) continue;
      chipDots.push({ p: [pxPin, Y_CHIP, 1.68], c: ORANGE, s: 3.2 });
      chipDots.push({ p: [pxPin, Y_CHIP, -1.68], c: ORANGE, s: 3.2 });
    }

    /* orbital containment rings */
    const mkRing = (r: number, pitch: number, segs = 150) => {
      const pts: number[] = [];
      const sats: [number, number, number][] = [];
      const ca = Math.cos(pitch);
      const sa = Math.sin(pitch);
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * Math.PI * 2;
        const a1 = ((i + 1) / segs) * Math.PI * 2;
        const rot = (a: number): [number, number, number] => {
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;
          return [x, -z * sa, z * ca];
        };
        pts.push(...rot(a0), ...rot(a1));
        if (i % 30 === 0) sats.push(rot(a0));
      }
      return { pts, sats };
    };
    const ringA = mkRing(2.95, 0.42);
    const ringB = mkRing(3.35, -0.3);
    const ringMesh = new Mesh(
      gl,
      {
        geometry: new Geometry(gl, {
          position: { size: 3, data: new Float32Array([...ringA.pts, ...ringB.pts]) },
        }),
        program: makeLineProg(0.22, CYAN),
        mode: gl.LINES,
      },
    );
    ringMesh.setParent(root);

    /* brain core glow */
    chipDots.push(
      { p: [0, 0.58, 0], c: new Vec3(0.75, 0.98, 0.92), s: 18 },
    );

    /* ── 3. Ambient dust ── */
    const DUST = 240;
    const dustPos: number[] = [];
    const dustCol: number[] = [];
    const dustSize: number[] = [];
    const dustSeed: number[] = [];
    for (let i = 0; i < DUST; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const r = 1.9 + Math.random() * 1.6;
      dustPos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.75 + 0.1, r * Math.sin(ph) * Math.sin(th));
      const c = Math.random() > 0.86 ? ORANGE : Math.random() > 0.4 ? BLUE : CYAN;
      dustCol.push(c.x, c.y, c.z);
      dustSize.push(1.4 + Math.random() * 1.6);
      dustSeed.push(Math.random());
    }

    /* ring satellites — bright orbiting nodes */
    for (const s of [...ringA.sats, ...ringB.sats]) {
      dustPos.push(s[0], s[1], s[2]);
      const sc = Math.random() > 0.5 ? BLUE : CYAN;
      dustCol.push(sc.x, sc.y, sc.z);
      dustSize.push(6.5);
      dustSeed.push(Math.random());
    }

    /* data pillars rising from the platform corners */
    for (const cxp of [-1.3, 1.3]) {
      for (const czp of [-1.3, 1.3]) {
        for (let i = 0; i < 12; i++) {
          const t2 = i / 11;
          const pull = 1 - t2 * 0.22;
          dustPos.push(cxp * pull, Y_CHIP + 0.08 + t2 * 1.05, czp * pull);
          const pc = i % 3 === 2 ? BLUE : CYAN;
          dustCol.push(pc.x, pc.y, pc.z);
          dustSize.push(2.6);
          dustSeed.push(Math.random());
        }
      }
    }

    /* ── 4. Rising stream (positions computed in-shader) ── */
    const STREAM = 230;
    const streamPos = new Float32Array(STREAM * 3); // dummy
    const streamCol: number[] = [];
    const streamSize: number[] = [];
    const streamSeed: number[] = [];
    for (let i = 0; i < STREAM; i++) {
      streamPos[i * 3] = 0;
      streamPos[i * 3 + 1] = 0;
      streamPos[i * 3 + 2] = 0;
      const hot = Math.random() > 0.92;
      const c = hot ? ORANGE : Math.random() > 0.5 ? CYAN : BLUE;
      streamCol.push(c.x, c.y, c.z);
      streamSize.push(-(1.6 + Math.random() * 2.4)); // negative marks stream mode
      streamSeed.push(Math.random());
    }

    const mkPointsMesh = (
      pos: Float32Array | number[],
      cols: number[],
      sizes: number[],
      seeds: number[],
    ) =>
      new Mesh(gl, {
        geometry: new Geometry(gl, {
          position: { size: 3, data: pos instanceof Float32Array ? pos : new Float32Array(pos) },
          aColor: { size: 3, data: new Float32Array(cols) },
          aSize: { size: 1, data: new Float32Array(sizes) },
          aSeed: { size: 1, data: new Float32Array(seeds) },
        }),
        program: makePointProg(),
        mode: gl.POINTS,
      });

    const brainPointsMesh = mkPointsMesh(new Float32Array(bp), brainCols, brainSizes, brainSeeds);
    brainPointsMesh.setParent(brainRoot);

    const dustMesh = mkPointsMesh(
      new Float32Array(dustPos),
      dustCol,
      dustSize,
      dustSeed,
    );
    dustMesh.setParent(root);

    const streamMesh = mkPointsMesh(streamPos, streamCol, streamSize, streamSeed);
    streamMesh.setParent(root);

    const chipDotMesh = (() => {
      const p: number[] = [];
      const c: number[] = [];
      const s: number[] = [];
      const sd: number[] = [];
      for (const d of [...chipDots, ...chipGlow]) {
        p.push(...d.p);
        c.push(d.c.x, d.c.y, d.c.z);
        s.push(d.s);
        sd.push(Math.random());
      }
      return mkPointsMesh(new Float32Array(p), c, s, sd);
    })();
    chipDotMesh.setParent(root);

    chipLineMesh.setParent(root);

    /* ── Interaction: drag to rotate with inertia ── */
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let velY = 0;
    let rotY = 0;
    let rotX = 0;
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
      velY = dx * 0.005;
      rotY += velY;
      rotX = Math.max(-0.3, Math.min(0.3, rotX + dy * 0.003));
    };
    const onUp = () => {
      dragging = false;
      canvas.style.cursor = "grab";
    };
    canvas.style.cursor = "grab";
    canvas.addEventListener("pointerdown", onDown);
    /* resilience: survive context loss (some GPUs / headless SwiftShader lose contexts) */
    const extLoss = gl.getExtension("WEBGL_lose_context");
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      canvas.style.visibility = "hidden";
      cancelAnimationFrame(raf);
      console.warn("[NeuralCore] WebGL context lost");
    });
    canvas.addEventListener("webglcontextrestored", () => {
      canvas.style.visibility = "visible";
      extLoss?.restoreContext?.();
    });
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
    const IDLE = 0.0038;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - start) / 1000;

      if (!dragging && !reduceMotion) {
        velY += (IDLE - velY) * 0.02;
        rotY += velY;
      }

      root.rotation.y = rotY;
      root.rotation.x = rotX;

      /* breathing float for the brain */
      brainRoot.position.y = 0.58 + (reduceMotion ? 0 : Math.sin(t * 0.85) * 0.055);
      brainRoot.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.4) * 0.08;

      scene.traverse((m: any) => {
        const u = m?.program?.uniforms;
        if (u?.uTime) u.uTime.value = t;
      });

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
