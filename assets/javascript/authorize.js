function showAuthorizeForm() {
    // Скрываем все формы
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    // Показываем авторизацию
    document.querySelector('.authorize-form').classList.add('active');
}

function showRegisterForm() {
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelector('.register-form').classList.add('active');
}

function showForgotPasswordForm() {
    document.querySelectorAll('.form').forEach(form => {
        form.classList.remove('active');
    });
    document.querySelector('.recovery-form').classList.add('active');
}


class AuthService {
    static API_BASE_URL = 'http://localhost:5091/api/Credential'; // ← порт 5001!

    static async login() {
        const loginInput = document.getElementById('loginAuthorize');
        const passwordInput = document.getElementById('passwordAuthorize');
        
        const login = loginInput.value;
        const password = passwordInput.value;

        console.log("Sending request to:", `${this.API_BASE_URL}/login`);

        try {
            const response = await fetch(`${this.API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    login: login,
                    password: password
                })
            });

            console.log("Response status:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Login failed:", response.status, errorText);

                return;
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log("Login successful:", data);
            } else {
                
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Login error: " + error.message);
        }
    }
}