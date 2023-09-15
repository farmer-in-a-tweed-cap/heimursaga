// Usage: https://github.com/Grsmto/simplebar
import SimpleBar from "simplebar";

document.addEventListener("DOMContentLoaded", () => {

  const sidebarElement = document.getElementsByClassName("sidebar")[0];
  const sidebarToggleElement = document.getElementsByClassName("sidebar-toggle")[0];

  /*if (localStorage.getItem("displaySidebar") == "false") {
    sidebarElement.classList.toggle("collapsed")
  }*/

  const simpleBarElement = document.getElementsByClassName("js-simplebar")[0];
  
  if(simpleBarElement){
    /* Initialize simplebar */
    new SimpleBar(document.getElementsByClassName("js-simplebar")[0])
  
  
    sidebarToggleElement.addEventListener("click", () => {
      if (localStorage.getItem("displaySidebar") == "false") {
        localStorage.setItem("displaySidebar", "true")
        sidebarElement.classList.toggle("collapsed")
      } else {
        localStorage.setItem("displaySidebar", "false")
        sidebarElement.classList.toggle("collapsed")
      }

  
      sidebarElement.addEventListener("transitionend", () => {
        window.dispatchEvent(new Event("resize"));
      });
    });
  }

});