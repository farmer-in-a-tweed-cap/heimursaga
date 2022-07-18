
export default class ShareButton {

    constructor() {
        this.shareButton = document.querySelector("#share-button")
        this.shareIcon = document.querySelector(".icon-heimursaga-share")
        this.permalink = document.querySelector("#share-button").value
        this.waitTimer
        this.events()
    }

    events() {
        this.shareButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.buttonClickHandler(this.permalink)
        })   
    }


      buttonClickHandler(text) {
        parent.window.notyf.success(`Entry permalink copied to clipboard`);
        this.changePrimary()
        if (!navigator.clipboard) {
              this.fallbackCopyTextToClipboard(text)
              return;
            }
            navigator.clipboard.writeText(text).then(function() {
              console.log('Async: Copying to clipboard was successful!')
            }, function(err) {
              console.error('Async: Could not copy text: ', err)
            })
          }
    

    fallbackCopyTextToClipboard(text) {
        this.textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
      
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
      
        try {
          var successful = document.execCommand('copy');
          var msg = successful ? 'successful' : 'unsuccessful';
          console.log('Fallback: Copying text command was ' + msg);
        } catch (err) {
          console.error('Fallback: Oops, unable to copy', err);
        }
      
        document.body.removeChild(textArea);
      }



    changePrimary() {
      document.querySelector(".icon-heimursaga-share").style.color = "#AC6D46"
      document.querySelector(".share-label").removeAttribute('hidden', true)

    }

}
