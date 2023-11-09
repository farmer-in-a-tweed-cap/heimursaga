import axios from 'axios'
import RelativeTime from '@yaireo/relative-time'

export default class Notification {
    constructor() {
        this.userNotificationsPane = document.querySelector("#user-notifications")
        this.userNotificationsPaneLg = document.querySelector("#user-notifications-lg")
        this.openIcon1 = document.querySelector('#alertsDropdown1')
        this.openIcon2 = document.querySelector('#alertsDropdown2')
        this.username = document.querySelector("#navbar-username").innerText
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.notificationIndicator = document.querySelector("#indicator")
        this.retrieveNotifications()
        this.notificationList = document.querySelector('.notification-list')
        this.events()
    }

    // Events
    events() {
        this.openIcon1.addEventListener("click", () => this.setTimeout(), {once: true})
        this.openIcon2.addEventListener("click", () => this.setTimeout(), {once: true})

    }

    // Methods

    retrieveNotifications() {
        axios.post(`/notifications/${this.username}`, {_csrf: this._csrf, username: this.username}).then(response => {
            this.injectHTML(response.data)
        }).catch(() => {
            alert("request for notifications failed")
        })
    }


    injectHTML(notifications) {
        let unreadNotificationCount = 0;
        for (let i = 0; i < notifications.length; i++) {
        if (notifications[i].isRead === false) unreadNotificationCount++;
        }


        if (unreadNotificationCount > 0) {
            document.querySelector('#indicator1').removeAttribute('hidden')
            document.querySelector('#indicator1').innerHTML = `${unreadNotificationCount}`
            document.querySelector('#indicator2').removeAttribute('hidden')
            document.querySelector('#indicator2').innerHTML = `${unreadNotificationCount}`

        }

        var relativeTime = new RelativeTime()
        this.userNotificationsPane.innerHTML = `
        <div class="dropdown-menu-header">
        ${unreadNotificationCount} New Notifications
        </div>
            <div class="notification-list"></div>
            <ul class="list-group list-group-flush">
            ${notifications.map(function(notification) {
                if (notification.type === "follow" && notification.isRead === false){
                    return `<li class="list-group-item list-group-item-secondary">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> followed you. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "highlight" && notification.isRead === false){
                    return `<li class="list-group-item list-group-item-secondary">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has highlighted your entry <a href="/entry/${notification.action[1]}"style="text-decoration: none;"><i>${notification.action[0]}</a></i>. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "sponsor" && notification.action[1] === "one-time-payment" && notification.isRead === false){
                    return `<li class="list-group-item list-group-item-secondary">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has sponsored you with a single payment of $${notification.action[0]}. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "sponsor" && notification.action[1] === "subscription" && notification.isRead === false){
                    return `<li class="list-group-item list-group-item-secondary">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has sponsored you with a ${notification.action[0]} subscription. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                }  else if (notification.type === "follow"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> followed you. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "highlight"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has highlighted your entry <a href="/entry/${notification.action[1]}"style="text-decoration: none;"><i>${notification.action[0]}</a></i>. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "sponsor" && notification.action[1] === "one-time-payment"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has sponsored you with a single payment of $${notification.action[0]}. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "sponsor" && notification.action[1] === "subscription"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has sponsored you with a ${notification.action[0]} subscription. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                }

            }).join('')}

            
            </ul>
        <!--<div class="dropdown-menu-footer">
            <a href="#" class="text-muted">Show all notifications</a>
        </div>-->`

        this.userNotificationsPaneLg.innerHTML = `
        <div class="dropdown-menu-header">
        ${unreadNotificationCount} New Notifications
        </div>
            <div class="notification-list"></div>
            <ul class="list-group list-group-flush">
            ${notifications.map(function(notification) {
                if (notification.type === "follow" && notification.isRead === false){
                    return `<li class="list-group-item list-group-item-secondary">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> followed you. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "highlight" && notification.isRead === false){
                    return `<li class="list-group-item list-group-item-secondary">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has highlighted your entry <a href="/entry/${notification.action[1]}"style="text-decoration: none;"><i>${notification.action[0]}</a></i>. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "sponsor" && notification.action[1] === "one-time-payment" && notification.isRead === false){
                    return `<li class="list-group-item list-group-item-secondary">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has sponsored you with a single payment of $${notification.action[0]}. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "sponsor" && notification.action[1] === "subscription" && notification.isRead === false){
                    return `<li class="list-group-item list-group-item-secondary">
                            New sponsorship! <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has sponsored you with a ${notification.action[0]} subscription. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                }  else if (notification.type === "follow"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> followed you. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "highlight"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has highlighted your entry <a href="/entry/${notification.action[1]}"style="text-decoration: none;"><i>${notification.action[0]}</a></i>. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "sponsor" && notification.action[1] === "one-time-payment"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has sponsored you with a single payment of $${notification.action[0]}. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "sponsor" && notification.action[1] === "subscription"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has sponsored you with a ${notification.action[0]} subscription. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                }

            }).join('')}

            
            </ul>
        <!--<div class="dropdown-menu-footer">
            <a href="#" class="text-muted">Show all notifications</a>
        </div>-->`
    }

    setTimeout() {
            setTimeout(() => {
                this.markNotificationsAsRead()
            }, 3000)
    }

    markNotificationsAsRead() {
            axios.post(`/notifications/${this.username}/markasread`, {_csrf: this._csrf, username: this.username}).then(() => {
                console.log("marked as read")
            })
    }

}

