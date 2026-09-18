// repository/js/auth-status.js
// Menampilkan status login (nama/email + tombol logout) di halaman utama

const supabaseClient = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_KEY
);

document.addEventListener('DOMContentLoaded', async () => {
    const statusEl = document.getElementById('auth-status');
    if (!statusEl) return;

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (session) {
        const user = session.user;
        const displayName = user.user_metadata?.full_name || user.email;

        statusEl.innerHTML = `
            <p>Login sebagai: <strong>${displayName}</strong></p>
            <button id="btn-logout" class="btn-primary">Logout</button>
        `;

        document.getElementById('btn-logout').addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.reload();
        });
    } else {
        statusEl.innerHTML = `
            <p class="auth-optional-label">-opsional-</p>
            <a href="html/login" class="btn-primary">Login</a>
        `;
    }
});
