import { useEffect, useRef } from "react";

type Props = {
    size?: number;
    maxDepth?: number;
    className?: string;
};

function carve(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    depth: number
) {
    if (depth <= 0) return;

    const n = size / 3;

    ctx.fillRect(x + n, y + n, n, n);


    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (i === 1 && j === 1) continue;
            carve(ctx, x + i * n, y + j * n, n, depth - 1);
        }
    }
}

export function SierpinskiLogo({ size = 92, maxDepth = 5, className }: Props) {
    const ref = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;

        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.scale(dpr, dpr);

        let raf = 0;
        const start = performance.now();

        const render = (t: number) => {
            const time = (t - start) / 1000;

            const wave = (Math.sin(time * 1.15) + 1) / 2; // 0..1
            const depth = Math.max(1, Math.min(maxDepth, Math.round(1 + wave * (maxDepth - 1))));

            const s = 0.92 + 0.06 * Math.sin(time * 1.9);

            ctx.clearRect(0, 0, size, size);

            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, size, size);


            const pad = (1 - s) * size / 2;
            const innerSize = size * s;

            ctx.fillStyle = "#fff";
            carve(ctx, pad, pad, innerSize, depth);

            raf = requestAnimationFrame(render);
        };

        raf = requestAnimationFrame(render);
        return () => cancelAnimationFrame(raf);
    }, [size, maxDepth]);

    return <canvas ref={ref} className={className} />;
}
