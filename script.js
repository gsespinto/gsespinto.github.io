let previewWrapper = document.querySelector(".previews-wrapper");
window.addEventListener("resize", addWrapperClass);
addWrapperClass();

function addWrapperClass(){
    if (!previewWrapper){
        return;
    }
    
    let w = window.innerWidth;
    previewWrapper.classList.remove("mobile-wrapper");
    previewWrapper.classList.remove("desktop-wrapper");
    
    if (w <= 1080){
        previewWrapper.classList.add("mobile-wrapper");
    } else {
        previewWrapper.classList.add("desktop-wrapper");
    }
}