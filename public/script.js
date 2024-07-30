let menuBar = document.getElementById('menubar')
let nav = document.querySelector('nav')
let navbg = document.querySelector('.navbg')
menuBar.addEventListener('click',() =>{
    menuBar.classList.toggle('fa-x')
    nav.classList.toggle('active')
    navbg.classList.toggle('active')
})


function searchProducts() {
    var input, filter, productList, products, i, txtValue;
    input = document.getElementById('searchInput');
    filter = input.value.toUpperCase();
    productList = document.getElementById("productList");
    products = productList.getElementsByClassName('product');
    for (i = 0; i < products.length; i++) {
        txtValue = products[i].textContent || products[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            products[i].style.display = "";
        } else {
            products[i].style.display = "none";
        }
    }
}


document.getElementById('my-product').addEventListener('click', function() {
    window.location.href = '/my-product';
});

function togglePopup(popupId) {
    var popup = document.getElementById(popupId);
    if (popup.style.display === "none" || popup.style.display === "") {
        popup.style.display = "block";
    } else {
        popup.style.display = "none";
    }
}


