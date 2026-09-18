// repository/js/shorten.js

// Karakter aman untuk slug (tanpa karakter ambigu seperti 0/O, 1/l)
const SLUG_CHARS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SLUG_LENGTH = 6;

function generateSlug() {
    let slug = "";
    const randomValues = new Uint8Array(SLUG_LENGTH);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < SLUG_LENGTH; i++) {
        slug += SLUG_CHARS[randomValues[i] % SLUG_CHARS.length];
    }
    return slug;
}

// Validasi: cuma izinkan http/https, tolak javascript:, data:, dll (mencegah penyalahgunaan redirect)
function isSafeUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const supabaseClientShorten = window.supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_KEY
    );

    const inputUrl = document.getElementById('input-url');
    const btnShorten = document.getElementById('btn-shorten');
    const resultBox = document.getElementById('result-box');
    const resultUrlField = document.getElementById('result-url');
    const btnCopy = document.getElementById('btn-copy');
    const errorMsg = document.getElementById('error-msg');

    function showError(text) {
        errorMsg.textContent = text;
        errorMsg.style.display = 'block';
        resultBox.style.display = 'none';
    }

    btnShorten.addEventListener('click', async () => {
        const longUrl = inputUrl.value.trim();
        errorMsg.style.display = 'none';

        if (!isSafeUrl(longUrl)) {
            showError("Masukkan link yang valid (harus diawali http:// atau https://).");
            return;
        }

        btnShorten.disabled = true;
        btnShorten.textContent = "Membuat...";

        try {
            // Coba insert, kalau slug bentrok (sangat jarang) coba lagi maksimal 5x
            let saved = null;
            for (let attempt = 0; attempt < 5 && !saved; attempt++) {
                const slug = generateSlug();
                const { data, error } = await supabaseClientShorten
                    .from('short_links')
                    .insert({ slug, target_url: longUrl })
                    .select()
                    .single();

                if (!error) {
                    saved = data;
                } else if (error.code !== '23505') { // 23505 = slug bentrok (unique violation), selain itu berhenti
                    showError("Gagal membuat link pendek: " + error.message);
                    return;
                }
            }

            if (!saved) {
                showError("Gagal membuat slug unik, coba lagi.");
                return;
            }

            const shortUrl = window.location.origin + "/s/" + saved.slug;
            resultUrlField.value = shortUrl;
            resultBox.style.display = 'block';
        } catch (err) {
            console.error("Shorten error:", err);
            showError("Terjadi kesalahan koneksi ke server. Cek console untuk detail.");
        } finally {
            btnShorten.disabled = false;
            btnShorten.textContent = "Buat Link Pendek";
        }
    });

    btnCopy.addEventListener('click', () => {
        resultUrlField.select();
        navigator.clipboard.writeText(resultUrlField.value);
        btnCopy.textContent = "Tersalin!";
        setTimeout(() => { btnCopy.textContent = "Salin"; }, 1500);
    });
});
