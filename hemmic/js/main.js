// ===== MOUSE ANIMATION FOR HERO TEXT =====
document.addEventListener('DOMContentLoaded', function() {
    const hero = document.getElementById('hero-headline');
    const wrapper = document.getElementById('hero-wrapper');
    
    if (hero && wrapper) {
        wrapper.addEventListener('mousemove', function(e) {
            const rect = wrapper.getBoundingClientRect();
            
            // Calculate mouse position relative to the wrapper
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate percentage (0 to 1) of mouse position
            const xPercent = x / rect.width;
            const yPercent = y / rect.height;
            
            // Calculate rotation and translation (max 8deg rotation, 12px translation)
            const rotateY = (xPercent - 0.5) * 8;
            const rotateX = (yPercent - 0.5) * -8;
            const translateX = (xPercent - 0.5) * 12;
            const translateY = (yPercent - 0.5) * 12;
            
            // Apply transform
            hero.style.transform = `
                perspective(800px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateX(${translateX}px)
                translateY(${translateY}px)
                scale(1.02)
            `;
        });
        
        wrapper.addEventListener('mouseleave', function() {
            // Smooth return to original position
            hero.style.transform = `
                perspective(800px)
                rotateX(0deg)
                rotateY(0deg)
                translateX(0px)
                translateY(0px)
                scale(1)
            `;
            hero.style.transition = 'transform 0.4s ease-out';
            
            // Remove transition after animation completes so it doesn't interfere with mouse movement
            setTimeout(() => {
                hero.style.transition = 'none';
            }, 400);
        });
    }
    
    // ===== EMAIL SIGNUP =====
    const form = document.getElementById('email-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            
            if (email) {
                const button = this.querySelector('button');
                const originalText = button.textContent;
                button.textContent = '✓ Subscribed!';
                button.style.background = '#16a34a';
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.style.background = '';
                    this.querySelector('input[type="email"]').value = '';
                }, 3000);
                
                console.log('Email captured:', email);
            }
        });
    }
    
    // ===== CONTACT FORM =====
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const button = this.querySelector('button');
            const originalText = button.textContent;
            button.textContent = '✓ Sent!';
            button.style.background = '#16a34a';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
                this.reset();
            }, 3000);
            
            console.log('Contact form submitted');
        });
    }
});

// ===== INTERACTIVE LIGHT INTERACTIVE NETWORK BACKGROUND =====
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '0'; 
canvas.style.pointerEvents = 'none'; 

let particles = [];
const mouse = { x: null, y: null, radius: 180 };

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.9; 
        this.vy = (Math.random() - 0.5) * 0.9;
        this.radius = Math.random() * 2.5 + 1.5;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        if (mouse.x !== null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                this.x -= dx * 0.015; 
                this.y -= dy * 0.015;
            }
        }
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.25)'; // Light medical blue nodes
        ctx.fill();
    }
}

function init() {
    particles = [];
    const particleCount = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function connect() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 130) {
                let alpha = (1 - distance / 130) * 0.18; 
                ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`; 
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    connect();
    requestAnimationFrame(animate);
}

init();
animate();
window.addEventListener('resize', init);
