// repository/js/auth.js

// Inisialisasi client Supabase (pakai kredensial dari config.js)
const supabaseClient = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_KEY
);

document.addEventListener('DOMContentLoaded', () => {
    const turnstileContainer = document.getElementById('turnstile-container');
    const btnGoogle = document.getElementById('btn-login-google');
    const btnGithub = document.getElementById('btn-login-github');
    let turnstileToken = "";

    // 0. Kalau sudah ada sesi aktif, langsung lempar ke halaman utama
    (async () => {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = "../index.html";
        }
    })();

    // 1. Render Turnstile jika diaktifkan di config.js
    if (CONFIG.ENABLE_TURNSTILE) {
        turnstile.render(turnstileContainer, {
            sitekey: CONFIG.TURNSTILE_SITE_KEY,
            callback: function(token) {
                console.log("Turnstile berhasil dilewati!");
                turnstileToken = token;
            },
            'error-callback': function() {
                alert("Terjadi kesalahan pada verifikasi keamanan.");
            }
        });
    }

    // Fungsi generik untuk login OAuth (Google & GitHub)
    async function loginWithProvider(provider) {
        // Cek apakah Turnstile aktif tapi user belum menyelesaikan tantangan
        if (CONFIG.ENABLE_TURNSTILE && !turnstileToken) {
            alert("Selesaikan verifikasi keamanan (Turnstile) terlebih dahulu.");
            return;
        }

        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
                // Setelah login sukses, Supabase akan redirect balik ke sini
                redirectTo: window.location.origin + window.location.pathname.replace('login.html', 'index.html')
            }
        });

        if (error) {
            console.error(`Gagal login dengan ${provider}:`, error);
            alert("Terjadi kesalahan saat memulai login: " + error.message);
        }
        // Kalau sukses, browser otomatis redirect ke halaman provider (Google/GitHub)
    }

    // 2. Event listener tombol Google
    btnGoogle.addEventListener('click', () => loginWithProvider('google'));

    // 3. Event listener tombol GitHub (sebelumnya belum ada sama sekali)
    btnGithub.addEventListener('click', () => loginWithProvider('github'));
});
