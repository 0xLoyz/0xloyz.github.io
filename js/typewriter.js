// repository/js/typewriter.js
// Efek ketik-hapus bergantian di hero-card beranda

const TYPEWRITER_PHRASES = [
    "free source code",
    "free tools",
    "website statis",
    "by LoyzDev"
];

document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('typewriter');
    if (!el) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const TYPE_SPEED = 90;
    const DELETE_SPEED = 50;
    const PAUSE_AFTER_TYPE = 1200;
    const PAUSE_AFTER_DELETE = 400;

    function tick() {
        const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];

        if (!deleting) {
            charIndex++;
            el.textContent = currentPhrase.slice(0, charIndex);

            if (charIndex === currentPhrase.length) {
                deleting = true;
                setTimeout(tick, PAUSE_AFTER_TYPE);
                return;
            }
            setTimeout(tick, TYPE_SPEED);
        } else {
            charIndex--;
            el.textContent = currentPhrase.slice(0, charIndex);

            if (charIndex === 0) {
                deleting = false;
                phraseIndex = (phraseIndex + 1) % TYPEWRITER_PHRASES.length;
                setTimeout(tick, PAUSE_AFTER_DELETE);
                return;
            }
            setTimeout(tick, DELETE_SPEED);
        }
    }

    tick();
});
