function showRegisterForm() {
    const form = document.getElementById();
    form.style.display("none");
    document.querySelector('.container').classList.add('show-register');
}

function showAuthorizeForm() {
    document.querySelector('.container').classList.remove('show-register');
}

function TryRegisterCredential() {
    const text = document.getElementsByClassName("success-message");
    console.log(text);
    for (let i = 0; i < text.length; i++) {
        text[i].style.display = text[i].style.display == "none" ? "block" : "none";
    }
}