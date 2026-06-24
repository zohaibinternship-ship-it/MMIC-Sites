// ===== FEMMIC FULL-SCREEN INTERACTIVE "GOLD-NETWORK" ENGINE =====
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.zIndex = '1';
canvas.style.pointerEvents = 'auto';

let mouse = { x: -1000, y: -1000 };
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Create a grid of points that covers the entire screen
const points = [];
const spacing = 60; // Density of the network
function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    points.length = 0;
    for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
            points.push({ x, y, baseX: x, baseY: y });
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Style settings for the "Wow" factor
    ctx.strokeStyle = 'rgba(223, 202, 167, 0.3)'; // Premium Gold
    ctx.lineWidth = 1;
    ctx.globalCompositeOperation = 'lighter'; // Makes gold blend into coins/globe

    points.forEach(p => {
        // Calculate distance to mouse
        let dx = mouse.x - p.x;
        let dy = mouse.y - p.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        // Push the point away if mouse is near
        if (dist < 200) {
            let force = (200 - dist) / 200;
            p.x = p.baseX - dx * force * 0.5;
            p.y = p.baseY - dy * force * 0.5;
        } else {
            // Gradually return to base position
            p.x += (p.baseX - p.x) * 0.1;
            p.y += (p.baseY - p.y) * 0.1;
        }

        // Draw the point
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#dfcaa7';
        ctx.fill();
    });

    // Draw connecting lines to form the "Network"
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            let dx = points[i].x - points[j].x;
            let dy = points[i].y - points[j].y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < spacing + 10) {
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}

init();
window.addEventListener('resize', init);
animate();

const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', function(e) {
    e.preventDefault(); // Stop the page from reloading
    
    const formData = new FormData(contactForm);
    
    fetch(contactForm.action, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        alert("Message sent successfully!");
        contactForm.reset(); // Clear the form
    })
    .catch(error => {
        console.error('Error!', error);
        alert("Something went wrong. Please try again.");
    });
});