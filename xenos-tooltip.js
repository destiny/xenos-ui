/**
 * Xenos Tooltip
 * A lightweight Tooltip library for easy adoption
 */
(() => {
    const DEFAULT_OPTIONS = {
        useNative: true,
        styleId: 'xenos-tooltip-style',
        tooltipId: 'xenos-tooltip',
        contentClass: 'xenos-content',
        arrowClass: 'xenos-arrow',
        gap: 8,
        viewportPad: 4,
        minArrowPad: 12,
        arrowSize: 8,
        debug: false
    };

    class XenosTooltip {
        constructor(options = {}) {
            // init options
            this.options = {
                ...DEFAULT_OPTIONS, ...this.readFromCSS(), ...options
            }
            const supportsPopover = 'popover' in HTMLElement.prototype;
            const supportsAnchor = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && (CSS.supports('anchor-name: --a') || CSS.supports('position-anchor: --a') || CSS.supports('position-area: top') || CSS.supports('inset-area: top'));

            this.useNative = supportsPopover && supportsAnchor && this.options.useNative;
            this.init();
        }

        init() {
            // Init tooltip function
            this.currentTarget = null;
            this.injectStyle();
            this.createTooltip();
            this.bindEvents();
        }

        setDebugMode(debug) {
            this.options.debug = !!debug;
        }

        // create tooltip
        createTooltip() {
            if (document.getElementById(this.options.tooltipId)) {
                this.tooltipEl = document.getElementById(this.options.tooltipId);
                this.contentEl = this.tooltipEl.querySelector(`.${this.options.contentClass}`);
                this.arrowEl = this.tooltipEl.querySelector(`.${this.options.arrowClass}`);
                return;
            }
            this.tooltipEl = document.createElement('div');
            this.tooltipEl.id = this.options.tooltipId;

            this.updateModeClasses();

            this.contentEl = document.createElement('div');
            this.contentEl.classList.add(this.options.contentClass);

            this.arrowEl = document.createElement('div');
            this.arrowEl.classList.add(this.options.arrowClass);

            this.tooltipEl.appendChild(this.contentEl);
            this.tooltipEl.appendChild(this.arrowEl);
            document.body.appendChild(this.tooltipEl);
        }

        // update main class by operation mode
        updateModeClasses() {
            if (!this.tooltipEl) return;
            if (this.useNative) {
                this.tooltipEl.setAttribute('popover', 'manual');
                this.tooltipEl.classList.add('xenos-mode-native');
                this.tooltipEl.classList.remove('xenos-mode-fallback');
            } else {
                this.tooltipEl.removeAttribute('popover');
                this.tooltipEl.classList.add('xenos-mode-fallback');
                this.tooltipEl.classList.remove('xenos-mode-native');
            }
        }

        // load parameter from css
        readFromCSS() {
            const cssStyles = getComputedStyle(document.documentElement);
            const arrowSize = parseFloat(cssStyles
                .getPropertyValue('--xenos-tooltip-arrow-size')
                .trim());
            const gap = parseFloat(cssStyles
                .getPropertyValue('--xenos-tooltip-gap')
                .trim());
            const minArrowPad = parseFloat(cssStyles
                .getPropertyValue('--xenos-tooltip-min-arrow-pad')
                .trim());
            const viewportPad = parseFloat(cssStyles
                .getPropertyValue('--xenos-tooltip-viewport-pad')
                .trim());
            const params = {};
            if (!Number.isNaN(arrowSize)) {
                params.arrowSize = arrowSize;
            }
            if (!Number.isNaN(gap)) {
                params.gap = gap;
            }
            if (!Number.isNaN(minArrowPad)) {
                params.minArrowPad = minArrowPad;
            }
            if (!Number.isNaN(viewportPad)) {
                params.viewportPad = viewportPad;
            }
            return params;
        }

        // inject styles
        injectStyle() {
            if (document.getElementById(this.options.styleId)) return;
            const style = document.createElement('style');
            style.id = this.options.styleId;
            style.textContent = `
            #${this.options.tooltipId} {
                z-index: 9999;
                pointer-events: none;
                display: block;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.24s ease;
                font-size: 12px;
                overflow: visible;
            }
				
			#${this.options.tooltipId}.visible,
			#${this.options.tooltipId}:popover-open {
				opacity: 1;
				visibility: visible;
			}
			
			/* --- Fallback Mode Styles --- */
			#${this.options.tooltipId}.xenos-mode-fallback {
				position: fixed;
				left: 0;
				top: 0;
			}
			
			/* --- Native Mode Styles --- */
			#${this.options.tooltipId}.xenos-mode-native {
				position: fixed;
				inset: auto;
				border: none;
				padding: 0;
				background: transparent;
			}
			
			.xenos-content {
				background: var(--xenos-tooltip-background, #333);
				color: var(--xenos-tooltip-color, #fff);
				padding: var(--xenos-tooltip-padding, 6px 10px);
				border-radius: var(--xenos-tooltip-border-radius, 4px);
				max-width: var(--xenos-tooltip-max-width, 240px);
				width: max-content;
				min-width: min-content;
				white-space: pre-wrap;
			}
			
			.xenos-arrow {
			    z-index: -1;
			    width: var(--xenos-tooltip-arrow-size, ${this.options.arrowSize}px);
				height: var(--xenos-tooltip-arrow-size, ${this.options.arrowSize}px);
				position: absolute;
				background: var(--xenos-tooltip-background, #333);
				transform: rotate(45deg);
			}
			
			#${this.options.tooltipId}[data-placement="top"] .xenos-arrow {
				bottom: ${-this.options.arrowSize / 2}px;
				left: var(--arrow-offset, 50%);
				transform: translateX(-50%) rotate(45deg);
			}
			#${this.options.tooltipId}[data-placement="bottom"] .xenos-arrow {
				top: ${-this.options.arrowSize / 2}px;
				left: var(--arrow-offset, 50%);
				transform: translateX(-50%) rotate(45deg);
			}
			#${this.options.tooltipId}[data-placement="left"] .xenos-arrow {
				right: ${-this.options.arrowSize / 2}px;
				top: var(--arrow-offset, 50%);
				transform: translateY(-50%) rotate(45deg);
			}
			#${this.options.tooltipId}[data-placement="right"] .xenos-arrow {
				left: ${-this.options.arrowSize / 2}px;
				top: var(--arrow-offset, 50%);
				transform: translateY(-50%) rotate(45deg);
			}
            `;
            document.head.appendChild(style);
        }

        // bind event functions
        bindEvents() {
            this.onEnter = this.onEnter.bind(this);
            this.onLeave = this.onLeave.bind(this);
            this.onMove = this.onMove.bind(this);
            this.onViewportChange = this.onViewportChange.bind(this);

            document.addEventListener('mouseover', this.onEnter, true);
            document.addEventListener('mouseout', this.onLeave, true);
            document.addEventListener('mousemove', this.onMove, true);
            window.addEventListener('scroll', this.onViewportChange, true);
            window.addEventListener('resize', this.onViewportChange);
        }

        onEnter(e) {
            const target = e.target?.closest?.('[data-tooltip]');
            if (!target || target === this.currentTarget) return;
            this.currentTarget = target;
            this.show(target);
        }

        onLeave(e) {
            if (!this.currentTarget) return;
            if (!e.relatedTarget || !this.currentTarget.contains(e.relatedTarget)) {
                this.hide();
                this.currentTarget = null;
            }
        }

        onMove() {
            if (!this.currentTarget || this.useNative || !this.tooltipEl.classList.contains('visible')) return;
            this.showFallback(this.currentTarget);
        }

        onViewportChange() {
            if (!this.currentTarget) return;
            if (this.useNative) {
                this.updateArrowPosition(this.tooltipEl.dataset.placement || 'top');
            } else if (this.tooltipEl.classList.contains('visible')) {
                this.showFallback(this.currentTarget);
            }
        }

        // Visibility Control
        show(target) {
            const text = target.dataset.tooltip;
            if (!text) return;
            let targetPlacement = target.dataset.tooltipPlacement;
            if (!['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end'].includes(targetPlacement)) targetPlacement = undefined;
            // Set content FIRST so we can measure accurate size
            this.contentEl.textContent = text;
            if (this.useNative) {
                this.showNative(target, targetPlacement);
            } else {
                this.showFallback(target, targetPlacement);
            }
        }

        hide() {
            if (!this.tooltipEl) return;
            if (this.options.debug) return;
            this.tooltipEl.classList.remove('visible');
            this.tooltipEl.style.removeProperty('--arrow-offset');
            if (this.tooltipEl.hidePopover) {
                try {
                    this.tooltipEl.hidePopover();
                } catch {
                }
            }

            if (this.currentTarget) {
                this.currentTarget.style.removeProperty('anchor-name');
            }
        }

        // Show with Native Anchor
        showNative(target, targetPlacement) {
            this.tooltipEl.style.left = '';
            this.tooltipEl.style.top = '';
            this.tooltipEl.style.removeProperty('--arrow-offset');

            target.style.setProperty('anchor-name', '--xenos-anchor');
            this.tooltipEl.style.setProperty('position-anchor', '--xenos-anchor');

            this.tooltipEl.style.setProperty('position-area', 'top');
            this.tooltipEl.style.setProperty('margin', '9999px 0 0 0 ');
            this.tooltipEl.style.setProperty('visibility', 'hidden');

            try {
                this.tooltipEl.showPopover();
                requestAnimationFrame(() => {
                    if (!this.tooltipEl?.matches(':popover-open')) return;
                    const t = target.getBoundingClientRect();
                    const tip = this.tooltipEl.getBoundingClientRect();
                    const placement = (targetPlacement) ? targetPlacement : this.chooseBestPlacement(t, {
                        width: tip.width,
                        height: tip.height
                    });

                    this.applyNativePlacement(placement);
                    this.updateArrowPosition(placement);
                });
            } catch (e) {
                this.showFallback(target);
            }
        }

        applyNativePlacement(placement) {
            const placementMap = {
                'top': {area: 'top span-all', margin: `0 0 ${this.options.gap}px 0`},
                'top-start': {area: 'top left', margin: `${this.options.gap}px`, offset: '50% 0'},
                'top-end': {area: 'top right', margin: `${this.options.gap}px`, offset: '-50% 0'},
                'right': {area: 'span-all right', margin: `0 0 0 ${this.options.gap}px`},
                'left': {area: 'span-all left', margin: `0 ${this.options.gap}px 0 0`},
                'bottom': {area: 'bottom span-all', margin: `${this.options.gap}px 0 0 0`},
                'bottom-start': {area: 'bottom left', margin: `${this.options.gap}px`, offset: '50% 0'},
                'bottom-end': {area: 'bottom right', margin: `${this.options.gap}px`, offset: '-50% 0'},
            }
            const config = placementMap[placement];
            this.tooltipEl.style.setProperty('position-area', config.area);
            this.tooltipEl.style.setProperty('margin', config.margin);
            this.tooltipEl.style.setProperty('translate', config.offset ? config.offset : '0');
            this.tooltipEl.style.removeProperty('visibility');
        }

        // Fallback mode
        showFallback(target, targetPlacement) {
            this.tooltipEl.classList.add('visible');

            const t = target.getBoundingClientRect();
            const tip = this.tooltipEl.getBoundingClientRect();

            const placement = (targetPlacement) ? targetPlacement : this.chooseBestPlacement(t, {
                width: tip.width,
                height: tip.height
            }).split('-')[0];
            const pos = this.computePosition(placement, t, {width: tip.width, height: tip.height});
            const clamped = this.clampToViewport(pos, {width: tip.width, height: tip.height});

            this.tooltipEl.style.left = `${clamped.x}px`;
            this.tooltipEl.style.top = `${clamped.y}px`;
            this.updateArrowPosition(placement);
        }

        updateArrowPosition(placement) {
            const baseSide = placement.split('-')[0];
            this.tooltipEl.dataset.placement = baseSide;

            const tip = this.tooltipEl.getBoundingClientRect();
            const t = this.currentTarget.getBoundingClientRect();
            const isVertical = baseSide === 'top' || baseSide === 'bottom';

            const targetCenter = isVertical ? t.left + t.width / 2 : t.top + t.height / 2;
            const tipStart = isVertical ? tip.left : tip.top;
            const tipSize = isVertical ? tip.width : tip.height;

            const offset = Math.max(this.options.minArrowPad, Math.min(tipSize - this.options.minArrowPad, targetCenter - tipStart));
            this.tooltipEl.style.setProperty('--arrow-offset', `${offset}px`);
        }

        getTooltipCenter(placement, t, tip) {
            const gap = this.options.gap;
            const centerX = t.left + t.width / 2;
            const centerY = t.top + t.height / 2;
            const positions = {
                'top': [centerX, t.top - gap - tip.height / 2],
                'bottom': [centerX, t.bottom + gap + tip.height / 2],
                'left': [t.left - gap - tip.width / 2, centerY],
                'right': [t.right + gap + tip.width / 2, centerY],
                'top-start': [t.left - gap - tip.width / 2, t.top - gap - tip.height / 2],
                'top-end': [t.right + gap + tip.width / 2, t.top - gap - tip.height / 2],
                'bottom-start': [t.left - gap - tip.width / 2, t.bottom + gap + tip.height / 2],
                'bottom-end': [t.right + gap + tip.width / 2, t.bottom + gap + tip.height / 2]
            };
            const [tipCenterX, tipCenterY] = positions[placement] || positions['top'];
            return {tipCenterX, tipCenterY};
        }

        chooseBestPlacement(t, tip) {
            const pad = this.options.viewportPad;
            const vw = innerWidth;
            const vh = innerHeight;

            const getOverflow = (placement) => {
                const {tipCenterX, tipCenterY} = this.getTooltipCenter(placement, t, tip);

                const tipLeft = tipCenterX - tip.width / 2;
                const tipRight = tipCenterX + tip.width / 2;
                const tipTop = tipCenterY - tip.height / 2;
                const tipBottom = tipCenterY + tip.height / 2;

                const overflow = {
                    top: Math.max(0, pad - tipTop),
                    bottom: Math.max(0, tipBottom - (vh - pad)),
                    left: Math.max(0, pad - tipLeft),
                    right: Math.max(0, tipRight - (vw - pad))
                };

                const total = overflow.top + overflow.bottom + overflow.left + overflow.right;
                return {total, overflow, tipCenterX, tipCenterY, tipLeft, tipTop};
            };

            const placements = [
                'top',
                'top-start',
                'top-end',
                'left',
                'right',
                'bottom-start',
                'bottom-end',
                'bottom'
            ];

            const results = placements.map((p, index) => ({
                name: p,
                priority: index,
                ...getOverflow(p)
            }));

            const perfect = results.find(r => r.total === 0);
            if (perfect) {
                return perfect.name;
            }

            results.sort((a, b) => {
                if (a.total !== b.total) return a.total - b.total;
                return a.priority - b.priority;
            });
            return results[0].name;
        }

        computePosition(placement, t, tip) {
            const {tipCenterX, tipCenterY} = this.getTooltipCenter(placement, t, tip);
            return {x: tipCenterX - tip.width / 2, y: tipCenterY - tip.height / 2};
        }

        clampToViewport(pos, tip) {
            const pad = this.options.viewportPad;
            return {
                x: Math.max(pad, Math.min(pos.x, innerWidth - tip.width - pad)),
                y: Math.max(pad, Math.min(pos.y, innerHeight - tip.height - pad))
            };
        }

    }

    function autoInit() {
        const globalConfig = window.XenosTooltipConfig || {};
        window.XenosTooltipApi = new XenosTooltip(globalConfig);
    }

    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', autoInit) : autoInit();

    window.XenosTooltip = XenosTooltip;
})();