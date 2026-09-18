const canvas = document.getElementById('particles-canvas');
const ctx = canvas.getContext('2d');

let particlesArray = [];

// Menyesuaikan ukuran canvas dengan layar
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// Class Partikel (Desain Bara Api / Embers)
class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 1.5 - 0.75;
        this.speedY = Math.random() * -2 - 0.5; // Bergerak ke atas (seperti api)
        
        // Warna ala Pyro (Campuran merah, oranye, dan emas)
        const colors = ['#d84b3e', '#e5a452', '#ff7b00'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Opasitas acak untuk efek berkedip
        this.opacity = Math.random() * 0.5 + 0.3;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Jika partikel keluar dari layar atas, reset ke bawah
        if (this.y < 0) {
            this.y = canvas.height;
            this.x = Math.random() * canvas.width;
        }
        // Jika keluar dari samping
        if (this.x < 0 || this.x > canvas.width) {
            this.speedX = this.speedX * -1;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        
        // Tambahkan efek glow (soft)
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
    }
}

// Inisialisasi Partikel
function init() {
    particlesArray = [];
    const numberOfParticles = (canvas.width * canvas.height) / 9000; // Responsif terhadap ukuran layar
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

// Loop Animasi
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    requestAnimationFrame(animate);
}

init();
animate();
