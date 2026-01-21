fetch("common/header.html")
    .then(res => res.text())
    .then(data => document.getElementById("header").innerHTML = data);

fetch("common/footer.html")
    .then(res => res.text())
    .then(data => document.getElementById("footer").innerHTML = data);