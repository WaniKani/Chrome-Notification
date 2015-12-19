// Copyright (c) 2015, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0


var is_complete = document.getElementById("notice");

if (is_complete) {
    chrome.extension.sendMessage({reviews_available: 0});
} else {

    var observer = new WebKitMutationObserver(function (mutations) {
        var is_complete = document.getElementById("notice");
        if (is_complete) {
            // If "Review Completed" appears, set reviews to 0
            chrome.extension.sendMessage({reviews_available: 0});
            // Prevent the observer from firing multiple times
            observer.disconnect();
        }
    });
    // Monitor to see if children of #reviews are added or removed.
    // Only fires when "Review Completed" appears.
    observer.observe(document, { childList: true, subtree: false, attributes:false, characterData: false });
}