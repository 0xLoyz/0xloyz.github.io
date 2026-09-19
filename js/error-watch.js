// repository/js/error-watch.js
// Kalau ada error JS di halaman manapun, muncul tombol kecil buat lihat detailnya.

(function () {
    let lastError = null;

    function showButton(errorInfo) {
        lastError = errorInfo;
        let btn = document.getElementById('error-watch-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'error-watch-btn';
            btn.textContent = '⚠ Error Ditemukan';
            btn.className = 'error-watch-btn';
            btn.addEventListener('click', () => {
                alert(
                    "Pesan: " + lastError.message +
                    "\nFile: " + lastError.source +
                    "\nBaris:Kolom: " + lastError.line + ":" + lastError.col +
                    (lastError.stack ? "\n\nStack:\n" + lastError.stack : "")
                );
            });
            document.body.appendChild(btn);
        }
    }

    window.addEventListener('error', (e) => {
        showButton({
            message: e.message,
            source: e.filename,
            line: e.lineno,
            col: e.colno,
            stack: e.error?.stack
        });
    });

    window.addEventListener('unhandledrejection', (e) => {
        showButton({
            message: "Promise ditolak: " + (e.reason?.message || e.reason),
            source: "-",
            line: "-",
            col: "-",
            stack: e.reason?.stack
        });
    });
})();
