(function () {
    'use strict';

    // ── DOM References ──────────────────────────────────────────────────────────
    var editor          = document.getElementById('main-editor');
    var wordCount       = document.getElementById('word-count');
    var letterCount     = document.getElementById('letter-count');
    var charCount       = document.getElementById('char-count');
    var sentenceCount   = document.getElementById('sentence-count');
    var langToggle      = document.getElementById('lang-toggle');
    var langDropdown    = document.getElementById('lang-dropdown');
    var langLabel       = langToggle.querySelector('span:nth-child(2)');
    var langWarning     = document.getElementById('lang-warning');
    var halfLetterBar   = document.getElementById('half-letter-bar');
    var halfLetterToggle = document.getElementById('half-letter-toggle');
    var clearBtn        = document.getElementById('clear-btn');

    // ── State ───────────────────────────────────────────────────────────────────
    var currentLang      = 'English';
    var countHalfLetters = false;

    // ── Regex ────────────────────────────────────────────────────────────────────
    var gujaratiRange       = /[\u0A80-\u0AFF]/;
    var gujaratiBaseLetters = /[\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AB9\u0ABD\u0AE0\u0AE1]/gu;

    // ── Validate Gujarati-only text ──────────────────────────────────────────────
    function isGujaratiOnly(text) {
        return !text.trim() ||
            /^[\u0A80-\u0AFF\s\d\u0964\u0965.,!?"'()\-*#_:;%@&+=\/\\]+$/.test(text);
    }

    // ── Count stats for Gujarati ─────────────────────────────────────────────────
    function countGujarati(text) {
        if (!text.trim()) return { words: 0, letters: 0, chars: 0, sentences: 0 };

        var letters = 0;
        if (countHalfLetters) {
            letters = (text.match(gujaratiBaseLetters) || []).length;
        } else {
            try {
                var seg = new Intl.Segmenter('gu', { granularity: 'grapheme' });
                for (var s of seg.segment(text)) {
                    if (gujaratiRange.test(s.segment)) letters++;
                }
            } catch (e) {
                letters = (text.match(/[\u0A80-\u0AFF]/gu) || []).length;
            }
        }

        var words = 0;
        try {
            var wseg = new Intl.Segmenter('gu', { granularity: 'word' });
            for (var w of wseg.segment(text)) {
                if (w.isWordLike && gujaratiRange.test(w.segment)) words++;
            }
        } catch (e) {
            words = text.trim().split(/\s+/).filter(function (s) {
                return gujaratiRange.test(s);
            }).length;
        }

        var chars     = [...text].length;
        var sentences = (text.match(/[^.!?\u0964\u0965]+[.!?\u0964\u0965]+/g) ||
                        (text.trim() ? [text] : [])).length;

        return { words: words, letters: letters, chars: chars, sentences: sentences };
    }

    // ── Count stats for English ──────────────────────────────────────────────────
    function countEnglish(text) {
        if (!text.trim()) return { words: 0, letters: 0, chars: 0, sentences: 0 };

        var words     = (text.match(/[a-zA-Z0-9]+(?:'[a-zA-Z]+)*/g) || []).length;
        var letters   = (text.match(/[a-zA-Z]/g) || []).length;
        var chars     = text.length;
        var sentences = (text.match(/[^.!?]+[.!?]+/g) || (text.trim() ? [text] : [])).length;

        return { words: words, letters: letters, chars: chars, sentences: sentences };
    }

    // ── Update counter display ───────────────────────────────────────────────────
    function updateDisplay(stats) {
        wordCount.textContent     = stats.words;
        letterCount.textContent   = stats.letters;
        charCount.textContent     = stats.chars;
        sentenceCount.textContent = stats.sentences;
    }

    // ── Main input handler ───────────────────────────────────────────────────────
    function onInput() {
        var text = editor.value;

        // Auto-resize textarea height
        editor.style.height = 'auto';
        editor.style.height = editor.scrollHeight + 'px';

        if (currentLang === 'Gujarati') {
            if (text.trim() && !isGujaratiOnly(text)) {
                langWarning.classList.remove('hidden');
                updateDisplay({ words: 0, letters: 0, chars: 0, sentences: 0 });
                return;
            }
            langWarning.classList.add('hidden');
            updateDisplay(countGujarati(text));
        } else {
            langWarning.classList.add('hidden');
            updateDisplay(countEnglish(text));
        }
    }

    // ── Language switcher ────────────────────────────────────────────────────────
    function setLanguage(lang) {
        currentLang = lang;
        langLabel.textContent = lang;
        langDropdown.classList.add('hidden');

        if (lang === 'English') {
            editor.placeholder = 'Start typing or paste your English text here...';
            halfLetterBar.classList.add('hidden');
        } else {
            editor.placeholder = '\u0A85\u0AB9\u0AC0\u0A82 \u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0 \u0AB2\u0A96\u0ACB \u0A85\u0AA5\u0AB5\u0ABE \u0AAA\u0AC7\u0AB8\u0ACD\u0A9F \u0A95\u0AB0\u0ACB...';
            halfLetterBar.classList.remove('hidden');
        }

        countHalfLetters = false;
        halfLetterToggle.checked = false;
        editor.value = '';
        langWarning.classList.add('hidden');
        updateDisplay({ words: 0, letters: 0, chars: 0, sentences: 0 });
        editor.focus();
    }

    // ── Event Listeners ──────────────────────────────────────────────────────────
    editor.addEventListener('input', onInput);

    langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        langDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', function () {
        langDropdown.classList.add('hidden');
    });

    langDropdown.querySelectorAll('[data-lang]').forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.stopPropagation();
            setLanguage(item.dataset.lang);
        });
    });

    clearBtn.addEventListener('click', function () {
        editor.value = '';
        langWarning.classList.add('hidden');
        updateDisplay({ words: 0, letters: 0, chars: 0, sentences: 0 });
        editor.focus();
    });

    halfLetterToggle.addEventListener('change', function () {
        countHalfLetters = halfLetterToggle.checked;
        onInput();
    });

    // ── Init ─────────────────────────────────────────────────────────────────────
    onInput();

}());
