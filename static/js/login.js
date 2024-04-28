// Input Fields
const loginNicknameInput = document.getElementById("nicknameInput");
const loginPasswordInput = document.getElementById("passwordInput");

// Buttons
const loginNotesBtn = document.getElementById("notesBtn");
const loginLoginBtn = document.getElementById("loginBtn");
const loginSignupBtn = document.getElementById("signupBtn");

// Go to main page if user is already logged in
if (localStorage.getItem('accessToken') != null)
    window.location.href = '/';

// Goto main page (notes.html)
loginNotesBtn.onclick = function(){
    window.location.href = '/';
}

// Goto login page (login.html)
loginSignupBtn.onclick = function(){
    window.location.href = 'signupPage';
}

loginLoginBtn.onclick = function(){
    var nicknameText = String(loginNicknameInput.value);
    var passwordText = String(loginPasswordInput.value);

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            nickname: nicknameText, 
            password: passwordText
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem('accessToken', data.access_token);
            console.log('Login successful');
            // Теперь можно безопасно вызывать защищённый роут
            fetchProtectedData(data.access_token);
        } else {
            console.error('Login failed:', data);
        }
    })
    .catch(error => console.error('Error during login:', error));
}

function fetchProtectedData(token) {
    fetch('/protected', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        const userData = parseJwt(token);
    })    
    .catch(error => console.error('Error fetching protected data:', error));
    if (token != null)
        window.location.href = '/';
}

function parseJwt(token) {
    var base64Url = token.split('.')[1]; // Получение payload части токена
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
