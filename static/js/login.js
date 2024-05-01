// Input Fields
const loginNicknameInput = document.getElementById("nicknameInput");
const loginPasswordInput = document.getElementById("passwordInput");

// Buttons
const loginNotesBtn = document.getElementById("notesBtn");
const loginLoginBtn = document.getElementById("loginBtn");
const loginSignupBtn = document.getElementById("signupBtn");

// Error message
const signupErrorMsg = document.getElementById("signupErrorMsg");

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
    var nicknameText = String(loginNicknameInput.value).trim();
    var passwordText = String(loginPasswordInput.value).trim();

    if (nicknameText === ''){
        displayErrorMSG("Nickname must not be empty!");
        return;
    }
    if (passwordText === ''){
        displayErrorMSG("Password must not be empty!");
        return;
    }

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
            localStorage.setItem('refreshToken', data.refresh_token);
            console.log('Login successful');
            fetchProtectedData(data.access_token);
            return;
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
    .then(parseJwt(token))    
    .catch(error => console.error('Error fetching protected data:', error));
    if (token != null){
        window.location.href = '/';
    }
    else {
        displayErrorMSG("Your nickname or password is incorrect!");
    }
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function displayErrorMSG(msg){
    signupErrorMsg.style.display = "block";
    signupErrorMsg.innerHTML = msg;
    signupErrorMsg.classList.add("shake");
}