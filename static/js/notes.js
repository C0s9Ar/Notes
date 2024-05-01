
// Inputs
const noteTitleInput = document.getElementById("noteTitle");
const noteTextInput = document.getElementById("noteText");

// Buttons
const noteAddBtn = document.getElementById("addBtn");

// Username/Login field
const noteUserInfoBox = document.getElementById("userInfo");

// Notes field
const noteList = document.getElementById("notes");

// Combobox
const noteCombobox = document.getElementById('combobox');
noteCombobox.insertAdjacentHTML("beforeend", `<option value="Everyone">Everyone</option>`);
//Filter
const noteFilterBtn = document.getElementById("filterBtn");
// Start date
const noteStartDate = document.getElementById("startDate");
// End date
const noteEndDate = document.getElementById("endDate");

var nickname = '';
var notesArray = [];
var usersArray = new Set();

var add = 0;
var elementDeleting = false;

// Filter properties
var filterName = "Everyone";
var filterStartDate = "";
var filterEndDate = "";

// Refresh access token
if (localStorage.getItem('accessToken') === 'undefined' || !localStorage.getItem('accessToken')) {
    localStorage.clear();
}
else {
    refreshToken();
}

// User info UI
loadUserInfo();
const noteLogoutBtn = document.getElementById("logoutBtn");
const noteSignupBtn = document.getElementById("signupBtn");
const noteLoginBtn = document.getElementById("loginBtn");


function render() {
    setMinMaxDate();
    noteList.innerHTML = "";

    // No notes
    if (notesArray.length === 0) {
        noteList.insertAdjacentHTML("beforeend",`<h2>There is no notes!</h2>`);
        return;
    }

    usersArray.clear();
    usersArray.add(filterName);
    usersArray.add("Everyone");
    noteCombobox.text = filterName;
    
    for (i = notesArray.length - 1; i >= 0; i--) {
        var appear = "";
        if ((i + 1 == notesArray.length) & (add)) {
            appear = "fade-in";
            add = 0;
        }

        // Add to users set
        usersArray.add(notesArray[i].author);

        // Filter notes by author
        if (notesArray[i].author != filterName && filterName != "Everyone") { continue; }

        // Filter notes by date
        if (!(notesArray[i].date >= filterStartDate || filterStartDate == '') || !(notesArray[i].date <= filterEndDate || filterEndDate == '')) {
            continue;
        }

        // Display Note
        let noteHTML = `
        <div class="noteBG ${appear}">
            <div class="note">
                <input class="inputTitleList" placeholder="Title" maxlength="35" readonly="1" value="${notesArray[i].title}">
                <textarea class="inputTextList" placeholder="Sample text" maxlength="400" readonly="1">${notesArray[i].text}</textarea>
                <input class="nicknameText" placeholder="Nickname" maxlength="35" readonly="1" value="${notesArray[i].author}">
                <h4 class="dateText">${notesArray[i].date}</h4>
        `;
        // Add edit and delete buttons for author
        if (localStorage.getItem('accessToken') !== null && notesArray[i].author === nickname) {
            if ((new Date(getCurrentDate()) - new Date(notesArray[i].date)) / (1000 * 60 * 60 * 24) < 1) {
                noteHTML += `<button data-index="${i}" class="editBtn listBtns">Edit</button>`;
            }
            noteHTML += `<button data-index="${i}" class="removeBtn listBtns">Delete</button>`;
        }

        noteHTML += `</div></div>`;
        noteList.insertAdjacentHTML("beforeend", noteHTML);
    }

    // Update users list
    noteCombobox.innerHTML = '';
    usersArray.forEach((user) => { noteCombobox.insertAdjacentHTML("beforeend", `<option value="${user}">${user}</option>` );});
}

// Remove shake effect from title input field
noteTitleInput.onclick = function() {
    noteTitleInput.classList.remove("shake"); 
    noteTitleInput.style.color = "#0F0F0F"; 
    noteTitleInput.placeholder = "Title";
}

noteList.onclick = function(event) {
    refreshToken();
    if (event.target.dataset.index === undefined) return;
    var element = event.target;
    var elementIndex = event.target.dataset.index;

    if (element.textContent === "Delete" && !elementDeleting) {
        elementDeleting = true;
        element = element.closest(".noteBG");
        element.innerHTML = "";
        element.style.height = "0px";
        element.style.margin = "0px auto";

        function attemptDelete() {
            fetch(`/delete_note/${notesArray[elementIndex].id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            })
            .then(response => {
                if (response.status === 401) {
                    attemptDelete();
                } else if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Failed to delete note');
                }
            })
            .then(() => {
                // Delete visual
                setTimeout(function() {
                    element.style.display = "none";
                    notesArray.splice(elementIndex, 1);
                    render();
                    elementDeleting = false;
                }, 1000);
            })
            .catch(error => console.error('Error:', error));
        }
        attemptDelete();
    } 
    else if (element.textContent === "Edit") {
        element.textContent = "Save";
        element = element.closest(".noteBG");
        var textField = element.querySelector("textarea");
        textField.readOnly = false;
        textField.focus();
    } 
    else if (element.textContent === "Save") {
        element.textContent = "Edit";
        element = element.closest(".noteBG");
        var textField = element.querySelector("textarea");
        notesArray[elementIndex].text = textField.value;
        textField.readOnly = true;

        function attemptUpdate() {
            fetch(`/update_note/${notesArray[elementIndex].id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    title: notesArray[elementIndex].title,
                    text: textField.value
                })
            })
            .then(response => {
                if (response.status === 401) {
                    attemptUpdate();
                } else if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                console.log('Update success:', data);
            })
            .catch(error => console.error('Error:', error));
        }
        attemptUpdate();
    }
};

// Create a note
noteAddBtn.onclick = function() {
    // Go to login page if user is undefined
    if (localStorage.getItem('accessToken') === null){
        window.location.href = 'loginPage';
        return;
    }
    // Empty title
    if (String(noteTitleInput.value).trim() === "") {
        noteTitleInput.placeholder = "Title mustn't be empty!";
        noteTitleInput.style.color = "red";
        noteTitleInput.classList.add("shake");
        noteTitleInput.value = "";
        return;
    }

    let note = {
        id: notesArray.length + 1,
        title: noteTitleInput.value.trim(),
        text: noteTextInput.value.trim(),
        author: getNickname(),
        date: getCurrentDate()
    }
    // Send the note to db
    fetch('/add_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            title: note.title, 
            text: note.text,
            author: note.author,
            date: note.date
        })
    }).then(response => response.json()).catch(error => console.error('Error loading the notes:', error));


    // Clear the note fields
    noteTitleInput.value = "";
    noteTextInput.value = "";
    add = 1;
    notesArray.push(note);
    render();
}

// Loads all the notes
document.addEventListener("DOMContentLoaded", function() {
    fetch('/get_notes')
    .then(response => response.json())
    .then(data => {
        const notesContainer = document.getElementById('notes');
        notesContainer.innerHTML = '';
        if (data.length != 0) {
            data.forEach(note => {
                let note_struct = {
                    id: note.id,
                    title: note.title,
                    text: note.text,
                    author: note.author,
                    date: note.date
                }
                notesArray.push(note_struct);
                render();
            });
        }
        render();
    }).catch(error => console.error('Error loading the notes:', error));
});

// Returns username from token
function getNickname() {
    if (!localStorage.getItem('accessToken')) {
        console.log('No token found');
        return null;
    }
    const base64Url = localStorage.getItem('accessToken').split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    return payload.sub; 
}


// Returns current date 2020-10-25
function getCurrentDate() {
    var currentDate = new Date();

    var year = currentDate.getFullYear();
    var month = ('0' + (currentDate.getMonth() + 1)).slice(-2);
    var day = ('0' + currentDate.getDate()).slice(-2);
    var formattedDate = year + '-' + month + '-' + day;
    return formattedDate;
}

// Applies filter to notes
noteFilterBtn.onclick = function(){
    filterStartDate = noteStartDate.value;
    filterEndDate = noteEndDate.value;
    filterName = noteCombobox.value;
    render();
}

// Sets max and min date limits
function setMinMaxDate(){
    var minDate;
    var maxDate;
    if (notesArray.length === 0){
        minDate = getCurrentDate();
        maxDate = getCurrentDate();
    }
    else {
        minDate = notesArray[0].date;
        maxDate = notesArray[notesArray.length - 1].date;
    }
    noteStartDate.min = minDate;
    noteStartDate.value = minDate;
    noteStartDate.max = maxDate;
    noteEndDate.min = minDate;
    noteEndDate.value = maxDate;
    noteEndDate.max = maxDate;
}


// Refresh access token 
function refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken === null) {
        console.error('Refresh token is missing');
    } else {
        fetch('/token/refresh', {
            method: 'POST',
            headers: {'Authorization': `Bearer ${refreshToken}`}
        })
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('accessToken', data.access_token);
        })
        .catch(error => console.error('Error:', error));
    }
}


// User session
if (noteLogoutBtn) {
    noteLogoutBtn.addEventListener('click', function() {
        localStorage.removeItem('accessToken'); 
        window.location.href = '/';
    });
}
if (noteSignupBtn) {
    noteSignupBtn.onclick = function() {
        window.location.href = 'signupPage';
    };
}
if (noteLoginBtn) { 
    noteLoginBtn.onclick = function() {
        window.location.href = 'loginPage'; 
    };
}

function loadUserInfo(){
    if (localStorage.getItem('accessToken') === null){
        noteUserInfoBox.insertAdjacentHTML("beforeend", `<button class="signupBtn" id="signupBtn" >Sign up</button> <button class="loginBtn" id="loginBtn" >Log in</button>`);
    }
    else {
        nickname = getNickname();
        noteUserInfoBox.insertAdjacentHTML("beforeend", `<h3>${nickname}</h3> <button class="loginBtn" id="logoutBtn" >Log out</button>`);
    }
}