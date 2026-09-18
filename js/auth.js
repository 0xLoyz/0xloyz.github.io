// repository/js/auth.js

// Inisialisasi client Supabase (pakai kredensial dari config.js)
const supabaseClient = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_KEY
);

// Menyamarkan email, contoh: "example@gmail.com" -> "exam**@gmail.com"
function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [local, domain] = email.split('@');
    const visibleLength = Math.min(4, local.length);
    return local.slice(0, visibleLength) + "**@" + domain;
}

// Mengambil nama & foto profil dari data OAuth (Google atau GitHub)
function getProfileInfo(user) {
    const meta = user.user_metadata || {};
    const name = meta.full_name || meta.name || meta.user_name || user.email;
    const avatar = meta.avatar_url || meta.picture || "";
    return { name, avatar };
}

document.addEventListener('DOMContentLoaded', () => {
    const loginCard = document.getElementById('login-card');
    const profileCard = document.getElementById('profile-card');
    const turnstileContainer = document.getElementById('turnstile-container');
    const btnGoogle = document.getElementById('btn-login-google');
    const btnGithub = document.getElementById('btn-login-github');
    const btnLogout = document.getElementById('btn-logout');
    let turnstileToken = "";

    // 0. Cek status login: tampilkan kartu profil atau kartu login
    async function renderAuthState() {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            const { name, avatar } = getProfileInfo(session.user);
            document.getElementById('profile-name').textContent = name;
            document.getElementById('profile-email').textContent = maskEmail(session.user.email);
            document.getElementById('profile-avatar').src = avatar;

            profileCard.style.display = 'block';
            loginCard.style.display = 'none';
        } else {
            profileCard.style.display = 'none';
            loginCard.style.display = 'block';
        }
    }
    renderAuthState();

    // Refresh tampilan otomatis kalau status login berubah (habis redirect OAuth, dsb)
    supabaseClient.auth.onAuthStateChange(() => renderAuthState());

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
                // Setelah login sukses, Supabase akan redirect balik ke halaman login ini
                redirectTo: window.location.href
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

    // 3. Event listener tombol GitHub
    btnGithub.addEventListener('click', () => loginWithProvider('github'));

    // 4. Event listener tombol Logout
    btnLogout.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        renderAuthState();
    });
});
