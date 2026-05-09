const API_URL = "http://localhost:5000";

let allPhotos = [];
let currentCategory = "";

/* ==========================================
   LOAD ALBUMS
========================================== */

async function loadAlbums() {

    currentCategory = "";

    const title = document.getElementById("dynamicTitle");
    const backBtn = document.getElementById("backBtn");
    const uploadBtn = document.getElementById("uploadActionBtn");

    const listView = document.getElementById("albumListView");
    const detailView = document.getElementById("albumDetailView");

    if (listView) listView.style.display = "block";
    if (detailView) detailView.style.display = "none";

    if (title) title.innerText = "MANAGE PORTFOLIO";
    if (backBtn) backBtn.style.display = "none";
    if (uploadBtn) uploadBtn.style.display = "inline-block";

    try {

        const res = await fetch(`${API_URL}/api/portfolio`);
        allPhotos = await res.json();

        const albumGrid = document.getElementById("albumGrid");
        if (!albumGrid) return;

        albumGrid.innerHTML = "";

        const categories = [...new Set(allPhotos.map(p => p.category))];

        if (categories.length === 0) {
            albumGrid.innerHTML =
                "<p style='grid-column:1/-1;text-align:center;padding:50px;'>No albums found.</p>";
            return;
        }

        categories.forEach(cat => {

            const cover = allPhotos.find(p => p.category === cat);

            const card = document.createElement("div");
            card.className = "album-card";

            card.innerHTML = `
                <div class="album-image-wrapper">
                    <img src="${getFullImageUrl(cover.image)}" alt="${cat}">
                </div>

                <div class="album-info">
                    <h3>${cat}</h3>
                </div>
            `;

            card.onclick = () => openAlbum(cat);

            albumGrid.appendChild(card);
        });

    } catch (err) {

        console.error("Album Load Error:", err);

    }
}


/* ==========================================
   OPEN ALBUM
========================================== */

async function openAlbum(category) {

    currentCategory = category;

    const listView = document.getElementById("albumListView");
    const detailView = document.getElementById("albumDetailView");

    const grid = document.getElementById("photosGrid");
    if (!grid) return;

    const title = document.getElementById("dynamicTitle");
    const backBtn = document.getElementById("backBtn");
    const uploadBtn = document.getElementById("uploadActionBtn");

    if (title) title.innerText = category.toUpperCase();
    if (backBtn) backBtn.style.display = "inline-block";
    if (uploadBtn) uploadBtn.style.display = "none";

    listView.style.display = "none";
    detailView.style.display = "block";

    const photos = allPhotos.filter(p => p.category === category);

    grid.innerHTML = "";

    if (photos.length === 0) {

        grid.innerHTML =
            "<p style='text-align:center;padding:50px;'>No photos found in this category.</p>";

        return;
    }

    photos.forEach(photo => {

        const card = document.createElement("div");
        card.className = "photo-box";

        card.innerHTML = `
            <img src="${getFullImageUrl(photo.image)}" loading="lazy">

            <div class="photo-actions">
                <button class="edit-btn">EDIT</button>
                <button class="delete-btn">DELETE</button>
            </div>
        `;

        const editBtn = card.querySelector(".edit-btn");
        const deleteBtn = card.querySelector(".delete-btn");

        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            promptEdit(photo._id, photo.category);
        });

        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deletePhoto(photo._id);
        });

        grid.appendChild(card);

    });

}


/* ==========================================
   BACK BUTTON
========================================== */

function goBackToAlbums() {

    loadAlbums();

}


/* ==========================================
   DELETE PHOTO
========================================== */

window.deletePhoto = async function (id) {

    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {

        const res = await fetch(`${API_URL}/api/portfolio/${id}`, {
            method: "DELETE"
        });

        if (res.ok) {

            await fetchAllData();

            if (currentCategory) {

                const remaining = allPhotos.filter(p => p.category === currentCategory);

                remaining.length > 0
                    ? openAlbum(currentCategory)
                    : loadAlbums();

            } else {

                loadAlbums();

            }

        }

    } catch (err) {

        alert("Delete failed. Backend connection problem.");

    }

};


/* ==========================================
   EDIT CATEGORY
========================================== */

window.promptEdit = async function (id, oldCategory) {

    const newCategory = prompt("Update Category Name:", oldCategory);

    if (!newCategory || newCategory.trim() === "" || newCategory === oldCategory)
        return;

    try {

        const res = await fetch(`${API_URL}/api/portfolio/${id}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                category: newCategory.trim()
            })

        });

        if (res.ok) {

            await fetchAllData();
            loadAlbums();

        }

    } catch (err) {

        alert("Update failed!");

    }

};


/* ==========================================
   UPLOAD FORM
========================================== */

document.getElementById("albumForm")?.addEventListener("submit", async (e) => {

    e.preventDefault();

    let category = document.getElementById("albumCategory").value;

    const otherCategory =
        document.getElementById("otherCategoryInput")?.value;

    const files = document.getElementById("photoInput").files;

    const uploadBtn = document.getElementById("uploadBtn");

    if (category === "Other" && otherCategory) {

        category = otherCategory.trim();

    }

    if (!category || files.length === 0) {

        alert("Please select category and photos.");
        return;

    }

    uploadBtn.innerText = "Uploading...";
    uploadBtn.disabled = true;

    const formData = new FormData();

    formData.append("category", category);

    for (let i = 0; i < files.length; i++) {

        formData.append("image", files[i]);

    }

    try {

        const res = await fetch(`${API_URL}/api/portfolio/upload`, {

            method: "POST",
            body: formData

        });

        if (res.ok) {

            alert("Upload successful 🎉");

            toggleModal(false);

            await fetchAllData();
            loadAlbums();

        } else {

            alert("Upload failed.");

        }

    } catch (err) {

        alert("Server error.");

    } finally {

        uploadBtn.innerText = "UPLOAD ALL";
        uploadBtn.disabled = false;

    }

});


/* ==========================================
   HELPER FUNCTIONS
========================================== */

async function fetchAllData() {

    try {

        const res = await fetch(`${API_URL}/api/portfolio`);
        allPhotos = await res.json();

    } catch (e) {

        console.error("Fetch Error:", e);

    }

}


function getFullImageUrl(dbPath) {

    if (!dbPath) return "";

    return `${API_URL}/${dbPath.replace(/\\/g, "/")}`;

}


/* ==========================================
   PAGE LOAD
========================================== */

window.onload = loadAlbums;