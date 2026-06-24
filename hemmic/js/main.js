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