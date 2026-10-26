/* Decorative cursor lens. No analytics or transmission of click counts. */
(() => {
    'use strict';
    const LENS_SIZE = 190; // Diameter in pixels; try 150 for a smaller lens.
    const COUNTER_KEY = 'vaibhav-cursor-clicks-v1';
    const TOUCH_KEY = 'vaibhav-cursor-touches-v1';
    const INPUT_KEY = 'vaibhav-cursor-input-v1';
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

        // Touch gets its own lightweight overlay, never the desktop text lens.
        const touchUI = document.createElement('div');
        touchUI.className = 'cyber-touch-ui';
        touchUI.setAttribute('aria-hidden', 'true');
        touchUI.hidden = true;
        const fingerprint = document.createElement('div');
        fingerprint.className = 'cyber-fingerprint';
        const printSvg = document.createElementNS(ns, 'svg');
        printSvg.setAttribute('viewBox', '0 0 48 48');
        printSvg.setAttribute('focusable', 'false');
        // A decorative drawing, not a captured fingerprint.
        [
            'M8 23C8 13 15 6 24 6s16 7 16 17',
            'M5 30c0-3 0-6 1-9M42 29c0 5-1 9-3 13',
            'M12 30v-7c0-7 5-12 12-12s12 5 12 12v5c0 6-1 11-4 15',
            'M10 35c0 4-1 6-3 9',
            'M16 34c1-4 1-7 1-11a7 7 0 0 1 14 0c0 8 0 14-5 21',
            'M14 40l-2 4M22 24c0-3 4-3 4 0 0 9-1 15-6 20',
            'M21 30c0 6-1 10-4 14'
        ].forEach(d => {
            const path = document.createElementNS(ns, 'path');
            path.setAttribute('d', d);
            printSvg.append(path);
        });
        fingerprint.append(printSvg);
        const touchBadge = document.createElement('div');
        touchBadge.className = 'cyber-click-count cyber-touch-count';
        const trails = document.createElement('div');
        trails.className = 'cyber-touch-trails';
        touchUI.append(trails, fingerprint, touchBadge);
        document.body.append(touchUI);

        let touchCount = 0, tx = 0, ty = 0, hasTouch = false, inputMode = 'mouse';
        let gesture = null, lastTouchTime = -Infinity, lastTrailTime = -Infinity;
        let touchFrame = 0, pendingTrail = null, lastScrollY = scrollY;
        const now = () => performance.now();
        try {
            inputMode = sessionStorage.getItem(INPUT_KEY) === 'touch' ? 'touch' : 'mouse';
            const saved = JSON.parse(sessionStorage.getItem(TOUCH_KEY));
            if (saved && Number.isSafeInteger(saved.count) && saved.count >= 0 && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
                touchCount = saved.count; tx = saved.x; ty = saved.y; hasTouch = true;
            }
        } catch (_) {}

        function setInputMode(mode) {
            if (inputMode !== mode) {
                inputMode = mode;
                try { sessionStorage.setItem(INPUT_KEY, mode); } catch (_) {}
            }
        }
        function saveTouch() {
            try { sessionStorage.setItem(TOUCH_KEY, JSON.stringify({count: touchCount, x: tx, y: ty})); } catch (_) {}
        }
        function placeTouch() {
            touchFrame = 0;
            if (inputMode !== 'touch' || !hasTouch || paused || document.hidden) { touchUI.hidden = true; pendingTrail = null; return; }
            touchUI.hidden = false;
            const px = Math.max(23, Math.min(tx, innerWidth - 23));
            const py = Math.max(23, Math.min(ty, innerHeight - 23));
            fingerprint.style.transform = `translate3d(${px - 23}px, ${py - 23}px, 0)`;
            touchBadge.textContent = `${touchCount} ${touchCount === 1 ? 'touch' : 'touches'}`;
            touchBadge.style.transform = `translate3d(${Math.max(8, Math.min(px + 28, innerWidth - touchBadge.offsetWidth - 8))}px, ${Math.max(8, Math.min(py + 28, innerHeight - touchBadge.offsetHeight - 8))}px, 0)`;
            if (pendingTrail && !reducedMotion.matches) addTrail(pendingTrail);
            pendingTrail = null;
        }
        function queueTouch() { if (!touchFrame) touchFrame = requestAnimationFrame(placeTouch); }
        function addTrail(point) {
            if (now() - lastTrailTime < 55) return;
            lastTrailTime = now();
            const line = document.createElement('span');
            line.className = 'cyber-touch-trail';
            const length = Math.max(12, Math.min(52, Math.hypot(point.dx, point.dy)));
            const angle = Math.atan2(point.dy, point.dx) * 180 / Math.PI - 90;
            line.style.left = point.x + 'px';
            line.style.top = point.y + 'px';
            line.style.height = length + 'px';
            line.style.transform = `translate(-50%, -100%) rotate(${angle}deg)`;
            trails.append(line);
            while (trails.childElementCount > 8) trails.firstElementChild.remove();
            if (line.animate) {
                const fade = line.animate([{opacity: .24}, {opacity: 0}], {duration: 550, easing: 'ease-out'});
                fade.onfinish = () => line.remove();
            }
            setTimeout(() => line.remove(), 650);
        }
        function beginTouch(id, px, py) {
            hide();
            setInputMode('touch');
            lastTouchTime = now();
            tx = px; ty = py; hasTouch = true;
            gesture = {id, x: px, y: py, startX: px, startY: py, multi: false};
            if (touchCount < Number.MAX_SAFE_INTEGER) touchCount += 1;
            saveTouch(); // Capture before a tapped link navigates.
            queueTouch();
        }
        function moveTouch(px, py) {
            if (!gesture || gesture.multi) return;
            const dx = px - gesture.x, dy = py - gesture.y;
            tx = px; ty = py; lastTouchTime = now();
            if (Math.hypot(px - gesture.startX, py - gesture.startY) > 8) pendingTrail = {x: px, y: py, dx, dy};
            gesture.x = px; gesture.y = py;
            queueTouch();
        }
        function finishTouch(px, py) {
            if (gesture && !gesture.multi && Number.isFinite(px) && Number.isFinite(py)) { tx = px; ty = py; }
            gesture = null;
            lastTouchTime = now();
            saveTouch();
            queueTouch(); // Leave the fingerprint visible after release or cancellation.
        }
        // Passive touch events continue observing native scrolling without taking it over.
        document.addEventListener('touchstart', event => {
            lastTouchTime = now();
            if (event.touches.length !== 1) {
                if (gesture) gesture.multi = true;
                pendingTrail = null;
                trails.replaceChildren();
                return;
            }
            const t = event.touches[0];
            if (!gesture) beginTouch(t.identifier, t.clientX, t.clientY);
        }, {capture: true, passive: true});
        document.addEventListener('touchmove', event => {
            if (!gesture || event.touches.length !== 1 || gesture.multi) return;
            const t = Array.from(event.touches).find(t => t.identifier === gesture.id);
            if (t) moveTouch(t.clientX, t.clientY);
        }, {capture: true, passive: true});
        document.addEventListener('touchend', event => {
            if (!gesture) return;
            const t = Array.from(event.changedTouches).find(t => t.identifier === gesture.id);
            if (event.touches.length === 0) finishTouch(t && t.clientX, t && t.clientY);
            else if (t) gesture.multi = true;
        }, {capture: true, passive: true});
        document.addEventListener('touchcancel', () => { if (gesture) finishTouch(); }, {capture: true, passive: true});

        // Pointer-only touch hardware fallback; scroll events below cover cancelled streams.
        if (!('ontouchstart' in window)) {
            document.addEventListener('pointerdown', event => {
                if (event.pointerType !== 'touch') return;
                if (gesture) { gesture.multi = true; return; }
                if (event.isPrimary !== false) beginTouch(event.pointerId, event.clientX, event.clientY);
            }, {capture: true, passive: true});
            document.addEventListener('pointermove', event => {
                if (event.pointerType === 'touch' && gesture && event.pointerId === gesture.id) moveTouch(event.clientX, event.clientY);
            }, {passive: true});
            document.addEventListener('pointerup', event => {
                if (event.pointerType === 'touch' && gesture && event.pointerId === gesture.id) finishTouch(event.clientX, event.clientY);
            }, {capture: true, passive: true});
            document.addEventListener('pointercancel', event => {
                if (event.pointerType === 'touch' && gesture && event.pointerId === gesture.id) finishTouch();
            }, {passive: true});
        }
        addEventListener('scroll', () => {
            const dy = scrollY - lastScrollY;
            lastScrollY = scrollY;
            if (inputMode !== 'touch' || !hasTouch || paused || (gesture && gesture.multi) || now() - lastTouchTime > 1200) return;
            // A faint stroke near the last finger position also covers inertial scrolling.
            pendingTrail = {x: tx, y: ty, dx: 0, dy: Math.sign(dy || 1) * 22};
            queueTouch();
        }, {capture: true, passive: true});
        addEventListener('resize', queueTouch, {passive: true});

        let x = -1000, y = -1000, present = false, paused = false;
        let frame = 0, dirty = true, records = [], pulse;
        const excluded = 'script, style, noscript, svg, canvas, iframe, input, textarea, select, [contenteditable], [hidden], [aria-hidden="true"], .cyber-cursor-ui, .cyber-touch-ui';
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
            if (event.pointerType !== 'mouse') return;
            if (now() - lastTouchTime < 800) return;
            if (!finePointer.matches || paused) { hide(); return; }
            setInputMode('mouse');
            touchUI.hidden = true;
            x = event.clientX; y = event.clientY; present = true;
            schedule();
        }, {passive: true});

        // Capture clicks before links navigate away, without blocking their action.
        document.addEventListener('click', event => {
            if (!finePointer.matches || event.detail === 0 || (event.pointerType && event.pointerType !== 'mouse')) return;
            if (event.sourceCapabilities && event.sourceCapabilities.firesTouchEvents) return;
            if (!event.pointerType && now() - lastTouchTime < 800) return;
            setInputMode('mouse');
            touchUI.hidden = true;
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

        document.addEventListener('pointerout', event => { if (event.pointerType === 'mouse' && !event.relatedTarget) hide(); });
        document.addEventListener('pointerover', event => {
            if (event.target instanceof Element && event.target.closest('iframe, embed, object')) hide();
        });
        addEventListener('blur', hide);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) { hide(); touchUI.hidden = true; gesture = null; }
            else queueTouch();
        });
        addEventListener('scroll', invalidate, {capture: true, passive: true});
        addEventListener('resize', invalidate, {passive: true});
        document.addEventListener('load', invalidate, true);
        document.addEventListener('transitionend', invalidate, true);
        document.addEventListener('animationend', invalidate, true);
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                paused = !paused; ui.hidden = true; touchUI.hidden = true;
                if (!paused) { schedule(); queueTouch(); }
            }
        });
        finePointer.addEventListener('change', () => { if (!finePointer.matches) hide(); else invalidate(); });
        if (document.fonts) document.fonts.ready.then(invalidate);
        const observer = new MutationObserver(changes => {
            if (changes.some(change => !ui.contains(change.target) && !touchUI.contains(change.target))) invalidate();
        });
        observer.observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'open']});
        observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
        queueTouch();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
    else init();
})();
