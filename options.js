// Copyright (c) 2015, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

// Saves options to Chrome Sync.
function save_options() {
    var key_field = document.getElementById("api_key");
    var api_key = key_field.value;

    // Clear the storage so we don't persist old data.
    chrome.storage.sync.remove("api_key", function() {

        // Clear our local cached data
        chrome.storage.local.clear();

        // While we're at it, clear our refresh alarm as well.
        chrome.alarms.clear("refresh");

        // Test out the new api key.
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
            var json = xhr.responseText;
            json = JSON.parse(json);

            if (json.error) {
                // If there's an error, update the badge.
                chrome.browserAction.setBadgeText({text:"!"});
                // Also, notify the user.
                var status = document.getElementById("status");
                status.innerHTML = "Sorry, that API key isn't valid. Please try again!";
                setTimeout(function() {
                  status.innerHTML = "";
                }, 4000);
            } else {
                // Store the api key in Chrome Sync.
                chrome.storage.sync.set({"api_key": api_key}, function() {

                    // Update the badge, since we already have the json data
                    chrome.extension.getBackgroundPage().set_review_count(json.requested_information.reviews_available);

                    // Update the title
                    chrome.extension.getBackgroundPage().set_next_review(json.requested_information.next_review_date);

                    // Update status to let user know options were saved.
                    var status = document.getElementById("status");
                    status.innerHTML = "Your options have been saved. Thanks, " + String(json.user_information.username) + "!";
                    setTimeout(function() {
                    status.innerHTML = "";
                    }, 4000);
                });
            }
        };
        var url = "https://www.wanikani.com/api/v1.1/user/" + encodeURIComponent(api_key) + "/study-queue";
        xhr.open("GET", url);
        xhr.send();

    });

    // Save notification options.
    save_notifications();
    // Save update interval.
    save_update_interval();

    chrome.extension.getBackgroundPage().show_notification();

}

// Save update interval.
function save_update_interval() {
  var update_elem = document.getElementById("update_interval");
  chrome.storage.sync.set({"update_interval":parseInt(update_elem.value, 10)});
}

// Save notification options.
function save_notifications() {
    var notif_elems = document.getElementsByName("notifications");
    for (var i = 0; i < notif_elems.length; i++) {
        if (notif_elems[i].type === "radio" && notif_elems[i].checked) {
            chrome.storage.sync.set({"notifications":notif_elems[i].value});
            return;
        }
    }
}

// Restore all options to their form elements.
function restore_options() {
  restore_notifications();
  restore_update_interval();
  restore_api_key();
}

// Restore API key text box.
function restore_api_key() {
    chrome.storage.sync.get("api_key", function(data) {
        var api_key = data.api_key;
        // If no API key is stored, leave the text box blank.
        // We don't set a default value for the API key because it must be set
        // for the extension to work.
        if (!api_key) {
            return;
        }
        var key_field = document.getElementById("api_key");
        key_field.value = api_key;
    });
}

// Restore notification radio buttons.
function restore_notifications() {
    chrome.storage.sync.get("notifications", function(data) {
        var notifications = data.notifications;

        // If notifications hasn't been set yet, default it to off
        if (!notifications) {
            chrome.storage.sync.set({"notifications": "off"}, function () {
                document.getElementById("notif_off").checked = true;
            });
        } else {
            if (notifications === "on") {
                document.getElementById("notif_on").checked = true;
            } else if (notifications === "off") {
                document.getElementById("notif_off").checked = true;
            }
        }
    });
}

// Restore update interval dropdown.
function restore_update_interval() {
    chrome.storage.sync.get("update_interval", function(data) {
        if (!data.update_interval) {
            chrome.storage.sync.set({"update_interval": 1});
            data.update_interval = 1;
        }
        var update_elem = document.getElementById("update_interval");
        for (var i = 0; i < update_elem.options.length; i++) {
            if (parseInt(update_elem.options[i].value, 10) === data.update_interval) {
                update_elem.options[i].selected = true;
                return;
            }
        }
    });
}

function bind_save() {
    document.querySelector('#save').addEventListener('click', save_options);
}

document.addEventListener('DOMContentLoaded', restore_options);
document.addEventListener('DOMContentLoaded', bind_save);