let uploadSection = document.getElementById("ul-section");
let downloadSection = document.getElementById("dl-section");
let uploadViewButton = document.getElementById("ul-view");
let downloadViewButton = document.getElementById("dl-view");

history.replaceState({'location':'landing'},'');

uploadViewButton.onclick = (e)=>{
    e.preventDefault();
    hideMessages();
    history.pushState({'location':'landing'},'','/');
    navigateToLanding();
}

downloadViewButton.onclick = (e)=>{
    e.preventDefault();
    hideMessages();
    history.pushState({'location':'download'},'','/#download');
    navigateToDownload();
}

function navigateToLanding(){
    uploadSection.style.display="block";
    downloadSection.style.display="none";
    downloadViewButton.style.display = "block";
    uploadViewButton.style.display = "none";
}

function navigateToDownload(){
    uploadSection.style.display="none";
    downloadSection.style.display="block";
    downloadViewButton.style.display = "none";
    uploadViewButton.style.display = "block";
}

window.addEventListener('popstate',(event)=>{
    hideMessages();
    if(event.state.location =="landing"){
        navigateToLanding();
    }
    else if(event.state.location =="download"){
        navigateToDownload();
    }
})

let input = document.getElementById("file-input");
let maxSizeMB = 20;
let maxFileSize = maxSizeMB*1024*1024;
input.onchange = function(){
    hideMessages();
    if(this.files[0] && this.files[0].size > maxFileSize){
        let errorMsg = "Selected file exceeds max size";
        showAlert(errorMsg);
        this.value = "";
    }
}

const msgBox = document.getElementById("msg-box");
const linkDisplayBox = document.getElementById("link-text");
const linkTextInput = document.getElementById("dl-link");

function showAlert(msg){
    if(!msg){
        msg = "An error occurred. Please try again";
    }    
    msgBox.innerHTML = msg;
    msgBox.style.display = "block"
    msgBox.style.color = "red";
}

function hideMessages(){
    msgBox.style.display = "none";
    linkDisplayBox.style.display = "none";
}

function showMessage(msg, type="alert"){
    if(type=="alert"){
        showAlert(msg);
        return;
    }
    msgBox.innerHTML = msg;
    msgBox.style.display="block"
    msgBox.style.color = (type=="success")? "purple" : "black";
    msgBox.style.fontStyle = (type=="success")? "italic" : "normal";
}

function showLink(link){
    linkDisplayBox.innerHTML = link;
    linkDisplayBox.style.display = "block";
}

document.getElementById("ul-btn").onclick = async (e)=>{
    let formData = new FormData();
    let file = input.files[0];
    formData.append("user-file",file);
    let response = await fetch("/upload",{
        method:"POST",
        body:formData
    });
    let result = await response.json();
    if(result.error){
        showMessage(error.msg,"alert");
        return;
    }
    let downLink = result.downLink;
    let msg = "File uploaded successfully. Download link:";

    showMessage(msg,"success");
    showLink(downLink);
}

document.getElementById("dl-btn").onclick = async (e)=>{
    hideMessages();
    let linkText = linkTextInput.value;
    let linkIsValid = validateLink(linkText);
    if(!linkIsValid){
        showMessage("Invalid link entered!", "alert");
        return;
    }    
    let response = await fetch(linkText);
    if(response.status!=200){
        let result = await response.json();
        let errorMsg = result.error ? result.error.msg : "Oops! An error occurred. Please try again";
        showMessage(errorMsg, "alert");
        return;
    }
    let fileBlob = await response.blob();
    let tempElem = document.createElement('a');
    tempElem.href = window.URL.createObjectURL(fileBlob);
    tempElem.style.display = "none";
    tempElem.download = response.headers.get('Content-Disposition').split('filename=')[1];
    document.body.appendChild(tempElem);
    tempElem.click();
    tempElem.remove();
}

function validateLink(linkText){
    const baseURL = "localhost:3000/download/";
    if(!linkText || ( linkText.indexOf(baseURL) == -1))
        return false;
    if( linkText.slice( linkText.indexOf(baseURL) + 24).length != 21 ) //nanoid length
        return false;
    return true;
}