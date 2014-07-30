// Copyright (c) 2012, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

// Pull new data from the API
function fetch_reviews() {
    chrome.storage.sync.get("api_key", function(data) {
        var api_key = data.api_key;
        if (!api_key) {
            // If the API key isn't set, we can't do anything
            chrome.browserAction.setBadgeText({text: "!"});
        } else {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                // Parse the JSON
                var json = xhr.responseText;
                json = JSON.parse(json);

                // Set the review count
                set_review_count(json.requested_information.reviews_available);

                // Set the next review date
                var next_review = parse_next_review(json.requested_information.next_review_date);
                set_next_review(next_review);

                // Schedule the next refresh
                if (next_review > Date.now()) {
                    // Refresh when it's time to study
                    chrome.alarms.create("refresh", {when: next_review} );
                    chrome.alarms.get("refresh", function(alarm) {
                        var d = new Date(alarm.scheduledTime);
                        console.log("Refreshing at: " + d);
                    });
                } else {
                    // Refresh at the specified interval.
                    chrome.storage.sync.get("update_interval", function(data) {
                        if (!data.update_interval) {
                            chrome.storage.sync.set({"update_interval": 1});
                            data.update_interval = 1;
                        }
                        chrome.alarms.create("refresh", {delayInMinutes: data.update_interval} );
                        console.log("Refreshing in " + data.update_interval + " minute(s).");
                    });
                }
            };
            var url = "http://www.wanikani.com/api/v1.1/user/" + encodeURIComponent(api_key) + "/study-queue";
            xhr.open("GET", url);
            xhr.send();
        }
    });
}


function parse_next_review(datetime) {
    // WaniKani doesn't include milliseconds in next_review_date, so we need
    // to pad the datetime out to 13 characters
    if (String(datetime).length === 10) {
        return parseInt(String(datetime + "000"), 10) + 1;
    } else {
        return datetime;
    }
}

// Set the time of the next review.
function set_next_review(datetime) {
    var new_datetime = parse_next_review(datetime);
    chrome.storage.local.set({"next_review": new_datetime}, function() {
        update_title();
    });
}

// Set the number of reviews available and notify the user.
function set_review_count(reviews) {
    var should_notify = false;
    chrome.storage.local.get("reviews_available", function(data) {
        // If review count has increased, show a notification.
        if (typeof(data.reviews_available) === "undefined" ) {
            data.reviews_available = 0;
        }
        if (data.reviews_available < reviews) {
            should_notify = true;
        }
        chrome.storage.local.set({"reviews_available": reviews}, function() {
            // Update the badge.
            update_badge();
            // Show a notification if necessary.
            if (should_notify) {
                show_notification();
            }
        });
    });
}

// If notifications are enabled, display a notification.
function show_notification() {
    chrome.storage.sync.get("notifications", function(data) {
        if (data.notifications && data.notifications === "on") {
            var notification = webkitNotifications.createNotification(
              "icon_128.png",
              "WaniKani",
              "You have new reviews on WaniKani!"
            );
            notification.show();
        }
    });
}

// Update the badge text.
function update_badge() {
    chrome.storage.local.get("reviews_available", function(data) {
        if (data.reviews_available) {
            chrome.browserAction.setBadgeText({ text: String(data.reviews_available) });
        } else {
            chrome.browserAction.setBadgeText({ text: "" });
        }
    });
}

// Update the extension's title with the next review time.
function update_title() {
    chrome.storage.sync.get("api_key", function(data){
        var name = chrome.i18n.getMessage("wanikaninotify_name");
        if (data.api_key) {
            chrome.storage.local.get("next_review", function(data) {
                if (data.next_review > Date.now()) {
                    var d = new Date(data.next_review);
                    var new_title = name + " - Next Review: " + d.toString();
                    chrome.browserAction.setTitle({"title": new_title});
                } else {
                    chrome.browserAction.setTitle({"title": name + " - Next Review: Now!"});
                }
            });
        } else {
            chrome.browserAction.setTitle({"title": name + " - Click to add your API key!"});
        }
    });
}

// Open the options page on install.
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.tabs.create({url: "options.html"});
    }
});

// When the extension's icon is clicked:
chrome.browserAction.onClicked.addListener(function() {
    // If no API key is saved, redirect to the options page. Else open a tab to WaniKani.
    chrome.browserAction.getBadgeText({}, function(result) {
        if (result === "!") {
            chrome.tabs.create({url: "options.html"});
        } else {
            chrome.tabs.create({url: "https://www.wanikani.com"});
        }
    });
});

// When a "refresh" alarm goes off, fetch new data.
chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === "refresh") {
        fetch_reviews();
    }
});

// If the content page sends a message, update local data.
chrome.extension.onMessage.addListener(function (request) {
    if (typeof request.reviews_available !== "undefined" ) {
        set_review_count(request.reviews_available);
    }
});

fetch_reviews();
