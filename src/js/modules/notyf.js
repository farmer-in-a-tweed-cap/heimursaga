// Usage: https://github.com/caroso1222/notyf
import { Notyf } from "notyf";


var blue = '#3C73AA'
var green = '#409e72'
var red = '#ac4946'
var copper = '#AC6D46'


window.notyf = new Notyf({
  duration: 3000,
  position: {
    x: "right",
    y: "top"
  },
  dismissible: true,
  types: [
    {
      type: "default",
      backgroundColor: "#3B7DDD",
      icon: {
        className: "notyf__icon--success",
        tagName: "i",
      }
    },
    {
      type: "success",
      backgroundColor: green,
      icon: {
        className: "notyf__icon--success",
        tagName: "i",
      }
    },
    {
      type: "warning",
      backgroundColor: red,
      icon: {
        className: "notyf__icon--error",
        tagName: "i",
      }
    },
    {
      type: "error",
      backgroundColor: red,
      icon: {
        className: "notyf__icon--error",
        tagName: "i",
      }
    }
  ]
});

const successMessage = document.getElementById('success-message')
const errorMessage = document.getElementById('error-message')

if (successMessage) {
  window.notyf.success(successMessage.textContent);
} else if (errorMessage) {
  window.notyf.error(errorMessage.textContent);
}