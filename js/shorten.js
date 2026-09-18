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
    const historyPanel = document.getElementById('history-panel');
    const historyList = document.getElementById('history-list');

    let currentUserId = null;

    // Ambil daftar link milik user yang sedang login, lalu render ke sidebar
    async function loadHistory() {
        const { data, error } = await supabaseClientShorten
            .from('short_links')
            .select('slug, target_url, created_at')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false });

        historyList.innerHTML = '';

        if (error) {
            console.error("Gagal memuat riwayat:", error);
            historyList.innerHTML = '<li class="history-empty">Gagal memuat riwayat.</li>';
            return;
        }

        if (!data || data.length === 0) {
            historyList.innerHTML = '<li class="history-empty">Belum ada link tersimpan.</li>';
            return;
        }

        data.forEach(row => {
            const shortUrl = window.location.origin + "/s/" + row.slug;
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <span class="h-short">/s/${row.slug}</span>
                <span class="h-target" title="${row.target_url}">${row.target_url}</span>
            `;
            li.querySelector('.h-short').addEventListener('click', () => {
                navigator.clipboard.writeText(shortUrl);
                const el = li.querySelector('.h-short');
                const original = el.textContent;
                el.textContent = "Tersalin!";
                setTimeout(() => { el.textContent = original; }, 1200);
            });
            historyList.appendChild(li);
        });
    }

    // Cek status login: kalau login, tampilkan panel riwayat & muat datanya
    async function initHistoryPanel() {
        const { data: { session } } = await supabaseClientShorten.auth.getSession();
        if (session) {
            currentUserId = session.user.id;
            historyPanel.style.display = 'block';
            loadHistory();
        } else {
            currentUserId = null;
            historyPanel.style.display = 'none';
        }
    }
    initHistoryPanel();
    supabaseClientShorten.auth.onAuthStateChange(() => initHistoryPanel());

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

            // Kalau lagi login, langsung refresh daftar riwayat biar link barunya muncul
            if (currentUserId) {
                loadHistory();
            }
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
