export default class addProgressierUser{

    constructor () {
        this.userEmail = document.querySelector(".userlogin").innerHTML
        this.events()
    }

    events() {
        window.addEventListener('load', () => {
            this.consoleLog()
            this.addEmail()
        })
    }


    addEmail() {
        progressier.add({
            email: this.userEmail
        })
    }

    consoleLog() {
        console.log("logged in")
    }
}

