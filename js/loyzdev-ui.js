// repository/js/loyzdev-ui.js
//
// Data komponen LoyzDev UI. Tambah komponen baru = tambah satu objek
// di array COMPONENTS ini, tidak perlu ubah HTML.

const COMPONENTS = [
    {
        category: "Button",
        name: "Gradient Button",
        html: `<button class="ldui-btn-gradient">Klik Saya</button>`,
        css: `.ldui-btn-gradient {
  background: linear-gradient(135deg, #e5a452, #ff6b6b);
  color: #191414;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  font-size: 0.95rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.ldui-btn-gradient:hover {
  transform: translateY(-2px);
}`
    },
    {
        category: "Button",
        name: "Outline Button",
        html: `<button class="ldui-btn-outline">Pelajari Lebih</button>`,
        css: `.ldui-btn-outline {
  background: transparent;
  color: #e5a452;
  border: 2px solid #e5a452;
  padding: 10px 22px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s ease;
}
.ldui-btn-outline:hover {
  background: #e5a452;
  color: #191414;
}`
    },
    {
        category: "Card",
        name: "Info Card",
        html: `<div class="ldui-info-card">
  <h4>Judul Fitur</h4>
  <p>Deskripsi singkat tentang fitur atau layanan yang ditawarkan.</p>
</div>`,
        css: `.ldui-info-card {
  background: #1e1a1a;
  border: 1px solid rgba(229, 164, 82, 0.25);
  border-radius: 12px;
  padding: 20px;
  max-width: 280px;
}
.ldui-info-card h4 {
  color: #e5a452;
  margin: 0 0 8px;
}
.ldui-info-card p {
  color: rgba(255,255,255,0.7);
  font-size: 0.9rem;
  margin: 0;
}`
    },
    {
        category: "Card",
        name: "Profile Card",
        html: `<div class="ldui-profile-card">
  <img src="https://api.dicebear.com/7.x/identicon/svg?seed=loyz" alt="Avatar">
  <div>
    <strong>Nama Pengguna</strong>
    <span>Peran / Jabatan</span>
  </div>
</div>`,
        css: `.ldui-profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #1e1a1a;
  border-radius: 12px;
  padding: 14px 18px;
  max-width: 280px;
}
.ldui-profile-card img {
  width: 44px;
  height: 44px;
  border-radius: 50%;
}
.ldui-profile-card strong {
  display: block;
  color: #fff;
  font-size: 0.95rem;
}
.ldui-profile-card span {
  color: rgba(255,255,255,0.5);
  font-size: 0.8rem;
}`
    },
    {
        category: "Form",
        name: "Search Bar",
        html: `<form class="ldui-search-bar" onsubmit="return false;">
  <input type="text" placeholder="Cari sesuatu...">
  <button type="submit">Cari</button>
</form>`,
        css: `.ldui-search-bar {
  display: flex;
  max-width: 320px;
}
.ldui-search-bar input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(229,164,82,0.3);
  background: #1e1a1a;
  color: #fff;
  border-radius: 8px 0 0 8px;
  outline: none;
}
.ldui-search-bar button {
  background: #e5a452;
  color: #191414;
  border: none;
  padding: 10px 18px;
  border-radius: 0 8px 8px 0;
  font-weight: bold;
  cursor: pointer;
}`
    },
    {
        category: "Form",
        name: "Toggle Switch",
        html: `<label class="ldui-toggle">
  <input type="checkbox">
  <span class="ldui-toggle-slider"></span>
</label>`,
        css: `.ldui-toggle {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}
.ldui-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}
.ldui-toggle-slider {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.15);
  border-radius: 999px;
  transition: 0.2s;
  cursor: pointer;
}
.ldui-toggle-slider::before {
  content: "";
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.ldui-toggle input:checked + .ldui-toggle-slider {
  background: #e5a452;
}
.ldui-toggle input:checked + .ldui-toggle-slider::before {
  transform: translateX(22px);
}`
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('ldui-grid');
    const tabs = document.querySelectorAll('.ldui-tab');

    // Suntikkan semua CSS komponen ke <head> sekali saja, biar preview-nya hidup
    const styleTag = document.createElement('style');
    styleTag.textContent = COMPONENTS.map(c => c.css).join('\n\n');
    document.head.appendChild(styleTag);

    function buildSnippet(component) {
        return `<style>\n${component.css}\n</style>\n\n${component.html}`;
    }

    function render(filterCat) {
        grid.innerHTML = '';
        const list = filterCat === 'all'
            ? COMPONENTS
            : COMPONENTS.filter(c => c.category === filterCat);

        list.forEach(component => {
            const item = document.createElement('div');
            item.className = 'ldui-item';
            item.innerHTML = `
                <div class="ldui-item-header">
                    <span class="ldui-item-name">${component.name}</span>
                    <span class="ldui-item-cat">${component.category}</span>
                </div>
                <div class="ldui-preview">${component.html}</div>
                <button class="ldui-copy-btn">Salin Kode</button>
            `;
            item.querySelector('.ldui-copy-btn').addEventListener('click', (e) => {
                navigator.clipboard.writeText(buildSnippet(component));
                const btn = e.target;
                const original = btn.textContent;
                btn.textContent = "Tersalin!";
                setTimeout(() => { btn.textContent = original; }, 1200);
            });
            grid.appendChild(item);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            render(tab.dataset.cat);
        });
    });

    render('all');
});
