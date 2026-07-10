(function () {
    'use strict';

    const $ = id => document.getElementById(id);

    const editor   = $('main-editor'),
          wc       = $('word-count'),
          lc       = $('letter-count'),
          cc       = $('char-count'),
          sc       = $('sentence-count'),
          toggle   = $('lang-toggle'),
          dropdown = $('lang-dropdown'),
          label    = toggle.querySelector('span:nth-child(2)'),
          warning  = $('lang-warning'),
          hlBar    = $('half-letter-bar'),
          hlCheck  = $('half-letter-toggle'),
          clearBtn = $('clear-btn');

    let lang = 'English', halfMode = false;

    const GU_RANGE = /[\u0A80-\u0AFF]/;
    const GU_BASE  = /[\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AB9\u0ABD\u0AE0\u0AE1]/gu;

    const isGujaratiOnly = t =>
        !t.trim() || /^[\u0A80-\u0AFF\s\d\u0964\u0965.,!?"'()\-*#_:;%@&+=\/\\]+$/.test(t);

    function countGujarati(t) {
        if (!t.trim()) return zero();
        let letters = 0;
        if (halfMode) {
            letters = (t.match(GU_BASE) || []).length;
        } else {
            try {
                for (const s of new Intl.Segmenter('gu', { granularity: 'grapheme' }).segment(t))
                    if (GU_RANGE.test(s.segment)) letters++;
            } catch { letters = (t.match(/[\u0A80-\u0AFF]/gu) || []).length; }
        }
        let words = 0;
        try {
            for (const w of new Intl.Segmenter('gu', { granularity: 'word' }).segment(t))
                if (w.isWordLike && GU_RANGE.test(w.segment)) words++;
        } catch { words = t.trim().split(/\s+/).filter(s => GU_RANGE.test(s)).length; }

        return { words, letters, chars: [...t].length,
                 sentences: (t.match(/[^.!?\u0964\u0965]+[.!?\u0964\u0965]+/g) || (t.trim() ? [t] : [])).length };
    }

    function countEnglish(t) {
        if (!t.trim()) return zero();
        return {
            words:     (t.match(/[a-zA-Z0-9]+(?:'[a-zA-Z]+)*/g) || []).length,
            letters:   (t.match(/[a-zA-Z]/g) || []).length,
            chars:     t.length,
            sentences: (t.match(/[^.!?]+[.!?]+/g) || (t.trim() ? [t] : [])).length
        };
    }

    const zero = () => ({ words: 0, letters: 0, chars: 0, sentences: 0 });

    function render(s) {
        wc.textContent = s.words;
        lc.textContent = s.letters;
        cc.textContent = s.chars;
        sc.textContent = s.sentences;
    }

    function onInput() {
        const t = editor.value;
        editor.style.height = 'auto';
        editor.style.height = editor.scrollHeight + 'px';
        if (lang === 'Gujarati') {
            const invalid = t.trim() && !isGujaratiOnly(t);
            warning.classList.toggle('hidden', !invalid);
            render(invalid ? zero() : countGujarati(t));
        } else {
            warning.classList.add('hidden');
            render(countEnglish(t));
        }
    }

    function setLang(l) {
        lang = l;
        label.textContent = l;
        dropdown.classList.add('hidden');
        editor.placeholder = l === 'English'
            ? 'Start typing or paste your English text here...'
            : '\u0A85\u0AB9\u0AC0\u0A82 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0 \u0AB2\u0A96\u0ACB \u0A85\u0AA5\u0AB5\u0ABE \u0AAA\u0AC7\u0AB8\u0ACD\u0A9F \u0A95\u0AB0\u0ACB...';
        hlBar.classList.toggle('hidden', l === 'English');
        halfMode = false; hlCheck.checked = false;
        editor.value = ''; warning.classList.add('hidden');
        render(zero()); editor.focus();
    }

    editor.addEventListener('input', onInput);
    toggle.addEventListener('click', e => { e.stopPropagation(); dropdown.classList.toggle('hidden'); });
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
    dropdown.querySelectorAll('[data-lang]').forEach(el =>
        el.addEventListener('click', e => { e.stopPropagation(); setLang(el.dataset.lang); })
    );
    clearBtn.addEventListener('click', () => { editor.value = ''; warning.classList.add('hidden'); render(zero()); editor.focus(); });
    hlCheck.addEventListener('change', () => { halfMode = hlCheck.checked; onInput(); });

    onInput();
}());
