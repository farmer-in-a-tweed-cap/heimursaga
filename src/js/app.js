// Global
import "./modules/bootstrap";
import "./modules/theme";
import "./modules/dragula";
import "./modules/feather";
import "./modules/moment";
import "./modules/sidebar";
import "./modules/notyf";
import "./modules/filepond"

import Map from "./modules/mapbox";
if (document.querySelector("#map")) {new Map()};

import Search from './modules/search';
if (document.querySelector(".header-search-icon")) {new Search()};

import Notification from "./modules/notification";
if (document.querySelector("#user-notifications")) {new Notification()};

import Highlight from './modules/highlight'
if (document.querySelector("#highlight-button")) {new Highlight()};

import Bookmark from './modules/bookmark'
if (document.querySelector("#bookmark-button")) {new Bookmark()};

import Follow from './modules/follow'
if (document.querySelector("#follow-button")) {new Follow()};

import Flag from './modules/flag'
if (document.querySelector("#flag-button")) {new Flag()};


// Charts
import "./modules/chartjs";
import "./modules/apexcharts";

// Forms
import "./modules/daterangepicker"; // requires jQuery
import "./modules/datetimepicker"; // requires jQuery
import "./modules/fullcalendar";
import "./modules/mask"; // requires jQuery
import "./modules/quill";
import "./modules/select2"; // requires jQuery
import "./modules/validation"; // requires jQuery
import "./modules/wizard"; // requires jQuery

// Maps
import "./modules/vector-maps";


// Tables
import "./modules/datatables"; // requires jQueryimport app from "../../app";

