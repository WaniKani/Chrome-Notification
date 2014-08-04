// Copyright (c) 2012, Derek Guenther
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

function isComplete(){
	(document.getElementById("review-queue-count") !== undefined && 
        document.getElementById("review-queue-count").textContent == "0");
}

if (isComplete()) {
    chrome.extension.sendMessage({reviews_available: 0});
} else {
    var observer = new WebKitMutationObserver(function (mutations) {
        if (isComplete()) {
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