/* Decorative cursor lens. No analytics or transmission of click counts. */
(() => {
    'use strict';
    const LENS_SIZE = 190; // Diameter in pixels; try 150 for a smaller lens.
    const COUNTER_KEY = 'vaibhav-cursor-clicks-v1';
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    function init() {
        if (document.querySelector('.cyber-cursor-ui')) return;
        const ui = document.createElement('div');
        ui.className = 'cyber-cursor-ui';
        ui.setAttribute('aria-hidden', 'true');
        ui.hidden = true;
        const lens = document.createElement('div');
        lens.className = 'cyber-lens';
        lens.style.width = lens.style.height = LENS_SIZE + 'px';
        const ns = 'http://www.w3.org/2000/svg';
        const words = document.createElementNS(ns, 'svg');
        words.setAttribute('viewBox', `0 0 ${LENS_SIZE} ${LENS_SIZE}`);
        words.setAttribute('focusable', 'false');
        lens.append(words);
        const badge = document.createElement('div');
        badge.className = 'cyber-click-count';
        const ripple = document.createElement('div');
        ripple.className = 'cyber-click-ripple';
        ui.append(lens, ripple, badge);
        document.body.append(ui);

        let count = 0;
        try {
            const saved = Number(sessionStorage.getItem(COUNTER_KEY));
            if (Number.isSafeInteger(saved) && saved >= 0) count = saved;
        } catch (_) { /* Works in memory when storage is unavailable. */ }
        const label = () => { badge.textContent = `${count} ${count === 1 ? 'click' : 'clicks'}`; };
        label();

        let x = -1000, y = -1000, present = false, paused = false;
        let frame = 0, dirty = true, records = [], pulse;
        const excluded = 'script, style, noscript, svg, canvas, iframe, input, textarea, select, [contenteditable], [hidden], [aria-hidden="true"], .cyber-cursor-ui';
        const radius = LENS_SIZE / 2;

        // Measure visible text only after layout changes, never on every mousemove.
        function measureWords() {
            records = [];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                acceptNode(node) {
                    const p = node.parentElement;
                    return node.textContent.trim() && p && !p.closest(excluded)
                        ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
                }
            });
            const range = document.createRange();
            let node;
            while ((node = walker.nextNode())) {
                const parent = node.parentElement;
                const box = parent.getBoundingClientRect();
                if (box.bottom < 0 || box.top > innerHeight || box.right < 0 || box.left > innerWidth) continue;
                const style = getComputedStyle(parent);
                if (style.visibility !== 'visible' || style.display === 'none' || Number(style.opacity) === 0) continue;
                const size = parseFloat(style.fontSize);
                for (const match of node.textContent.matchAll(/\S+/gu)) {
                    range.setStart(node, match.index);
                    range.setEnd(node, match.index + match[0].length);
                    // A normally wrapped word occupies one box. Leave split words unchanged.
                    const rects = Array.from(range.getClientRects()).filter(r => r.width > 0 && r.height > 0);
                    if (rects.length !== 1) continue;
                    const rect = rects[0];
                    if (rect.bottom < 0 || rect.top > innerHeight) continue;
                    let text = match[0];
                    if (style.textTransform === 'uppercase') text = text.toUpperCase();
                    else if (style.textTransform === 'lowercase') text = text.toLowerCase();
                    records.push({parent, text, rect, size, weight: parseInt(style.fontWeight, 10) >= 600 ? '700' : '500'});
                }
            }
            dirty = false;
        }

        function schedule() { if (!frame && present && !paused) frame = requestAnimationFrame(draw); }
        function invalidate() { dirty = true; schedule(); }
        function hide() { present = false; ui.hidden = true; }

        function draw() {
            frame = 0;
            if (!present || paused || !finePointer.matches) { ui.hidden = true; return; }
            if (dirty) measureWords();
            ui.hidden = false;
            const left = x - radius, top = y - radius;
            lens.style.transform = `translate3d(${left}px, ${top}px, 0)`;
            const bx = Math.max(8, Math.min(x + 18, innerWidth - badge.offsetWidth - 8));
            const by = Math.max(8, Math.min(y + 23, innerHeight - badge.offsetHeight - 8));
            badge.style.transform = `translate3d(${bx}px, ${by}px, 0)`;
            const fragment = document.createDocumentFragment();
            for (const item of records) {
                const {rect, parent, text, size, weight} = item;
                const dx = x - Math.max(rect.left, Math.min(x, rect.right));
                const dy = y - Math.max(rect.top, Math.min(y, rect.bottom));
                if (dx * dx + dy * dy > radius * radius) continue;
                // Skip text behind sticky navigation, closed accordions, or other layers.
                const hit = document.elementFromPoint(
                    Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2)),
                    Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2))
                );
                if (!hit || !parent.contains(hit)) continue;
                const backing = document.createElementNS(ns, 'rect');
                backing.setAttribute('x', rect.left - left - 1);
                backing.setAttribute('y', rect.top - top);
                backing.setAttribute('width', rect.width + 2);
                backing.setAttribute('height', rect.height);
                backing.setAttribute('rx', '2');
                backing.setAttribute('fill', '#070d20');
                const glyph = document.createElementNS(ns, 'text');
                glyph.textContent = text;
                glyph.setAttribute('x', rect.left - left);
                glyph.setAttribute('y', rect.top - top + rect.height * .79);
                glyph.setAttribute('font-size', size);
                glyph.setAttribute('font-weight', weight);
                glyph.setAttribute('textLength', rect.width);
                glyph.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                fragment.append(backing, glyph);
            }
            words.replaceChildren(fragment);
        }

        document.addEventListener('pointermove', event => {
            if (event.pointerType !== 'mouse' || !finePointer.matches || paused) { hide(); return; }
            x = event.clientX; y = event.clientY; present = true;
            schedule();
        }, {passive: true});

        // Capture clicks before links navigate away, without blocking their action.
        document.addEventListener('click', event => {
            if (!finePointer.matches || event.detail === 0 || (event.pointerType && event.pointerType !== 'mouse')) return;
            if (count < Number.MAX_SAFE_INTEGER) count += 1;
            try { sessionStorage.setItem(COUNTER_KEY, String(count)); } catch (_) {}
            label();
            x = event.clientX; y = event.clientY; present = true;
            invalidate();
            if (!paused && !reducedMotion.matches && ripple.animate) {
                if (pulse) pulse.cancel();
                ripple.style.left = (x - 12) + 'px';
                ripple.style.top = (y - 12) + 'px';
                pulse = ripple.animate([
                    {transform: 'scale(.6)', opacity: .9},
                    {transform: 'scale(3.4)', opacity: 0}
                ], {duration: 360, easing: 'ease-out'});
            }
        }, {capture: true, passive: true});

        document.addEventListener('pointerout', event => { if (!event.relatedTarget) hide(); });
        document.addEventListener('pointerover', event => {
            if (event.target instanceof Element && event.target.closest('iframe, embed, object')) hide();
        });
        addEventListener('blur', hide);
        document.addEventListener('visibilitychange', () => { if (document.hidden) hide(); });
        addEventListener('scroll', invalidate, {capture: true, passive: true});
        addEventListener('resize', invalidate, {passive: true});
        document.addEventListener('load', invalidate, true);
        document.addEventListener('transitionend', invalidate, true);
        document.addEventListener('animationend', invalidate, true);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') { paused = !paused; ui.hidden = true; if (!paused) schedule(); }
        });
        finePointer.addEventListener('change', () => { if (!finePointer.matches) hide(); else invalidate(); });
        if (document.fonts) document.fonts.ready.then(invalidate);
        const observer = new MutationObserver(changes => {
            if (changes.some(change => !ui.contains(change.target))) invalidate();
        });
        observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open']});
        observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
    else init();
})();
