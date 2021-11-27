import axios from 'axios'

export default class Like {
    constructor() {
        this.likeButton = document.querySelector("#like-button")
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.entryId = document.querySelector("#entry-id").value
        this.hasVisitorLiked = document.querySelector("#has-liked").value
        this.heartIcon = document.querySelector("#heart-icon")
        this.likeCount = document.querySelector("#like-count")
        this.waitTimer
        this.events()
    }

    events() {
        this.likeButton.addEventListener("click", (e) => {
            e.preventDefault()
            this.buttonClickHandler()
        })   
    }

    buttonClickHandler() {

        if (document.querySelector("#heart-icon").style.fill == "rgb(60, 115, 170)"){

            this.changeRed()
            this.likeCount.innerText = parseInt(document.querySelector("#like-count").innerText)+1
            this.waitTimer = setTimeout(() => this.sendAddRequest(), 750)

        } else {

            this.changeBlue()
            this.likeCount.innerText = parseInt(document.querySelector("#like-count").innerText)-1
            this.waitTimer = setTimeout(() => this.sendRemoveRequest(), 750)


        }
    }

    sendAddRequest() {
        axios.post(`/addLike/${this.entryId}`, {_csrf: this._csrf, id: this.entryId}).then(() => {
            console.log('successfully liked')
        })
    }

    sendRemoveRequest() {
        axios.post(`/removeLike/${this.entryId}`, {_csrf: this._csrf, id: this.entryId}).then(() => {
            console.log('like removed')
        })
    }

    changeRed() {
        document.querySelector("#heart-icon").style.fill = "#d9534f"
        document.querySelector("#heart-icon").style.stroke = "#d9534f"
        document.querySelector("#like-count").classList.remove("text-blue")
        document.querySelector("#like-count").classList.add("text-danger")

    }

    changeBlue() {
        document.querySelector("#heart-icon").style.fill = "#3C73AA"
        document.querySelector("#heart-icon").style.stroke = "#3C73AA"
        document.querySelector("#like-count").classList.remove("text-danger")
        document.querySelector("#like-count").classList.add("text-blue")

    }

}
