
// Input Fields
const signupNicknameInput = document.getElementById("nicknameInput");
const signupPasswordInput = document.getElementById("passwordInput");

// Buttons
const signupNotesBtn = document.getElementById("notesBtn");
const signupLoginBtn = document.getElementById("loginBtn");
const signupSignupBtn = document.getElementById("signupBtn");

// Go to main page if user is already logged in
if (localStorage.getItem('accessToken') != null)
    window.location.href = '/';


// Goto main page (notes.html)
signupNotesBtn.onclick = function(){
    window.location.href = '/';
}

// Goto login page (login.html)
signupLoginBtn.onclick = function(){
    window.location.href = 'loginPage';
}

// Sign up button
signupSignupBtn.onclick = function(){
    var nicknameText = String(signupNicknameInput.value).trim();
    var passwordText = String(signupPasswordInput.value).trim();

    if (nicknameText.length < 4){
        alert("Your nickname must be at least 4 characters!");
        return;
    }

    if (passwordText.length < 8){
        alert("Password must be at least 8 characters!");
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            nickname: nicknameText, 
            password: passwordText
        })
    }).then(response => response.json()).catch(error => console.error('Error loading the notes:', error));

    
}


