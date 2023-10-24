import axios from 'axios'
import RelativeTime from '@yaireo/relative-time'
import { once } from 'stream'

export default class Notification {
    constructor() {
        this.userNotificationsPane = document.querySelector("#user-notifications")
        this.openIcon = document.querySelector('#alertsDropdown')
        this.username = document.querySelector("#navbar-username").innerText
        this._csrf = document.querySelector('[name="_csrf"]').value
        this.notificationIndicator = document.querySelector("#indicator")
        this.retrieveNotifications()
        //this.injectHTML()
        this.notificationList = document.querySelector('.notification-list')
        this.events()
    }

    // Events
    events() {
        this.openIcon.addEventListener("click", () => this.setTimeout(), {once: true})

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
            document.querySelector('.indicator').removeAttribute('hidden')
            document.querySelector('.indicator').innerHTML = `${unreadNotificationCount}`
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
                }  else if (notification.type === "follow"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> followed you. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
                            </li>`
                } else if (notification.type === "highlight"){
                    return `<li class="list-group-item">
                            <a href="/journal/${notification.actor}"style="text-decoration: none;"><strong>${notification.actor}</strong></a> has highlighted your entry <a href="/entry/${notification.action[1]}"style="text-decoration: none;"><i>${notification.action[0]}</a></i>. </br><small>${relativeTime.from(new Date(notification.createdDate))}</small><br/>
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
        if (document.querySelector("#alertsDropdown").offsetHeight > 5) {
            axios.post(`/notifications/${this.username}/markasread`, {_csrf: this._csrf, username: this.username}).then(() => {
                console.log("marked as read")
            })
        }
    }

}

