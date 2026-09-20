// repository/js/canvas.js
// Sistem "Kanvas": DSL khusus (bukan HTML) buat admin nyusun halaman
// berisi judul/kategori/teks/link/file, read-only buat user biasa.

const CANVAS_SLUG = "utama"; // 1 kanvas untuk saat ini
const CANVAS_TAG_REGEX = /<(title|kategori|txt|link|file|space)>([\s\S]*?)<\/\1>/g;

// Tipe file yang punya preview lewat Google Drive viewer
const PREVIEWABLE_EXT = ['txt', 'md', 'js', 'html', 'json', 'css', 'mp3', 'mp4', 'wav', 'ogg', 'webm', 'pdf', 'png', 'jpg', 'jpeg', 'gif'];

function getFileExt(name) {
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

// Ambil semua token dari teks DSL, lengkap dengan posisi (buat nge-update file setelah upload)
function parseCanvasTokens(content) {
    const tokens = [];
    let match;
    CANVAS_TAG_REGEX.lastIndex = 0;
    while ((match = CANVAS_TAG_REGEX.exec(content)) !== null) {
        tokens.push({
            type: match[1],
            value: match[2],
            start: match.index,
            end: match.index + match[0].length
        });
    }
    return tokens;
}

function escapeHtmlCanvas(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Render satu ikon file (badge warna sesuai ekstensi)
function renderFileBadge(fileValue, tokenIndex) {
    const trimmed = (fileValue || '').trim();

    // Belum pernah diupload beneran (baik kosong ATAU baru nama rencana tanpa "|")
    if (!trimmed.includes('|')) {
        const hint = trimmed && trimmed !== '-' ? escapeHtmlCanvas(trimmed) : '';
        return `<button class="canvas-file-upload" data-token-index="${tokenIndex}">
            + Upload${hint ? `<span class="canvas-file-hint">${hint}</span>` : ''}
        </button>`;
    }

    const [name, fileId] = trimmed.split('|');
    const ext = getFileExt(name || '');
    return `<button class="canvas-file-badge" data-file-id="${fileId}" data-file-name="${escapeHtmlCanvas(name)}" data-ext="${ext}">
        <span class="canvas-file-ext">${ext || '?'}</span>
        <span class="canvas-file-name">${escapeHtmlCanvas(name)}</span>
    </button>`;
}

function renderCanvas(content) {
    const tokens = parseCanvasTokens(content);
    let html = '';
    let i = 0;

    while (i < tokens.length) {
        const token = tokens[i];

        if (token.type === 'file') {
            // Kumpulkan semua <file> yang beruntun jadi satu baris horizontal
            let group = [];
            while (i < tokens.length && tokens[i].type === 'file') {
                group.push({ ...tokens[i], tokenIndex: i });
                i++;
            }
            html += `<div class="canvas-file-row">${group.map(f => renderFileBadge(f.value, f.tokenIndex)).join('')}</div>`;
            continue;
        }

        switch (token.type) {
            case 'title':
                html += `<h2 class="canvas-title">${escapeHtmlCanvas(token.value)}</h2>`;
                break;
            case 'kategori':
                html += `<div class="canvas-kategori">-- ${escapeHtmlCanvas(token.value)} --</div>`;
                break;
            case 'txt':
                html += `<p class="canvas-txt">${escapeHtmlCanvas(token.value)}</p>`;
                break;
            case 'link':
                html += `<a class="canvas-link" href="${escapeHtmlCanvas(token.value)}" target="_blank" rel="noopener">${escapeHtmlCanvas(token.value)}</a>`;
                break;
            case 'space':
                html += `<div class="canvas-space" style="height:${(parseInt(token.value) || 1) * 14}px"></div>`;
                break;
        }
        i++;
    }

    return html || '<p class="canvas-empty">Kanvas ini masih kosong.</p>';
}

document.addEventListener('DOMContentLoaded', () => {
    const supabaseClientCanvas = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    const toolbar = document.getElementById('canvas-toolbar');
    const editor = document.getElementById('canvas-editor');
    const editorActions = document.getElementById('canvas-editor-actions');
    const toggleEditBtn = document.getElementById('btn-toggle-edit');
    const renderBox = document.getElementById('canvas-render');
    const btnRun = document.getElementById('btn-run');
    const btnSave = document.getElementById('btn-save');
    const fileModalOverlay = document.getElementById('file-modal-overlay');
    const fileModalContent = document.getElementById('file-modal-content');
    const fileModalClose = document.getElementById('file-modal-close');
    const hiddenFileInput = document.getElementById('hidden-file-input');

    let currentContent = '';
    let isAdmin = false;
    let editMode = false;
    let pendingUploadTokenIndex = null;

    function renderCurrent() {
        renderBox.innerHTML = renderCanvas(currentContent);
        attachFileHandlers();
    }

    function attachFileHandlers() {
        renderBox.querySelectorAll('.canvas-file-upload').forEach(btn => {
            btn.addEventListener('click', () => {
                pendingUploadTokenIndex = parseInt(btn.dataset.tokenIndex);
                hiddenFileInput.click();
            });
        });
        renderBox.querySelectorAll('.canvas-file-badge').forEach(btn => {
            btn.addEventListener('click', () => openFilePreview(btn.dataset.fileId, btn.dataset.fileName, btn.dataset.ext));
        });
    }

    function openFilePreview(fileId, fileName, ext) {
        fileModalOverlay.style.display = 'flex';
        if (ext === 'zip' || !PREVIEWABLE_EXT.includes(ext)) {
            fileModalContent.innerHTML = `
                <p>Tidak ada preview untuk file ini.</p>
                <a class="oauth-btn" style="display:inline-block; text-align:center;"
                   href="https://drive.google.com/uc?export=download&id=${fileId}" target="_blank">
                   Unduh ${escapeHtmlCanvas(fileName)}
                </a>`;
        } else {
            fileModalContent.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId}/preview"
                width="100%" height="100%" style="border:0; min-height: 60vh;" allow="autoplay"></iframe>`;
        }
    }

    fileModalClose.addEventListener('click', () => {
        fileModalOverlay.style.display = 'none';
        fileModalContent.innerHTML = '';
    });

    // Upload file terpilih ke GAS -> Google Drive
    hiddenFileInput.addEventListener('change', async () => {
        const file = hiddenFileInput.files[0];
        if (!file || pendingUploadTokenIndex === null) return;

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result.split(',')[1];

            try {
                const res = await fetch(CONFIG.GAS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // hindari CORS preflight ke GAS
                    body: JSON.stringify({
                        fileName: file.name,
                        mimeType: file.type || 'application/octet-stream',
                        fileBase64: base64
                    })
                });
                const data = await res.json();

                if (!data.success) {
                    alert("Upload gagal: " + data.error);
                    return;
                }

                // Tulis balik metadata file ke posisi token yang sesuai di teks DSL
                const tokens = parseCanvasTokens(currentContent);
                const target = tokens[pendingUploadTokenIndex];
                const newValue = `${data.fileName}|${data.fileId}`;
                currentContent = currentContent.slice(0, target.start)
                    + `<file>${newValue}</file>`
                    + currentContent.slice(target.end);

                if (editMode) editor.value = currentContent;
                renderCurrent();
            } catch (err) {
                console.error(err);
                alert("Gagal upload file (cek koneksi / GAS_ENDPOINT).");
            }
        };
        reader.readAsDataURL(file);
        hiddenFileInput.value = '';
    });

    // Toolbar: klik tag -> sisip ke posisi kursor di textarea
    toolbar.querySelectorAll('button[data-tag]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            const insertText = `<${tag}></${tag}>`;
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            editor.value = editor.value.slice(0, start) + insertText + editor.value.slice(end);
            editor.focus();
            editor.selectionStart = editor.selectionEnd = start + tag.length + 2; // taruh kursor di antara tag
        });
    });

    btnRun.addEventListener('click', () => {
        currentContent = editor.value;
        renderCurrent();
    });

    btnSave.addEventListener('click', async () => {
        currentContent = editor.value;
        const { error } = await supabaseClientCanvas
            .from('canvas_pages')
            .upsert({ slug: CANVAS_SLUG, content: currentContent, updated_at: new Date().toISOString() }, { onConflict: 'slug' });

        if (error) {
            alert("Gagal menyimpan: " + error.message);
        } else {
            alert("Kanvas tersimpan!");
        }
        renderCurrent();
    });

    toggleEditBtn.addEventListener('click', () => {
        editMode = !editMode;
        editor.style.display = editMode ? 'block' : 'none';
        toolbar.style.display = editMode ? 'flex' : 'none';
        editorActions.style.display = editMode ? 'flex' : 'none';
        toggleEditBtn.textContent = editMode ? 'Mode Lihat' : 'Mode Edit';
        if (editMode) editor.value = currentContent;
    });

    // Muat kanvas dari Supabase, lalu cek admin
    async function init() {
        const { data: canvasRow } = await supabaseClientCanvas
            .from('canvas_pages')
            .select('content')
            .eq('slug', CANVAS_SLUG)
            .maybeSingle();

        currentContent = canvasRow?.content || '';
        renderCurrent();

        const { data: { session } } = await supabaseClientCanvas.auth.getSession();
        if (session) {
            const { data: roleRow } = await supabaseClientCanvas
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .single();
            isAdmin = roleRow?.role === 'admin';
        }

        if (isAdmin) {
            toggleEditBtn.style.display = 'inline-block';
        }
    }

    init();
});
