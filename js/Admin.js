const signUpButton = document.getElementById('signUpLink');
const signInButton = document.getElementById('signInLink');
const container = document.getElementById('container');

signUpButton.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.add("right-panel-active");
});

signInButton.addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.remove("right-panel-active");
});
