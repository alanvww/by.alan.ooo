/// <reference types="@webgpu/types" />

import tgpu from 'typegpu';
import * as d from 'typegpu/data';
import type { BackgroundRenderer, BackgroundTheme, RendererCallbacks } from './types';

// Field order must match the WGSL Uniforms struct: time at offset 0,
// resolution at offset 8 (d.struct inserts the 4 bytes of padding).
const Uniforms = d.struct({
  time: d.f32,
  resolution: d.vec2f,
});

const CLEAR_COLORS = {
  light: { r: 0.98, g: 0.98, b: 0.98, a: 1 },
  dark: { r: 0.08, g: 0.08, b: 0.12, a: 1 },
} as const satisfies Record<BackgroundTheme, GPUColorDict>;

const SHADER_SOURCE = /* wgsl */ `
// Ported from the GLSL fragment shader in webgl-renderer.ts
// (original: https://www.shadertoy.com/view/DsVSRy).

struct Uniforms {
  time: f32,
  resolution: vec2f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

// GLSL: #define SAMPLES 3 / FOCAL_DISTANCE 0.1 / FOCAL_RANGE 1.0
const SAMPLES: i32 = 3;
const FOCAL_DISTANCE: f32 = 0.1;
const FOCAL_RANGE: f32 = 1.0;

// GLSL mod(x, y) = x - y * floor(x / y). WGSL's % operator truncates instead,
// so define it explicitly (scalar and vec3 variants; WGSL has no user overloading).
fn glslMod(x: f32, y: f32) -> f32 {
  return x - y * floor(x / y);
}

fn glslMod3(x: vec3f, y: f32) -> vec3f {
  return x - y * floor(x / y);
}

// GLSL: mat2 m(float a){float c=cos(a), s=sin(a);return mat2(c,-s,s,c);}
// mat2(c,-s,s,c) is COLUMN-major: column 0 = (c,-s), column 1 = (s,c).
fn m(a: f32) -> mat2x2f {
  let c = cos(a);
  let s = sin(a);
  return mat2x2f(vec2f(c, -s), vec2f(s, c));
}

// GLSL: float map(vec3 p) — GLSL params are mutable copies; WGSL params are
// immutable, so copy into a local var. p.xz *= m(...) is row-vector v*M with
// assignment to a swizzle, which WGSL forbids: rebuild the vec3 instead.
fn map(pIn: vec3f) -> f32 {
  let t = uniforms.time; // #define t iTime -> uTime
  var p = pIn;
  let rxz = p.xz * m(t * 0.8); // GLSL: p.xz *= m(t * 0.8);
  p = vec3f(rxz.x, p.y, rxz.y);
  let rxy = p.xy * m(t * 0.6); // GLSL: p.xy *= m(t * 0.6);
  p = vec3f(rxy.x, rxy.y, p.z);
  let q = p * 2.0 + vec3f(t);
  return length(p + vec3f(sin(t * 0.7))) * log(length(p) + 1.0)
       + sin(q.x + sin(q.z + sin(q.y))) * 0.5 - 3.0;
}

fn hslToRgb(hsl: vec3f) -> vec3f {
  let rgb = clamp(
    abs(glslMod3(vec3f(hsl.x * 6.0) + vec3f(5.0, 4.0, 2.0), 6.0) - vec3f(3.0)) - vec3f(1.0),
    vec3f(0.0),
    vec3f(1.0)
  );
  return vec3f(hsl.z) + hsl.y * (rgb - vec3f(0.5)) * (1.0 - abs(2.0 * hsl.z - 1.0));
}

fn getColor(fragCoord: vec2f, depth: f32) -> vec3f {
  let t = uniforms.time;
  let p = fragCoord / uniforms.resolution.y - vec2f(0.9, 0.5);
  var cl = vec3f(0.0);
  var d = depth;

  for (var i: i32 = 0; i <= 3; i++) {
    // GLSL declares an inner \`vec3 p\` shadowing the outer \`vec2 p\`; the
    // initializer reads the OUTER p (its scope starts after the initializer).
    // Renamed to rayP with identical dataflow.
    let rayP = vec3f(0.0, 0.0, 5.0) + normalize(vec3f(p, -1.0)) * d;
    let rz = map(rayP);
    let f = clamp((rz - map(rayP + vec3f(0.1))) * 0.5, -1.1, 1.0);

    var hue = glslMod(t * 1.0 + f32(i) / 5.0, 1.0);
    let hueRange = 0.5;
    let hueShift = 0.3;
    hue = mix(0.0, 1.0, smoothstep(0.0, hueRange, hue)) + hueShift;

    let color = hslToRgb(vec3f(hue, 0.0, 0.8));
    let l = color + vec3f(1.0, 5.5, 0.5) * f;
    cl = cl * l + smoothstep(1.5, 0.0, rz) * 0.3 * l;

    d += min(rz, 1.0);
  }

  return cl;
}

fn mainImage(fragCoord: vec2f) -> vec4f {
  var color = vec3f(0.0);
  var depthSum = 5.2;

  for (var i: i32 = 0; i < SAMPLES; i++) {
    let depth = FOCAL_DISTANCE + (f32(i) / f32(SAMPLES - 1)) * FOCAL_RANGE;
    let sampleColor = getColor(fragCoord, depth);
    let weight = 3.0 / (0.2 + abs(depth - FOCAL_DISTANCE));

    color += sampleColor * weight;
    depthSum += weight;
  }

  color = color / depthSum;
  return vec4f(color, 1.0);
}

@vertex
fn main_vert(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  // Fullscreen triangle, no vertex buffers: i=0 -> (-1,-1), i=1 -> (3,-1), i=2 -> (-1,3).
  let xy = vec2f(f32((i << 1u) & 2u), f32(i & 2u)) * 2.0 - vec2f(1.0);
  return vec4f(xy, 0.0, 1.0);
}

@fragment
fn main_frag(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  // gl_FragCoord has a bottom-left origin; @builtin(position) is top-left.
  // Reconstruct GL-style coords so the image is not vertically mirrored.
  let fragCoord = vec2f(pos.x, uniforms.resolution.y - pos.y);
  return mainImage(fragCoord);
}
`;

export async function createWebGPURenderer(
  canvas: HTMLCanvasElement,
  callbacks: RendererCallbacks,
): Promise<BackgroundRenderer | null> {
  // Ambient decoration: never force the discrete GPU on dual-GPU machines.
  const root = await tgpu.init({ adapter: { powerPreference: 'low-power' } });

  const context = canvas.getContext('webgpu');

  if (!context) {
    root.destroy();
    return null;
  }

  const device = root.device;
  const format = navigator.gpu.getPreferredCanvasFormat();
  // 'opaque' matches the WebGL context's alpha: false.
  context.configure({ device, format, alphaMode: 'opaque' });

  const uniformsBuffer = root
    .createBuffer(Uniforms, { time: 0, resolution: d.vec2f(canvas.width, canvas.height) })
    .$usage('uniform');

  const layout = tgpu.bindGroupLayout({
    uniforms: { uniform: Uniforms, visibility: ['fragment'] },
  });
  const bindGroup = root.unwrap(root.createBindGroup(layout, { uniforms: uniformsBuffer }));

  const module = device.createShaderModule({ code: SHADER_SOURCE });
  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({ bindGroupLayouts: [root.unwrap(layout)] }),
    vertex: { module, entryPoint: 'main_vert' },
    fragment: { module, entryPoint: 'main_frag', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });

  let destroyed = false;

  // Spontaneous losses (sleep/wake, driver reset) go through the caller's
  // rebuild path; a loss caused by destroy() must not.
  void device.lost.then((): void => {
    if (destroyed) return;
    callbacks.onLost();
    callbacks.onRestored();
  });

  return {
    render(elapsedSeconds: number, theme: BackgroundTheme): void {
      uniformsBuffer.write({
        time: elapsedSeconds,
        resolution: d.vec2f(canvas.width, canvas.height),
      });

      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: CLEAR_COLORS[theme],
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.draw(3);
      pass.end();
      device.queue.submit([encoder.finish()]);
    },
    resize(): void {
      // getCurrentTexture() already sizes from canvas.width/height each frame.
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      // After a device loss the replacement renderer reconfigures this same
      // canvas context — only unconfigure a configuration we still own.
      if (context.getConfiguration?.()?.device === device) {
        context.unconfigure();
      }
      // root owns the device (tgpu.init), so this also destroys the buffer.
      root.destroy();
    },
  };
}
