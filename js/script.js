document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');

    // Toggle Sidebar
    hamburgerBtn.addEventListener('click', () => {
        hamburgerBtn.classList.toggle('active');
        sidebar.classList.toggle('active');
    });

    // Menutup sidebar jika pengguna mengklik di luar area sidebar
    document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target) && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            hamburgerBtn.classList.remove('active');
        }
    });
});
