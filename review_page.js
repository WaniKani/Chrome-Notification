// Copyright (c) 2012, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0


var is_complete = document.getElementById("review-completed");

if (is_complete) {
    // If the user clicks "Reviews" and they don't have any, "Review Completed" will appear right away,
    // so set reviews to 0 just to be safe.
    var is_complete = document.getElementById("review-completed");
    if (is_complete) {
        chrome.extension.sendMessage({reviews_available: 0});
    }
} else {
    // Watch the page to see if "Review Completed" appears.
    var bar = document.getElementById("reviews");

    var observer = new WebKitMutationObserver(function (mutations) {
        var is_complete = document.getElementById("review-completed");
        if (is_complete) {
            // If "Review Completed" appears, set reviews to 0
            chrome.extension.sendMessage({reviews_available: 0});
            // Prevent the observer from firing multiple times
            observer.disconnect();
        }
    });
    // Monitor to see if children of #reviews are added or removed.
    // Only fires when "Review Completed" appears.
    observer.observe(bar, { childList: true, subtree: false, attributes:false, characterData: false });
}