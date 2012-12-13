// Copyright (c) 2012, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

function updateBadge() {
    chrome.storage.sync.get("api_key", function(data) {
        var api_key = data.api_key;
        if (!api_key) {
            chrome.browserAction.setBadgeText({text:"!"});
        } else {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                // Parse the JSON
                var json = xhr.responseText;
                json = JSON.parse(json);

                // Update the badge
                var reviews = json.requested_information.reviews_available;
                if (reviews === 0) {
                    chrome.browserAction.setBadgeText({ text:"" });
                } else {
                    chrome.browserAction.setBadgeText({ text:String(json.requested_information.reviews_available) });
                }

                // Schedule the next refresh
                var next_review = parseInt(String(json.requested_information.next_review_date + "000"), 10);
                if (next_review > Date.now()) {
                    // Refresh when it's time to study
                    chrome.alarms.create("refresh", {when:next_review} );
                    chrome.alarms.get("refresh", function(alarm) {
                        console.log("Refreshing at: " + String(alarm.scheduledTime));
                    });
                } else {
                    // Refresh every minute
                    console.log(Date.now().toString() + ": Refreshing in one minute.");
                    chrome.alarms.create("refresh", {delayInMinutes:1} );
                }
            };
            var url = "http://www.wanikani.com/api/v1.1/user/" + encodeURIComponent(api_key) + "/study-queue";
            xhr.open("GET", url);
            xhr.send();
        }
    });
}

chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.tabs.create({url: "options.html"});
    }
});

chrome.runtime.onSuspend.addListener(function () {
    console.log("Suspending.");
});

chrome.browserAction.onClicked.addListener(function() {
    chrome.browserAction.getBadgeText({}, function(result) {
        if (result === "!") {
            chrome.tabs.create({url: "options.html"});
        } else {
            chrome.tabs.create({url: "http://www.wanikani.com"});
        }
    });
});

chrome.alarms.onAlarm.addListener(function() { updateBadge(); });

updateBadge();
