// Dark Mode Toggle with persistence
function toggleTheme() {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}

(function () {
    const saved = localStorage.getItem('theme');
    document.documentElement.setAttribute(
        'data-theme',
        saved === 'dark' ? 'dark' : 'light'
    );
})();

// Close mobile menu on link click + close email dropdown on outside click
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.nav-links a').forEach(function (link) {
        link.addEventListener('click', function () {
            var menu = document.querySelector('.nav-links');
            if (menu) menu.classList.remove('active');
        });
    });

    // Close email dropdown when clicking outside
    document.addEventListener('click', function(e) {
        var btn = document.querySelector('button[title="Email"]');
        var dd = document.querySelector('.email-dropdown');
        if (dd && btn && !dd.contains(e.target) && !btn.contains(e.target)) {
            dd.classList.remove('open');
        }
    });
});

// CV accordion
document.addEventListener('DOMContentLoaded', function () {
    const cvItems = document.querySelectorAll('.cv-item.collapsible');

    cvItems.forEach(function (item) {
        const summary = item.querySelector('.cv-summary');
        const button = item.querySelector('.cv-toggle');

        if (summary) {
            summary.addEventListener('click', function (e) {
                // Prevent double-toggling if they click directly on the button
                if (e.target.closest('.cv-toggle')) return;
                item.classList.toggle('open');
            });
        }

        if (button) {
            button.addEventListener('click', function () {
                item.classList.toggle('open');
            });
        }
    });
});


(() => {
    if (document.querySelector('script[data-cursor-effects]')) return;

    const base = document.currentScript
        ? document.currentScript.src
        : document.baseURI;

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = new URL('cursor-effects.css', base).href;

    const js = document.createElement('script');
    js.src = new URL('cursor-effects.js', base).href;
    js.dataset.cursorEffects = 'true';

    document.head.append(css);
    document.body.append(js);
})();
