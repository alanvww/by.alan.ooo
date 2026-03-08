'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/theme-context';

const MAX_DEVICE_PIXEL_RATIO = 1.5;

interface WebGLResources {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  vertexShader: WebGLShader;
  fragmentShader: WebGLShader;
  positionBuffer: WebGLBuffer;
  positionAttributeLocation: number;
  uTimeLocation: WebGLUniformLocation;
  uResolutionLocation: WebGLUniformLocation;
}

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);

  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram();

  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function setupWebGL(canvas: HTMLCanvasElement): WebGLResources | null {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    console.error('Unable to initialize WebGL. Your browser may not support it.');
    return null;
  }

  const vertexShaderSource = `
    attribute vec4 position;
    void main() {
      gl_Position = position;
    }
  `;

  const fragmentShaderSource = `/*
    * Original shader from: https://www.shadertoy.com/view/DsVSRy
    */

    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float uTime;
    uniform vec2 uResolution;

    #define iTime uTime
    #define iResolution uResolution

    #define t iTime
    #define SAMPLES 5
    #define FOCAL_DISTANCE 0.1
    #define FOCAL_RANGE 1.0

    mat2 m(float a){float c=cos(a), s=sin(a);return mat2(c,-s,s,c);}

    float map(vec3 p){
      p.xz *= m(t * 0.8);
      p.xy *= m(t * 0.6);
      vec3 q = p * 2.0 + t;
      return length(p + vec3(sin(t * 0.7))) * log(length(p) + 1.0) + sin(q.x + sin(q.z + sin(q.y))) * 0.5 - 3.0;
    }

    vec3 hslToRgb(vec3 hsl) {
      vec3 rgb = clamp(abs(mod(hsl.x * 6.0 + vec3(5.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
      return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0 * hsl.z - 1.0));
    }

    vec3 getColor(in vec2 fragCoord, in float depth) {
      vec2 p = fragCoord.xy / iResolution.y - vec2(.9, .5);
      vec3 cl = vec3(0.);
      float d = depth;

      for (int i = 0; i <= 5; i++) {
        vec3 p = vec3(0, 0, 5.0) + normalize(vec3(p, -1.0)) * d;
        float rz = map(p);
        float f = clamp((rz - map(p + .1)) * 0.5, -1.1, 1.0);

        float hue = mod(t * 1.0 + float(i) / 5.0, 1.0);
        float hueRange = 0.5;
        float hueShift = 0.3;
        hue = mix(0.0, 1.0, smoothstep(0.0, hueRange, hue)) + hueShift;

        vec3 color = hslToRgb(vec3(hue, 0.0, 0.8));
        vec3 l = color + vec3(1.0, 5.5, 0.5) * f;
        cl = cl * l + smoothstep(1.5, 0.0, rz) * 0.3 * l;

        d += min(rz, 1.0);
      }

      return cl;
    }

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec3 color = vec3(0.0);
      float depthSum = 5.2;

      for (int i = 0; i < SAMPLES; i++) {
        float depth = FOCAL_DISTANCE + (float(i) / float(SAMPLES - 1)) * FOCAL_RANGE;
        vec3 sampleColor = getColor(fragCoord, depth);
        float weight = 3.0 / (0.2 + abs(depth - FOCAL_DISTANCE));

        color += sampleColor * weight;
        depthSum += weight;
      }

      color /= depthSum;
      fragColor = vec4(color, 1.0);
    }

    void main(void) {
      mainImage(gl_FragColor, gl_FragCoord.xy);
    }
  `;

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  if (!vertexShader || !fragmentShader) {
    if (vertexShader) gl.deleteShader(vertexShader);
    if (fragmentShader) gl.deleteShader(fragmentShader);
    return null;
  }

  const program = createProgram(gl, vertexShader, fragmentShader);

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  const positionBuffer = gl.createBuffer();

  if (!positionBuffer) {
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-5.0, 5.0, 5.0, 5.0, -5.0, -5.0, 5.0, -5.0]), gl.STATIC_DRAW);

  const positionAttributeLocation = gl.getAttribLocation(program, 'position');
  const uTimeLocation = gl.getUniformLocation(program, 'uTime');
  const uResolutionLocation = gl.getUniformLocation(program, 'uResolution');

  if (positionAttributeLocation === -1 || !uTimeLocation || !uResolutionLocation) {
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.useProgram(program);

  return {
    gl,
    program,
    vertexShader,
    fragmentShader,
    positionBuffer,
    positionAttributeLocation,
    uTimeLocation,
    uResolutionLocation,
  };
}

function destroyWebGL(resources: WebGLResources): void {
  const { gl, positionBuffer, program, fragmentShader, vertexShader } = resources;
  gl.deleteBuffer(positionBuffer);
  gl.deleteProgram(program);
  gl.deleteShader(fragmentShader);
  gl.deleteShader(vertexShader);
}

function resizeCanvas(canvas: HTMLCanvasElement, gl: WebGLRenderingContext): void {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const width = Math.round(window.innerWidth * dpr);
  const height = Math.round(window.innerHeight * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
}

const WebGLBackground = (): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = useRef<WebGLResources | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const resources = setupWebGL(canvas);

    if (!resources) {
      return;
    }

    resourcesRef.current = resources;
    resizeCanvas(canvas, resources.gl);

    const render = (): void => {
      const currentResources = resourcesRef.current;

      if (!currentResources || !isVisibleRef.current) {
        animationFrameRef.current = null;
        return;
      }

      const { gl, program, uTimeLocation, uResolutionLocation } = currentResources;
      const elapsedTime = (performance.now() - startTimeRef.current) / 1000;
      const bgColor = theme === 'light' ? [0.98, 0.98, 0.98, 1] : [0.08, 0.08, 0.12, 1];

      gl.clearColor(bgColor[0], bgColor[1], bgColor[2], bgColor[3]);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform1f(uTimeLocation, elapsedTime);
      gl.uniform2f(uResolutionLocation, gl.canvas.width, gl.canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    startTimeRef.current = performance.now();
    animationFrameRef.current = window.requestAnimationFrame(render);

    const handleResize = (): void => {
      if (canvasRef.current && resourcesRef.current) {
        resizeCanvas(canvasRef.current, resourcesRef.current.gl);
      }
    };

    const handleVisibilityChange = (): void => {
      isVisibleRef.current = !document.hidden;

      if (isVisibleRef.current && animationFrameRef.current === null) {
        startTimeRef.current = performance.now();
        animationFrameRef.current = window.requestAnimationFrame(render);
      } else if (!isVisibleRef.current && animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (resourcesRef.current) {
        destroyWebGL(resourcesRef.current);
        resourcesRef.current = null;
      }
    };
  }, [mounted, theme]);

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[-1]" aria-hidden="true">
      <div className={`absolute inset-0 transition-colors duration-300 ${theme === 'light' ? 'bg-[#fafafa]' : 'bg-[#14141f]'}`} />
      {mounted ? <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full opacity-60" /> : null}
    </div>
  );
};

export default WebGLBackground;
