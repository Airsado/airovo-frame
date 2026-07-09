<script setup lang="ts">
/**
 * @airovo/design Demo — "Airovo Atlas"
 *
 * A bespoke design-system showcase: brand/accent/surface ramps, semantic
 * swatches, a type scale, foundational primitives (radius, shadow,
 * gradient), and the feature pillar grid. Every visual is driven by the
 * exported `tokens`, so the page doubles as a live token reference.
 *
 * Rendered inside BasicLayout's ScrollArea, so it owns no page height or
 * scroll — it just flows and lets the layout scroll.
 */
import { tokens } from './tokens'
import { Icon } from '@iconify/vue'

defineOptions({ name: 'AirovoDesignDemo' })

const brandRamp = Object.entries(tokens.brand).map(([stop, value]) => ({ stop, value }))
const accentRamp = Object.entries(tokens.accent).map(([stop, value]) => ({ stop, value }))
const surfaceRamp = Object.entries(tokens.surface).map(([stop, value]) => ({ stop, value }))
const semantic = Object.entries(tokens.semantic).map(([name, value]) => ({ name, value }))
const gradients = Object.entries(tokens.gradient).map(([name, value]) => ({ name, value }))

const radii = (['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const).map((k) => ({
    stop: k,
    value: tokens.radius[k],
}))
const shadows = (['xs', 'sm', 'md', 'lg', 'xl'] as const).map((k) => ({
    stop: k,
    value: tokens.shadow[k],
}))

const radius2xl = tokens.radius['2xl']

const typeScale = [
    { label: 'Display', text: '设计即语言', size: '40px', weight: 800 },
    { label: 'H1', text: '一致胜过偶然', size: '30px', weight: 700 },
    { label: 'H2', text: '克制带来精致', size: '22px', weight: 600 },
    { label: 'Body', text: '每一处间距、圆角与阴影都来自同一套令牌。', size: '15px', weight: 400 },
    { label: 'Caption', text: 'Airovo Design Tokens · v0.1.0', size: '12px', weight: 500 },
]

const features = [
    { icon: 'lucide:zap', title: '开箱即快', desc: 'Vite HMR、按需分包与摇树优化内建,首屏即终态。' },
    { icon: 'lucide:shield-check', title: '端到端类型安全', desc: 'core / stores / forms 全链路严格 TS,无 any 泄漏。' },
    { icon: 'lucide:layers', title: '可组合包', desc: 'core / ui-kit / effects / app-ui,按需采纳单点能力。' },
    { icon: 'lucide:palette', title: '令牌驱动', desc: '色彩、字号、圆角、阴影统一出自 tokens,换肤零成本。' },
]

const gradientLabel: Record<string, string> = {
    brand: '品牌',
    accent: '强调',
    sunset: '日落',
    forest: '森林',
    hero: '主视觉',
}
</script>

<template>
    <div class="atlas">
        <div class="atlas-inner">
            <!-- Hero -->
            <header class="hero">
                <div class="hero-grid" />
                <div class="hero-glow hero-glow--a" />
                <div class="hero-glow hero-glow--b" />
                <div class="hero-inner">
                    <span class="pill">
                        <Icon icon="lucide:sparkles" class="size-3" />
                        v0.1.0 · design tokens
                    </span>
                    <h1 class="hero-title">
                        airovo-frame
                        <span class="hero-title__grad">设计系统</span>
                    </h1>
                    <p class="hero-lead">
                        一套令牌、一套语义、一套节奏 —— 让应用看起来是被设计出来的,而非拼装出来的。
                    </p>
                    <div class="hero-cta">
                        <button class="btn btn--primary">
                            <Icon icon="lucide:rocket" class="size-4" />
                            快速开始
                        </button>
                        <button class="btn btn--ghost">
                            <Icon icon="lucide:github" class="size-4" />
                            查看源码
                        </button>
                    </div>
                </div>
            </header>

            <!-- Color tokens -->
            <section class="block">
                <header class="block-head">
                    <h2>色彩</h2>
                    <p>品牌与强调色各 10 级渐变,语义色与中性面各成体系。悬停色块可查看 hex。</p>
                </header>

                <div class="ramp-group">
                    <div class="ramp-label">Brand</div>
                    <div class="ramp">
                        <div v-for="s in brandRamp" :key="s.stop" class="ramp-stop">
                            <div class="ramp-chip" :style="{ background: s.value }">
                                <span class="ramp-hex">{{ s.value }}</span>
                            </div>
                            <span class="ramp-key">{{ s.stop }}</span>
                        </div>
                    </div>
                </div>

                <div class="ramp-group">
                    <div class="ramp-label">Accent</div>
                    <div class="ramp">
                        <div v-for="s in accentRamp" :key="s.stop" class="ramp-stop">
                            <div class="ramp-chip" :style="{ background: s.value }">
                                <span class="ramp-hex">{{ s.value }}</span>
                            </div>
                            <span class="ramp-key">{{ s.stop }}</span>
                        </div>
                    </div>
                </div>

                <div class="ramp-group">
                    <div class="ramp-label">语义 · Semantic</div>
                    <div class="swatches">
                        <div v-for="s in semantic" :key="s.name" class="swatch">
                            <div class="swatch-chip" :style="{ background: s.value }">
                                <Icon icon="lucide:droplet" class="size-4" />
                            </div>
                            <div class="swatch-meta">
                                <span class="swatch-name">{{ s.name }}</span>
                                <code class="swatch-value">{{ s.value }}</code>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="ramp-group">
                    <div class="ramp-label">中性面 · Surface</div>
                    <div class="ramp ramp--surface">
                        <div v-for="s in surfaceRamp" :key="s.stop" class="ramp-stop">
                            <div class="ramp-chip ramp-chip--sm" :style="{ background: s.value }">
                                <span class="ramp-hex">{{ s.value }}</span>
                            </div>
                            <span class="ramp-key">{{ s.stop }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Typography -->
            <section class="block">
                <header class="block-head">
                    <h2>字体</h2>
                    <p>sans 与 mono 两族字型,配合 5 级类型尺度。</p>
                </header>
                <div class="type-families">
                    <div class="type-family">
                        <span class="type-family__tag">sans</span>
                        <span class="type-family__name" :style="{ fontFamily: tokens.font.sans }">Inter</span>
                    </div>
                    <div class="type-family">
                        <span class="type-family__tag">mono</span>
                        <span class="type-family__name" :style="{ fontFamily: tokens.font.mono }">JetBrains Mono</span>
                    </div>
                </div>
                <div class="type-scale">
                    <div v-for="t in typeScale" :key="t.label" class="type-row">
                        <span class="type-row__label">{{ t.label }}</span>
                        <span
                            class="type-row__sample"
                            :style="{ fontSize: t.size, fontWeight: t.weight, fontFamily: tokens.font.sans }"
                        >{{ t.text }}</span>
                    </div>
                </div>
            </section>

            <!-- Foundations: radius / shadow / gradient -->
            <section class="block">
                <header class="block-head">
                    <h2>基础原语</h2>
                    <p>圆角、阴影与渐变 —— 视觉节奏的最小单元。</p>
                </header>
                <div class="found">
                    <div class="found-group">
                        <span class="found-group__label">Radius</span>
                        <div class="radii">
                            <div v-for="r in radii" :key="r.stop" class="radii-item">
                                <div class="radii-box" :style="{ borderRadius: r.value }" />
                                <span class="radii-name">{{ r.stop }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="found-group">
                        <span class="found-group__label">Shadow</span>
                        <div class="shadows">
                            <div v-for="sh in shadows" :key="sh.stop" class="shadows-item">
                                <div class="shadows-box" :style="{ boxShadow: sh.value }" />
                                <span class="shadows-name">{{ sh.stop }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="found-group">
                        <span class="found-group__label">Gradient</span>
                        <div class="gradients">
                            <div
                                v-for="g in gradients"
                                :key="g.name"
                                class="gradient-card"
                                :style="{ background: g.value }"
                            >
                                <span class="gradient-name">{{ gradientLabel[g.name] ?? g.name }}</span>
                                <code class="gradient-value">{{ g.name }}</code>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Feature pillars -->
            <section class="block">
                <header class="block-head">
                    <h2>特性支柱</h2>
                    <p>脚手架一个 airovo 应用时,你将获得的能力。</p>
                </header>
                <div class="features">
                    <article v-for="f in features" :key="f.title" class="feature">
                        <div class="feature-icon">
                            <Icon :icon="f.icon" />
                        </div>
                        <h3 class="feature-title">{{ f.title }}</h3>
                        <p class="feature-desc">{{ f.desc }}</p>
                    </article>
                </div>
            </section>

            <footer class="atlas-foot">
                <span>© 2026 airovo-frame · design system</span>
                <span class="atlas-foot__tag">build {{ tokens.brand[500] }}</span>
            </footer>
        </div>
    </div>
</template>

<style scoped>
.atlas {
    --font-sans: v-bind('tokens.font.sans');
    --font-mono: v-bind('tokens.font.mono');
    --brand-50: v-bind('tokens.brand[50]');
    --brand-500: v-bind('tokens.brand[500]');
    --brand-600: v-bind('tokens.brand[600]');
    --brand-700: v-bind('tokens.brand[700]');
    --accent-400: v-bind('tokens.accent[400]');
    --surface-0: v-bind('tokens.surface[0]');
    --surface-50: v-bind('tokens.surface[50]');
    --surface-100: v-bind('tokens.surface[100]');
    --surface-200: v-bind('tokens.surface[200]');
    --surface-500: v-bind('tokens.surface[500]');
    --surface-600: v-bind('tokens.surface[600]');
    --surface-900: v-bind('tokens.surface[900]');
    --shadow-lg: v-bind('tokens.shadow.lg');
    --shadow-xl: v-bind('tokens.shadow.xl');
    --radius-2xl: v-bind('radius2xl');

    font-family: var(--font-sans);
    color: var(--surface-900);
    /* Always render on a light canvas: tokens are static (light-mode),
       so pin the page background instead of inheriting the app theme. */
    background: linear-gradient(180deg, var(--surface-0), var(--surface-50));
    padding: 32px 20px 56px;
}
.atlas-inner {
    max-width: 1040px;
    margin: 0 auto;
}

/* Hero */
.hero {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-2xl);
    border: 1px solid var(--surface-200);
    background: linear-gradient(135deg, var(--brand-700) 0%, var(--brand-500) 55%, #0e7490 100%);
    color: #fff;
    padding: 56px 32px;
    text-align: center;
    box-shadow: var(--shadow-xl);
}
.hero-grid {
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 28px 28px;
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 75%);
    mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 30%, transparent 75%);
    pointer-events: none;
}
.hero-glow {
    position: absolute;
    border-radius: 9999px;
    filter: blur(60px);
    opacity: 0.4;
    pointer-events: none;
}
.hero-glow--a {
    width: 280px;
    height: 280px;
    left: -60px;
    top: -80px;
    background: var(--accent-400);
}
.hero-glow--b {
    width: 320px;
    height: 320px;
    right: -80px;
    bottom: -120px;
    background: #ec4899;
}
.hero-inner {
    position: relative;
    z-index: 1;
    max-width: 640px;
    margin: 0 auto;
}
.pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.24);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.01em;
    margin-bottom: 22px;
}
.hero-title {
    font-size: 46px;
    line-height: 1.08;
    font-weight: 800;
    letter-spacing: -0.025em;
    margin: 0 0 16px;
}
.hero-title__grad {
    display: block;
    background: linear-gradient(135deg, #67e8f9 0%, #a5f3fc 50%, #fff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}
.hero-lead {
    font-size: 17px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.86);
    margin: 0 auto 28px;
    max-width: 520px;
}
.hero-cta {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
}
.btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    font-family: var(--font-sans);
    cursor: pointer;
    border: 1px solid transparent;
    transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.btn--primary {
    background: #fff;
    color: var(--brand-700);
    box-shadow: 0 6px 20px -8px rgba(0, 0, 0, 0.4);
}
.btn--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.5);
}
.btn--ghost {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.28);
}
.btn--ghost:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-1px);
}

/* Sections */
.block {
    margin-top: 56px;
}
.block-head {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.block-head h2 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.01em;
    margin: 0;
}
.block-head p {
    margin: 0;
    font-size: 14px;
    color: var(--surface-500);
}

/* Color ramps */
.ramp-group {
    margin-bottom: 22px;
}
.ramp-label {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--surface-600);
    margin-bottom: 8px;
    letter-spacing: 0.02em;
}
.ramp {
    display: flex;
    border: 1px solid var(--surface-200);
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
}
.ramp-stop {
    flex: 1 1 0;
    min-width: 0;
}
.ramp-chip {
    height: 56px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}
.ramp-chip--sm {
    height: 36px;
}
.ramp-hex {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    padding: 2px 6px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
}
.ramp-stop:hover .ramp-hex {
    opacity: 1;
}
.ramp-key {
    display: block;
    text-align: center;
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--surface-500);
    padding: 5px 0 6px;
    border-top: 1px solid var(--surface-100);
}
/* Light surface stops need an inset edge to stay visible against white. */
.ramp--surface .ramp-chip {
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}

/* Semantic swatches */
.swatches {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
}
.swatch {
    border: 1px solid var(--surface-200);
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.swatch:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}
.swatch-chip {
    aspect-ratio: 16 / 10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.9);
}
.swatch-meta {
    padding: 8px 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 1px;
}
.swatch-name {
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
}
.swatch-value {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--surface-500);
}

/* Typography */
.type-families {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}
.type-family {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 10px 16px;
    border: 1px solid var(--surface-200);
    border-radius: 12px;
    background: #fff;
}
.type-family__tag {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--surface-500);
    text-transform: uppercase;
}
.type-family__name {
    font-size: 16px;
    font-weight: 600;
}
.type-scale {
    border: 1px solid var(--surface-200);
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
}
.type-row {
    display: flex;
    align-items: baseline;
    gap: 20px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--surface-100);
}
.type-row:last-child {
    border-bottom: none;
}
.type-row__label {
    flex: 0 0 88px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--surface-500);
    text-transform: uppercase;
}
.type-row__sample {
    color: var(--surface-900);
    line-height: 1.3;
}

/* Foundations */
.found {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.found-group {
    padding: 18px;
    border: 1px solid var(--surface-200);
    border-radius: 12px;
    background: var(--surface-50);
}
.found-group__label {
    display: block;
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--surface-600);
    margin-bottom: 14px;
}
.radii,
.shadows {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}
.radii-item,
.shadows-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}
.radii-box {
    width: 56px;
    height: 56px;
    background: var(--brand-50);
    border: 1px solid var(--brand-500);
}
.radii-name,
.shadows-name {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--surface-500);
}
.shadows-box {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid var(--surface-100);
}
.gradients {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
}
.gradient-card {
    border-radius: 12px;
    padding: 16px 18px;
    min-height: 84px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    color: #fff;
    box-shadow: var(--shadow-lg);
}
.gradient-name {
    font-size: 15px;
    font-weight: 600;
}
.gradient-value {
    font-family: var(--font-mono);
    font-size: 11px;
    color: rgba(255, 255, 255, 0.82);
    align-self: flex-start;
}

/* Feature pillars */
.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
}
.feature {
    position: relative;
    padding: 22px;
    border-radius: 16px;
    border: 1px solid var(--surface-200);
    background: #fff;
    overflow: hidden;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.feature::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--brand-50), transparent 60%);
    opacity: 0;
    transition: opacity 0.18s ease;
}
.feature:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-lg);
    border-color: var(--brand-500);
}
.feature:hover::before {
    opacity: 1;
}
.feature-icon {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 14px;
    font-size: 20px;
    color: #fff;
    background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
    box-shadow: 0 6px 16px -6px var(--brand-500);
}
.feature-title {
    position: relative;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 6px;
}
.feature-desc {
    position: relative;
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--surface-500);
    margin: 0;
}

/* Footer */
.atlas-foot {
    margin-top: 56px;
    padding-top: 24px;
    border-top: 1px solid var(--surface-200);
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 13px;
    color: var(--surface-500);
}
.atlas-foot__tag {
    font-family: var(--font-mono);
    color: var(--brand-600);
}

@media (max-width: 640px) {
    .hero {
        padding: 40px 20px;
    }
    .hero-title {
        font-size: 34px;
    }
    .type-row {
        flex-direction: column;
        gap: 4px;
    }
    .type-row__label {
        flex-basis: auto;
    }
}
</style>
