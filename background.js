// Copyright (c) 2015, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

var REFRESH_ALARM = 'refresh';

// Pull new data from the API
function fetch_reviews() {
    chrome.storage.sync.get("api_key", function(data) {
        var api_key = data.api_key;
        if (!api_key) {
            // If the API key isn't set, we can't do anything
            update_title('Click here to enter your API key.');
            update_badge('!');
        } else {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                // Parse the JSON
                var json = xhr.responseText;
                json = JSON.parse(json);

                if (json.requested_information.vacation_date) {
                    set_vacation_date(json.requested_information.vacation_date);
                } else {
                    // Set the number of items that need reviewing
                    set_review_count(json.requested_information.reviews_available);

                    // Set the next review date
                    set_next_review(json.requested_information.next_review_date);
                }
            };
            var url = "https://www.wanikani.com/api/v1.4/user/" + encodeURIComponent(api_key) + "/study-queue";
            xhr.open("GET", url);
            xhr.send();
        }
    });
}

function parse_wanikani_date(datetime) {
    // WaniKani doesn't include milliseconds in next_review_date, so we need
    // to pad the datetime out to 13 characters
    if (String(datetime).length === 10) {
        return parseInt(String(datetime + "000"), 10) + 1;
    }
    return datetime;
}

// Set the time of the next review.
function set_next_review(datetime) {
    var new_datetime = parse_wanikani_date(datetime);
    chrome.storage.local.set({'next_review': new_datetime}, function() {
        // Set the title of the extension
        update_title('date', new_datetime);
        if (new_datetime > Date.now()) {
            // Refresh when it's time to study
            set_one_time_alarm(new_datetime);
        } else {
            set_repeating_alarm();
        }
    });
}

function set_vacation_date(datetime) {
    var new_datetime = parse_wanikani_date(datetime);
    chrome.storage.local.set({'vacation_date': new_datetime}, function() {
        // If vacation date is active, refresh on interval to see if it goes away
        if (new_datetime) {
            update_badge(0);
            update_title('string', 'Vacation mode is set');
            // Refresh at the specified interval.
            set_repeating_alarm();
        }
    });
}

// Set the number of reviews available and notify the user.
function set_review_count(newReviewCount) {
    chrome.storage.local.get('reviews_available', function(data) {
        var oldReviewCount = data.reviews_available;
        chrome.storage.local.set({"reviews_available": newReviewCount}, function() {
            update_badge(newReviewCount);
            if (newReviewCount > (oldReviewCount || 0)) {
                show_notification();
            }
        });
    });
}

function set_repeating_alarm() {
    chrome.storage.sync.get('update_interval', function(data) {
        if (!data.update_interval) {
            chrome.storage.sync.set({'update_interval': 1});
            data.update_interval = 1;
        }
        chrome.alarms.create(REFRESH_ALARM, {
            delayInMinutes: data.update_interval
        });
        console.log('Refreshing in ' + data.update_interval + ' minute(s).');
    });
}

function set_one_time_alarm(time) {
    chrome.alarms.create(REFRESH_ALARM, {when: time} );
    chrome.alarms.get(REFRESH_ALARM, function(alarm) {
        var d = new Date(alarm.scheduledTime);
        console.log('Refreshing at: ' + d);
    });
}

// If notifications are enabled, display a notification.
function show_notification() {
    var opt = {
      type: "basic",
      title: "WaniKani",
      message: "You have new reviews on WaniKani!",
      iconUrl: "icon_128.png"
    };
    chrome.storage.sync.get("notifications", function(data) {
        if (data.notifications && data.notifications === "on") {
            chrome.notifications.create(
                "review",
                opt,
                function() {} // we don't need the callback, but it provides compatibility with old Chrome
            );
        }
    });
}

// Update the badge text.
function update_badge(badgeText) {
    var newBadgeText = badgeText;
    if (!newBadgeText || newBadgeText === '0') {
        newBadgeText = '';
    }
    chrome.browserAction.setBadgeText({ text: newBadgeText.toString() || '' });
}

// Update the extension's title with the next review time.
// 'type' can be either string or date
function update_title(type, content) {
    var titleString;
    var name = chrome.i18n.getMessage('wanikaninotify_name');
    if (type === 'date') {
        titleString = 'Next Review: ';
        if (content > Date.now()) {
            titleString += new Date(content).toString();
        } else {
            titleString += 'Now';
        }
    } else if (type === 'string') {
        titleString = content;
    }
    chrome.browserAction.setTitle({'title': name + ' - ' + titleString});
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
    chrome.storage.sync.get("api_key", function(data) {
        var api_key = data.api_key;
        if (!api_key) {
            chrome.tabs.create({url: "options.html"});
        } else {
            chrome.tabs.create({url: "https://www.wanikani.com"});
        }
    });
});

// When a notification is clicked:
chrome.notifications.onClicked.addListener(function () {
    chrome.tabs.create({url: "https://www.wanikani.com"});
    chrome.notifications.clear("review");
});


// When a "refresh" alarm goes off, fetch new data.
chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name === REFRESH_ALARM) {
        fetch_reviews();
    }
});

// If the content page sends a message, update local data.
chrome.extension.onMessage.addListener(function(request) {
    if (typeof request.reviews_available !== "undefined" ) {
        set_review_count(request.reviews_available);
    }
});

chrome.storage.onChanged.addListener(function(changes) {
    var key;
    for (key in changes) {
        if (changes.hasOwnProperty(key)) {
            if (key === 'api_key') {
                fetch_reviews();
            }
        }
    }
});

fetch_reviews();
